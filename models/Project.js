const mongoose = require('mongoose');
const validator = require('validator');

// Project Schema
const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    creators: {
        type: [String],
        required: true,
    },
    websiteLink: {
        type: String,
        validate: {
            validator: function(v) {
                // Only validate if value is provided (not empty/null)
                return !v || validator.isURL(v);
            },
            message: (props) => `${props.value} is not a valid URL!`,
        },
        required: false, // Changed from true to false since it's optional
    },
    tags: {
        type: [String], // Changed from String to [String] array
        required: true,
    },
    imageUrl: {
        type: String,
        default: '',
    },
    year: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Create Project Model
const Project = mongoose.model('Project', projectSchema);
module.exports = Project;