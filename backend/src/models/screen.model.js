const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    theaterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theater',
        required: true
    },
    screenType: {
        type: String,
        enum: ['Standard', 'IMAX', '4DX', '3D', 'Dolby Atmos'],
        default: 'Standard'
    },
    totalSeats: {
        type: Number,
        required: true
    },
    seatLayout: {
        rows: Number,
        columns: Number
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

screenSchema.index({ theaterId: 1 });
screenSchema.index({ name: 1, theaterId: 1 }, { unique: true });

module.exports = mongoose.model('Screen', screenSchema);