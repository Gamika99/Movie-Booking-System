const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Movie title is required'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [30, 'Duration must be at least 30 minutes'],
        max: [240, 'Duration cannot exceed 240 minutes']
    },
    language: {
        type: [String],
        required: [true, 'Language is required'],
        enum: ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali']
    },
    genre: {
        type: [String],
        required: [true, 'Genre is required'],
        enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Sci-Fi', 'Animation', 'Documentary']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Release date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    poster: {
        type: String,
        required: [true, 'Poster is required']
    },
    trailerUrl: String,
    cast: [{
        name: String,
        role: String,
        image: String
    }],
    crew: [{
        name: String,
        role: String
    }],
    rating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    isNowShowing: {
        type: Boolean,
        default: false
    },
    isUpcoming: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['coming-soon', 'now-showing', 'ended'],
        default: 'coming-soon'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ status: 1, releaseDate: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });

module.exports = mongoose.model('Movie', movieSchema);