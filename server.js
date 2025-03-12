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

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Save files in the 'uploads' directory
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
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://via.placeholder.com"]
    }
  }
}));
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded files
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
    const projects = await Project.find().sort({ createdAt: -1 }); // Fetch all projects from the database
    
    // Process each project to ensure tags are in the right format
    const processedProjects = projects.map(project => {
      // Convert project to a regular object
      const projectObj = project.toObject();
      
      // Ensure tags is always an array
      if (typeof projectObj.tags === 'string') {
        projectObj.tags = projectObj.tags.split(/[\s,]+/).filter(Boolean);
      } else if (!Array.isArray(projectObj.tags)) {
        projectObj.tags = [];
      }
      
      return projectObj;
    });
    
    res.json(processedProjects); // Send the processed projects as JSON
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
    res.render('admin', { user: req.session.userId }); // Renders Admin Panel
  } else {
    res.render('adminlogin', { error: null }); // Pass null error to template
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
  try {
    const { fullName, email, username, password, confirmPassword } = req.body;

    // Validate inputs
    if (!fullName || !email || !username || !password) {
      return res.status(400).send("All fields are required.");
    }
    
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    // Check if email or username already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).send("Email or Username already exists.");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new admin to the database
    const newAdmin = new Admin({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.redirect('/admin'); // Redirect to login page after successful registration
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send("Error creating admin: " + err.message);
  }
});

// Handle Admin Login
app.post('/adminlogin', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).render('adminlogin', { error: 'Username and password are required' });
  }

  try {
    // Check if Admin model has loginAdmin method
    if (typeof Admin.loginAdmin !== 'function') {
      // Manual login implementation if method doesn't exist
      const admin = await Admin.findOne({ username });
      
      if (!admin) {
        return res.status(400).render('adminlogin', { error: 'Invalid username or password' });
      }
      
      const isMatch = await bcrypt.compare(password, admin.password);
      
      if (!isMatch) {
        return res.status(400).render('adminlogin', { error: 'Invalid username or password' });
      }
      
      req.session.userId = admin._id;
    } else {
      // Use the model's login method if it exists
      const admin = await Admin.loginAdmin(username, password);
      req.session.userId = admin._id;
    }

    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).render('adminlogin', { error: 'Failed to save session' });
      }
      res.redirect('/admin');
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(400).render('adminlogin', { error: error.message || 'Login failed' });
  }
});

// Handle Project Upload
app.post('/admin/project', upload.single('projectImage'), async (req, res) => {
  try {
    const { title, description, creators, websiteLink, tags, year } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Ensure all required fields are present
    if (!title || !description || !year) {
      throw new Error('Title, description, and year are required fields');
    }

    // Process tags to ensure they're stored as an array
    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags;
      } else if (typeof tags === 'string') {
        tagsArray = tags.split(/[\s,]+/).filter(Boolean);
      }
    }

    // Process creators to ensure they're stored as an array
    let creatorsArray = [];
    if (creators) {
      if (Array.isArray(creators)) {
        creatorsArray = creators;
      } else if (typeof creators === 'string') {
        creatorsArray = creators.split(/[\s,]+/).filter(Boolean);
      }
    }

    const newProject = new Project({
      title,
      description,
      creators: creatorsArray,
      websiteLink: websiteLink || null, // Optional field
      tags: tagsArray,
      year: parseInt(year, 10) || new Date().getFullYear(),
      imageUrl,
      createdAt: new Date()
    });

    await newProject.save();
    res.redirect('/admin'); // Redirect to admin panel or success page
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(400).send('Error saving project: ' + error.message);
  }
});

// Handle News Upload
app.post('/admin/news', upload.single('newsImage'), async (req, res) => {
  try {
    const { title, content, category, date } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    const newNews = new News({
      title,
      content,
      imageUrl,
      category: category || 'Uncategorized',
      date: date ? new Date(date) : new Date(),
    });

    await newNews.save();
    res.redirect('/admin');
  } catch (error) {
    console.error('Error saving news:', error);
    res.status(400).send('Error saving news: ' + error.message);
  }
});

// Logout route
app.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/admin');
  });
});

app.get('/check-session', (req, res) => {
  if (req.session.userId) {
    res.send(`Session active. Admin ID: ${req.session.userId}`);
  } else {
    res.send('No active session.');
  }
});

// Route to load projects
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render('projects', { projects }); // Render to a template named "projects"
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).send('Error fetching projects');
  }
});

// Get individual project
app.get('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send('Project not found');
    }
    res.render('project-detail', { project });
  } catch (error) {
    console.error('Error fetching project:', error.message);
    res.status(500).send('Error fetching project');
  }
});

// Error Handling Middleware
app.use((req, res, next) => {
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send('Internal Server Error');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));