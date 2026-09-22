const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    pageId: { 
        type: Number,
        required: true,
        unique: true,
        enum: [1, 2, 3]
    },
    content: { 
        type: String, 
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model('PageDetail', pageSchema);
