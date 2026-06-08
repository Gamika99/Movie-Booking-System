const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        if (process.env.NODE_ENV === 'production') {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // Use ethereal.email for development
            this.createTestAccount();
        }
    }

    async createTestAccount() {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        logger.info(`Test email account created: ${testAccount.user}`);
    }

    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                from: `"Movie Booking System" <${process.env.EMAIL_FROM}>`,
                to,
                subject,
                html,
                text
            };

            const info = await this.transporter.sendMail(mailOptions);

            if (process.env.NODE_ENV === 'development') {
                logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }

            return info;
        } catch (error) {
            logger.error('Email sending failed:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendVerificationEmail(email, name, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Movie Booking System!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with Movie Booking System. Please verify your email address to complete your registration.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link: ${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Movie Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `Welcome to Movie Booking System! Please verify your email by visiting: ${verificationUrl}`;

        return await this.sendEmail({
            to: email,
            subject: 'Verify Your Email Address',
            html,
            text
        });
    }

    async sendPasswordResetEmail(email, name, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
            <p>Or copy and paste this link: ${resetUrl}</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Movie Booking System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return await this.sendEmail({
            to: email,
            subject: 'Reset Your Password',
            html,
            text: `Reset your password by visiting: ${resetUrl}`
        });
    }

    async sendBookingConfirmation(email, name, bookingDetails) {
        // Will implement in booking module
        return true;
    }
}

module.exports = new EmailService();