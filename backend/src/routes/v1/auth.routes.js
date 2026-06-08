// backend/src/routes/v1/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const { protect } = require('../../middleware/auth.middleware');
const {
    validate,
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation,
    refreshTokenValidation
} = require('../../validations/auth.validation');

// Public routes
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordValidation), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), authController.resetPassword);
router.get('/verify-email/:token', validate(verifyEmailValidation), authController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationValidation), authController.resendVerificationEmail);

// Protected routes
router.use(protect);
router.post('/logout', authController.logout);
router.post('/change-password', validate(changePasswordValidation), authController.changePassword);
router.get('/me', authController.getCurrentUser);

module.exports = router;