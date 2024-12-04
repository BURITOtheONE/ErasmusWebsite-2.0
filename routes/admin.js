// routes/admin.js
const express = require('express');
const router = express.Router();
const News = require('../models/News');

// Route to display the admin page with all news
router.get('/admin', async (req, res) => {
    try {
        const news = await News.find();  // Get all news articles
        res.render('admin', { news });
    } catch (error) {
        console.error(error);
        res.send('Error retrieving news.');
    }
});

// Route to handle adding a new news article
router.post('/admin/add-news', async (req, res) => {
    const { title, content } = req.body;
    try {
        const newNews = new News({ title, content });
        await newNews.save();
        res.redirect('/admin'); // Redirect back to admin page
    } catch (error) {
        console.error(error);
        res.send('Error adding news.');
    }
});

// Route to handle editing a news article
router.get('/admin/edit-news/:id', async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        res.render('edit-news', { news });
    } catch (error) {
        console.error(error);
        res.send('Error retrieving news article.');
    }
});

// Route to update a news article
router.post('/admin/edit-news/:id', async (req, res) => {
    const { title, content } = req.body;
    try {
        await News.findByIdAndUpdate(req.params.id, { title, content });
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.send('Error updating news.');
    }
});

module.exports = router;

// Route to display all news articles on news.ejs page
router.get('/news', async (req, res) => {
    try {
        const news = await News.find();
        res.render('news', { news });
    } catch (error) {
        console.error(error);
        res.send('Error retrieving news.');
    }
});
