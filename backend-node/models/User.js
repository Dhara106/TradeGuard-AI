const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
      'Please provide a valid @gmail.com email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6
  },
  // Whether the user has verified their email address
  isVerified: {
    type: Boolean,
    default: false
  },
  // Token sent via email for account verification
  verificationToken: {
    type: String
  },
  // Expiry timestamp for the verification token (24 hours)
  verificationExpires: {
    type: Date
  },
  // Token sent via email for password reset
  resetPasswordToken: {
    type: String
  },
  // Expiry timestamp for the reset token (1 hour)
  resetPasswordExpires: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving.
// Mongoose 9 async middleware does NOT receive a `next` callback — the returned
// promise IS the completion signal. Returning early when the password is
// unchanged is essential: otherwise saves that don't touch the password (email
// verification, setting a reset token) would re-hash the already-hashed value
// and permanently lock the user out.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
