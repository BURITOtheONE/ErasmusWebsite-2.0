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
                // Allow empty strings without validation
                if (!v || v === '') return true;
                return validator.isURL(v);
            },
            message: (props) => `${props.value} is not a valid URL!`,
        },
        default: '',
    },
    tags: {
        type: String,
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

// Pre-save hook to clean tags
projectSchema.pre('save', function(next) {
    // Make sure tags is properly formatted - it will be handled as a space-separated string
    if (this.tags && typeof this.tags !== 'string') {
        this.tags = Array.isArray(this.tags) ? this.tags.join(' ') : String(this.tags);
    }
    next();
});

// Create Project Model
const Project = mongoose.model('Project', projectSchema);
module.exports = Project;