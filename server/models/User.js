const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin'],
    default: 'Admin'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);
