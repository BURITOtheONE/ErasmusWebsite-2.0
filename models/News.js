// models/News.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, required: true }, // keep required as you wanted
  category: { type: String, default: '' },
  templateName: { type: String, default: '' }, // optional helper for server-rendered local pages
  link: { type: String, required: false }, // must be provided (required)
  date: { type: Date, required: true }
});

module.exports = mongoose.model('News', newsSchema);
