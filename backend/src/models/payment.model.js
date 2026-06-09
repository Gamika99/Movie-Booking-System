const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        unique: true
    },
    paymentGateway: {
        type: String,
        enum: ['stripe', 'razorpay', 'dummy'],
        default: 'dummy'
    },
    gatewayResponse: mongoose.Schema.Types.Mixed,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date
}, {
    timestamps: true
});

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ userId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);