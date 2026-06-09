const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        unique: true,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    showId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Show',
        required: true
    },
    theaterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater'
    },
    seats: [{
        seatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seat'
        },
        seatNumber: String,
        seatType: String,
        price: Number
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    convenienceFee: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'expired'],
        default: 'pending'
    },
    bookingTime: {
        type: Date,
        default: Date.now
    },
    expiryTime: {
        type: Date,
        required: true
    },
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ showId: 1, status: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ expiryTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);