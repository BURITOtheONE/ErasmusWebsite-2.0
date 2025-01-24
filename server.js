require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Admin = require('./models/Admin');
const Project = require('./models/Project');
const News = require('./models/News');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const app = express();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads')); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Save files with a unique name
  }
});

// Initialize multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    const filetypes = /jpg|jpeg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI, // MongoDB URI
    }),
    cookie: {
      secure: false, // Under Production
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.set('view engine', 'ejs');

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB", err));

// API to fetch projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find(); // Fetch all projects from the database
    res.json(projects); // Send the projects as JSON
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));

app.get('/admin', (req, res) => {
  console.log('Session User ID:', req.session.userId); // Log session info

  if (req.session.userId) {
    res.render('admin'); // Renders Admin Panel
  } else {
    res.render('adminlogin'); // Redirects to login if not authenticated
  }
});

// Route for Admin Register page
app.get('/adminregister', (req, res) => {
  if (!req.session.userId) {
    res.render('adminregister');  // Renders Admin Register form
  } else {
    res.redirect('/admin');  // Redirect to Admin Panel if already logged in
  }
});

// Route for Admin Registration (POST)
app.post('/register-admin', async (req, res) => {
  const { fullName, email, username, password, confirmPassword } = req.body;

  // Validate inputs
  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match.");
  }

  // Check if email or username already exists
  const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
  if (existingAdmin) {
    return res.status(400).send("Email or Username already exists.");
  }

  // Hash the password
  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    if (err) {
      return res.status(500).send("Error hashing password");
    }

    // Save the new admin to the database
    const newAdmin = new Admin({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    try {
      await newAdmin.save();
      res.send("Admin created successfully.");
    } catch (err) {
      res.status(500).send("Error saving admin.");
    }
  });
});

// Handle Admin Login
app.post('/adminlogin', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, password }); // Log credentials from the form

  try {
    const admin = await Admin.loginAdmin(username, password);
    console.log('Login successful:', admin); // Log the returned admin object
    req.session.userId = admin._id; // Store the admin's ID in the session

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).send('Failed to save session.');
      }
      console.log('Session saved:', req.session.userId); // Debug log
      res.redirect('/admin'); // Redirect to the admin panel
    });
    
  } catch (error) {
    console.error('Login error:', error.message); // Log the error for debugging
    res.status(400).render('adminlogin', { error: error.message });
  }
});

// Handle Project Upload
app.post('/admin/project', upload.single('projectImage'), async (req, res) => {
  try {
    // Debugging: Log req.body and req.file
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    const { title, description, creators, websiteLink, tags, year } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Ensure all required fields are present
    if (!title || !description || !creators || !year || !imageUrl) {
      throw new Error('All required fields must be filled');
    }

    // Convert tags (array or space-separated string) into a single string
    const tagsString = Array.isArray(tags) ? tags.join(' ') : tags;

    const newProject = new Project({
      title,
      description,
      creators: creators ? creators.split(' ') : [],
      websiteLink: websiteLink || null, // Optional field
      tags: tagsString, // Save tags as a single concatenated string
      year,
      imageUrl,
    });

    await newProject.save();
    res.redirect('/admin'); // Redirect to admin panel or success page
  } catch (error) {
    console.error('Error saving project:', error.message); // Log error details
    res.status(400).send('Error saving project: ' + error.message);
  }
});

// Handle News Upload
app.post('/admin/news', upload.single('newsImage'), async (req, res) => {
  const { title, content, category, date } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Get image path

  try {
      const newNews = new News({
          title,
          content,
          imageUrl, // Save image path in DB
          category,
          date,
      });

      await newNews.save();
      res.redirect('/admin'); // Redirect to admin panel or success page
  } catch (error) {
      res.status(400).send('Error saving news: ' + error.message);
  }
});

app.get('/check-session', (req, res) => {
  if (req.session.userId) {
    res.send(`Session active. Admin ID: ${req.session.userId}`);
  } else {
    res.send('No active session.');
  }
});

// Route to load projects
app.get('/project', async (req, res) => {
  try {
    const projects = await Project.find(); // Fetch all projects
    res.render('project', { projects }); // Render to a template named "projects"
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).send('Error fetching projects');
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
