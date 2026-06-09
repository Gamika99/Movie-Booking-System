const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const emailService = require('./email.service');
const redisClient = require('../config/redis');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class AuthService {
    async register(userData) {
        // Check if user exists
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new ApiError(400, 'User already exists with this email');
        }

        // Create verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create user
        const user = await userRepository.create({
            ...userData,
            emailVerificationToken,
            emailVerificationExpires
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        // Send verification email
        try {
            await emailService.sendVerificationEmail(
                user.email,
                user.name,
                emailVerificationToken
            );
        } catch (error) {
            logger.error('Verification email failed:', error);
            // Don't throw error, user can request again
        }

        return userResponse;
    }

    async login(email, password, ipAddress, userAgent) {
        // Find user with password
        const user = await userRepository.findByEmail(email, true);

        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        // Check if user is blocked
        if (user.isBlocked) {
            throw new ApiError(403, 'Your account has been blocked. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Invalid email or password');
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            throw new ApiError(401, 'Please verify your email before logging in');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);

        // Store refresh token in database
        await userRepository.updateRefreshToken(user._id, refreshToken);

        // Store session in Redis
        const sessionData = {
            userId: user._id,
            email: user.email,
            role: user.role,
            ipAddress,
            userAgent,
            createdAt: new Date().toISOString()
        };
        await redisClient.set(`session:${user._id}`, sessionData, 7 * 24 * 60 * 60);

        // Log login
        logger.info(`User logged in: ${user.email} from ${ipAddress}`);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            },
            accessToken,
            refreshToken
        };
    }

    async generateTokens(user) {
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        });

        const refreshToken = jwt.sign({ id: user._id },
            process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
        );

        return { accessToken, refreshToken };
    }

    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new ApiError(401, 'Refresh token required');
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            // Find user with this refresh token
            const user = await userRepository.findByRefreshToken(refreshToken);

            if (!user) {
                throw new ApiError(401, 'Invalid refresh token');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user);

            // Update refresh token in database
            await userRepository.updateRefreshToken(user._id, tokens.refreshToken);

            return tokens;
        } catch (error) {
            throw new ApiError(401, 'Invalid or expired refresh token');
        }
    }

    async logout(userId, refreshToken) {
        // Remove refresh token from database
        await userRepository.updateRefreshToken(userId, null);

        // Remove session from Redis
        await redisClient.del(`session:${userId}`);

        // Blacklist the refresh token
        if (refreshToken) {
            const decoded = jwt.decode(refreshToken);
            if (decoded && decoded.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redisClient.set(`blacklist:${refreshToken}`, true, ttl);
                }
            }
        }

        logger.info(`User logged out: ${userId}`);
        return true;
    }

    async verifyEmail(token) {
        const user = await userRepository.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(400, 'Invalid or expired verification token');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        return user;
    }

    async forgotPassword(email) {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            // Don't reveal if user exists for security
            return true;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = passwordResetExpires;
        await user.save();

        // Send reset email
        try {
            await emailService.sendPasswordResetEmail(
                user.email,
                user.name,
                resetToken
            );
        } catch (error) {
            logger.error('Password reset email failed:', error);
            throw new ApiError(500, 'Failed to send reset email');
        }

        return true;
    }

    async resetPassword(token, newPassword) {
        const user = await userRepository.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new ApiError(400, 'Invalid or expired reset token');
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Clear all refresh tokens for this user
        await userRepository.updateRefreshToken(user._id, null);

        // Blacklist all sessions
        await redisClient.del(`session:${user._id}`);

        return true;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findById(userId, true);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        // Clear all refresh tokens
        await userRepository.updateRefreshToken(userId, null);

        return true;
    }

    async resendVerificationEmail(email) {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        if (user.isEmailVerified) {
            throw new ApiError(400, 'Email already verified');
        }

        // Generate new verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.emailVerificationToken = emailVerificationToken;
        user.emailVerificationExpires = emailVerificationExpires;
        await user.save();

        // Send verification email
        await emailService.sendVerificationEmail(
            user.email,
            user.name,
            emailVerificationToken
        );

        return true;
    }
}

module.exports = new AuthService();