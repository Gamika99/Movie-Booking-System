const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payment.controller');
const { protect } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

router.use(protect);

router.get('/methods', paymentController.getPaymentMethods);
router.post('/webhook', paymentController.handleWebhook);
router.get('/history', paymentController.getPaymentHistory);

// Admin routes
router.get('/revenue',
    authorize('admin', 'super-admin'),
    paymentController.getRevenueStats
);

module.exports = router;