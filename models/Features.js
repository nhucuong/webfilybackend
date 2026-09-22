const mongoose = require('mongoose');

const FeaturesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    iconName: {
        type: String, 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Features', FeaturesSchema);