const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

// Create an Express app
const app = express();

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to parse JSON
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like your JS, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/erasmus', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("Failed to connect to MongoDB", err));

// Define Project Schema
const projectSchema = new mongoose.Schema({
  title: String,
  year: Number,
  description: String,
  tags: [String],
});

// Create a Model based on the Schema
const Project = mongoose.model('Project', projectSchema);

// Route to get projects from MongoDB (API endpoint)
app.get('/api/project', async (req, res) => {
  try {
    const { search, sortBy, tag } = req.query;

    let query = Project.find();

    if (search) {
      query = query.where({ $text: { $search: search } });
    }

    if (tag) {
      query = query.where('tags').in([tag]);
    }

    if (sortBy === 'year') {
      query = query.sort({ year: 1 });
    }

    const project = await query.exec();
    res.json(project);
  } catch (error) {
    res.status(500).send('Error fetching projects');
  }
});

// Default route (index)
app.get('/', (req, res) => {
  res.render('index');  // Renders /
});

// Route for About page
app.get('/about', (req, res) => {
  res.render('about');  // Renders about.ejs
});

// Route for Contact page
app.get('/contact', (req, res) => {
  res.render('contact');  // Renders contact.ejs
});

// Route for Admin page
app.get('/admin', (req, res) => {
  res.render('admin');  // Renders contact.ejs
});

// Route to render the projects page (EJS view)
app.get('/project', async (req, res) => {
  try {
    // Fetch all projects from the database
    const project = await Project.find().exec();
    res.render('project', { project }); // Pass projects to the EJS template
  } catch (error) {
    res.status(500).send('Error fetching projects for rendering');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
