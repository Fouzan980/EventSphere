const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  role:          { type: String, enum: ['Organizer', 'Exhibitor', 'Attendee'], default: 'Attendee' },
  // Profile fields
  companyName:   { type: String },
  bio:           { type: String, maxlength: 500 },
  phone:         { type: String },
  website:       { type: String },
  avatar:        { type: String },   // base64 data-url or external URL
  niche:         { type: String },
  // Verification
  isVerified:           { type: Boolean, default: false },
  verificationStatus:   { type: String, enum: ['None', 'Pending', 'Verified', 'Rejected'], default: 'None' },
  verificationDocument: { type: String },
  // Security
  loginAttempts: { type: Number, default: 0 },
  lockUntil:    { type: Date },
  lockCount:    { type: Number, default: 0 },
  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
