const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define Admin Schema
const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// Password Hashing Middleware
adminSchema.pre('save', async function (next) {
  // Hash the password before saving it to the database
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Method to compare passwords during login
adminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Static method to handle admin login
adminSchema.statics.loginAdmin = async function (username, password) {
  try {
    const admin = await this.findOne({ username }); // Find admin by username
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Compare the entered password with the hashed password stored in DB
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    return admin; // Return the found admin if login is successful
  } catch (error) {
    throw new Error(error.message);
  }
};

// Create Admin Model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
