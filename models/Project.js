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
            validator: (v) => validator.isURL(v),
            message: (props) => `${props.value} is not a valid URL!`,
        },
        required: true,
    },
    tags: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: '', // Default to an empty string
    },
    year: {
        type: Number,
        required: true,
    },
});

// Create Project Model
const Project = mongoose.model('Project', projectSchema);
module.exports = Project;