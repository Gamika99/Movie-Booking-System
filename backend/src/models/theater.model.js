const mongoose = require('mongoose');

const theaterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Theater name is required'],
        trim: true
    },
    address: {
        street: String,
        city: { type: String, required: true, index: true },
        state: String,
        pincode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contactNumber: String,
    email: String,
    facilities: [{
        type: String,
        enum: ['Parking', 'Food Court', 'Wheelchair Access', 'Dolby Atmos', '4DX', 'IMAX']
    }],
    images: [String],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

theaterSchema.index({ 'address.city': 1 });
theaterSchema.index({ name: 'text' });

module.exports = mongoose.model('Theater', theaterSchema);