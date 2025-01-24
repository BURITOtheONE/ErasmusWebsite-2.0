const mongoose = require('mongoose');

// News Schema
const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String, // Path to the uploaded image
        required: true,
    },
    category: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        required: true,
    },
});

// Create News Model
const News = mongoose.model('News', newsSchema);

module.exports = News;