const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

class AuthController {
    register = asyncHandler(async(req, res) => {
        const user = await authService.register(req.body);

        res.status(201).json(
            ApiResponse.success(user, 'Registration successful! Please check your email for verification link', 201)
        );
    });

    login = asyncHandler(async(req, res) => {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const { user, accessToken, refreshToken } = await authService.login(
            email, password, ipAddress, userAgent
        );

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json(
            ApiResponse.success({ user, accessToken, refreshToken }, 'Login successful')
        );
    });

    logout = asyncHandler(async(req, res) => {
        const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
        await authService.logout(req.userId, refreshToken);

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json(ApiResponse.success(null, 'Logged out successfully'));
    });

    refreshToken = asyncHandler(async(req, res) => {
        const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
        const tokens = await authService.refreshAccessToken(refreshToken);

        // Update cookie
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json(ApiResponse.success(tokens, 'Token refreshed successfully'));
    });

    verifyEmail = asyncHandler(async(req, res) => {
        const { token } = req.params;
        await authService.verifyEmail(token);

        res.json(ApiResponse.success(null, 'Email verified successfully! You can now log in'));
    });

    forgotPassword = asyncHandler(async(req, res) => {
        const { email } = req.body;
        await authService.forgotPassword(email);

        res.json(
            ApiResponse.success(null, 'Password reset link sent to your email if account exists')
        );
    });

    resetPassword = asyncHandler(async(req, res) => {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);

        res.json(ApiResponse.success(null, 'Password reset successfully! Please log in'));
    });

    changePassword = asyncHandler(async(req, res) => {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.userId, currentPassword, newPassword);

        res.json(ApiResponse.success(null, 'Password changed successfully! Please log in again'));
    });

    resendVerificationEmail = asyncHandler(async(req, res) => {
        const { email } = req.body;
        await authService.resendVerificationEmail(email);

        res.json(ApiResponse.success(null, 'Verification email sent successfully'));
    });

    getCurrentUser = asyncHandler(async(req, res) => {
        res.json(ApiResponse.success(req.user, 'Current user retrieved successfully'));
    });
}

module.exports = new AuthController();