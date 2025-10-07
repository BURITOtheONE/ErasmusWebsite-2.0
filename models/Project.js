const mongoose = require('mongoose');
const validator = require('validator');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    creators: {
        type: [String],
        required: [true, 'Creators are required'],
        validate: {
            validator: arr => Array.isArray(arr) && arr.length > 0,
            message: 'At least one creator is required'
        }
    },
    websiteLink: {
        type: String,
        default: ''
    },
    tags: {
        type: [String],
        required: [true, 'Tags are required'],
        validate: {
            validator: arr => Array.isArray(arr) && arr.length > 0,
            message: 'At least one tag is required'
        }
    },
    imageUrl: {
        type: String,
        default: '',
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Create Project Model
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
