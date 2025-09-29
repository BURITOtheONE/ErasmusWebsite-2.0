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
// add near the top with the other requires
const validator = require('validator');

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

// Session Configuration - UPDATED VERSION
app.use(
  session({
    secret: process.env.SESSION_SECRET || ' ',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600
    }),
    cookie: {
      secure: false, // Change to false for local testing
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax'
    },
  })
);

// Middleware
/*app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://use.fontawesome.com"],
      imgSrc: ["'self'", "data:", "https://via.placeholder.com", "blob:"],
      fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://use.fontawesome.com"],
      connectSrc: ["'self'"]
    }
  }
}));*/

app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded files

// Add route to serve Bootstrap files
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));

// Add route to serve Bootstrap icons
app.use('/icons', express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font')));

app.set('view engine', 'ejs');

// Trust reverse proxies like Render's load balancers
app.set('trust proxy', 1); 

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

// Add this temporary debugging route
app.get('/debug/projects', async (req, res) => {
  try {
    console.log('=== DEBUGGING PROJECTS ===');
    
    // Check connection
    console.log('Database connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    
    // Count total projects
    const count = await Project.countDocuments();
    console.log('Total projects in database:', count);
    
    // Get all projects with full details
    const projects = await Project.find();
    console.log('Raw projects from database:', JSON.stringify(projects, null, 2));
    
    // Check for any validation issues
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`, {
        id: project._id,
        title: project.title,
        tags: project.tags,
        tagsType: typeof project.tags,
        isArray: Array.isArray(project.tags)
      });
    });
    
    res.json({
      connectionState: mongoose.connection.readyState,
      databaseName: mongoose.connection.name,
      totalProjects: count,
      projects: projects
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Temporary route to fix existing project tags
app.get('/fix-project-tags', async (req, res) => {
  try {
    const projects = await Project.find();
    let updatedCount = 0;
    
    for (let project of projects) {
      let needsUpdate = false;
      let newTags = [];
      
      if (typeof project.tags === 'string') {
        newTags = project.tags.split(/[\s,]+/).filter(Boolean);
        needsUpdate = true;
      } else if (Array.isArray(project.tags)) {
        // Check if any array elements need splitting
        newTags = project.tags.flatMap(tag => 
          typeof tag === 'string' ? tag.split(/[\s,]+/).filter(Boolean) : [tag]
        );
        needsUpdate = JSON.stringify(newTags) !== JSON.stringify(project.tags);
      }
      
      if (needsUpdate) {
        await Project.findByIdAndUpdate(project._id, { tags: newTags });
        updatedCount++;
        console.log(`Updated project "${project.title}" tags:`, newTags);
      }
    }
    
    res.json({ message: `Updated ${updatedCount} projects` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// API to fetch projects - FIXED VERSION
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    
    // Process each project to ensure tags are in the right format
    const processedProjects = projects.map(project => {
      const projectObj = project.toObject();
      
      // Ensure tags is always an array
      if (typeof projectObj.tags === 'string') {
        projectObj.tags = projectObj.tags.split(/[\s,]+/).filter(Boolean);
      } else if (!Array.isArray(projectObj.tags)) {
        projectObj.tags = [];
      }
      
      return projectObj;
    });
    
    res.json(processedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// API to fetch News
app.get('/api/news', async (req, res) => {
  try {
    const News = require('./models/News'); // adjust path if needed
    const news = await News.find().sort({ createdAt: -1 }).lean();

    const processedNews = news.map(item => {
      // Normalize tags: string -> array, ensure array
      if (typeof item.tags === 'string') {
        item.tags = item.tags.split(/[\s,]+/).filter(Boolean);
      } else if (!Array.isArray(item.tags)) {
        item.tags = [];
      }

      // Ensure a canonical 'link' field is present for client use
      item.link = item.link || item.websiteLink || item.url || '';

      return item;
    });

    res.json(processedNews);
  } catch (error) {
    console.error('Error fetching news:', error && error.message ? error.message : error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Server Routes
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));
app.get('/news', async (req, res) => {
  try {
    const newsItems = await News.find().sort({ date: -1 });
    res.render('news', { newsItems });
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).send('Error fetching news');
  }
});

// Custom project page
app.get('/projects/:page', (req, res) => {
  const page = req.params.page;
  res.render(`projects/${page}`); // looks inside /views/projects/
});

// Custom news page
app.get('/news/:page', (req, res) => {
  const page = req.params.page;
  res.render(`news/${page}`); // looks inside /views/news/
});

// Updated admin route with better logging and isAdmin variable
app.get('/admin', (req, res) => {
  console.log('Session data:', req.session);
  console.log('Session User ID:', req.session.userId);

  if (req.session.userId) {
    res.render('admin', { 
      user: req.session.userId,
      isAdmin: true // Add this line - if they're on the admin page, they're an admin
    });
  } else {
    res.render('adminlogin', { error: null });
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

// Handle Admin Login - FIXED VERSION
app.post('/adminlogin', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.render('adminlogin', { error: 'Username and password are required' });
  }

  try {
    // Find the admin by username
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      return res.render('adminlogin', { error: 'Invalid username or password' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.render('adminlogin', { error: 'Invalid username or password' });
    }
    
    // Set session userId
    req.session.userId = admin._id.toString(); // Convert ObjectId to string
    
    // Force session save before redirect
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.render('adminlogin', { error: 'Failed to save session' });
      }
      console.log('Session saved successfully, userId:', req.session.userId);
      return res.redirect('/admin');
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.render('adminlogin', { error: error.message || 'Login failed' });
  }
});

// REPLACE your existing app.post('/admin/project', ...) route with this robust version
app.post('/admin/project', (req, res) => {
  // wrap multer so we can catch multer-specific errors before running route logic
  upload.single('projectImage')(req, res, async (multerErr) => {
    try {
      if (multerErr) {
        console.error('Multer error:', multerErr);
        return res.status(400).send('File upload error: ' + multerErr.message);
      }

      console.log('--- New project submission ---');
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);

      const { title, description, creators, websiteLink, tags, year } = req.body;

      if (!title || !description || !year) {
        return res.status(400).send('Title, description and year are required.');
      }

      const parseToArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
        return String(value).split(/[\s,;,+]+/).map(s => s.trim()).filter(Boolean);
      };

      let creatorsArray = parseToArray(creators);
      let tagsArray = parseToArray(tags);

      if (creatorsArray.length === 0) creatorsArray = ['Unknown'];
      if (tagsArray.length === 0) tagsArray = ['General'];

      const yearNumber = parseInt(year, 10);
      if (isNaN(yearNumber)) return res.status(400).send('Year must be a number.');

      const website = (websiteLink && validator.isURL(websiteLink, { require_protocol: true })) ? websiteLink : '';

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

      const project = new Project({
        title: String(title).trim(),
        description: String(description).trim(),
        creators: creatorsArray,
        websiteLink: website,
        tags: tagsArray,
        year: yearNumber,
        imageUrl,
        createdAt: new Date()
      });

      await project.save();
      console.log('Project saved:', project._id);
      return res.redirect('/admin');
    } catch (err) {
      console.error('Error saving project:', err);
      if (err.name === 'ValidationError') {
        const msgs = Object.values(err.errors).map(e => e.message).join('; ');
        return res.status(400).send('Validation error: ' + msgs);
      }
      return res.status(500).send('Internal Server Error: ' + (err.message || 'unknown'));
    }
  });
});

// Handle News Upload
app.post('/admin/news', upload.single('newsImage'), async (req, res) => {
  try {
    const { title, content, category, date, websiteLink } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate required fields
    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    // Validate websiteLink if provided; store canonical 'link' as well
    const link = (websiteLink && validator.isURL(websiteLink, { require_protocol: true })) ? websiteLink : '';

    const newNews = new News({
      title,
      content,
      imageUrl,
      category: category || 'Uncategorized',
      date: date ? new Date(date) : new Date(),
      websiteLink: websiteLink || '',
      link: link // store a dedicated link field for the client
    });

    await newNews.save();
    res.redirect('/admin');
  } catch (error) {
    console.error('Error saving news:', error);
    res.status(400).send('Error saving news: ' + error.message);
  }
});

// Add this route to handle project deletion
app.delete('/api/projects/:id', async (req, res) => {
  try {
    // Check if user is logged in as admin
    if (!req.session.userId) {
      return res.status(401).send('Unauthorized');
    }
    
    const projectId = req.params.id;
    const deletedProject = await Project.findByIdAndDelete(projectId);
    
    if (!deletedProject) {
      return res.status(404).send('Project not found');
    }
    
    // If project had an image, delete it from the uploads folder
    if (deletedProject.imageUrl) {
      const imagePath = path.join(__dirname, deletedProject.imageUrl.replace(/^\//, ''));
      // Check if file exists before attempting to delete
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(200).send('Project deleted successfully');
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).send('Error deleting project');
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

// Update the projects route to pass admin status to the template
app.get('/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    // Check if user is admin and pass that info to template
    const isAdmin = !!req.session.userId;
    res.render('projects', { projects, isAdmin }); // Pass isAdmin to the template
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
    // Pass admin status to the template
    const isAdmin = !!req.session.userId;
    res.render('project-detail', { project, isAdmin });
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