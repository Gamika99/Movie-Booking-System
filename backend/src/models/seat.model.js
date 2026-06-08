const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    screenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Screen',
        required: true
    },
    row: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    seatType: {
        type: String,
        enum: ['Normal', 'Premium', 'VIP', 'Recliner'],
        default: 'Normal'
    },
    priceMultiplier: {
        type: Number,
        default: 1.0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBooked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

seatSchema.index({ screenId: 1, row: 1, number: 1 }, { unique: true });
seatSchema.index({ screenId: 1, isActive: 1 });

module.exports = mongoose.model('Seat', seatSchema);