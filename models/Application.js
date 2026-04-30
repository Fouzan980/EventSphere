const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  boothId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booth' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  message: { type: String },
  companyWebsite: { type: String },
  productCategory: { type: String },
  boothSizePreference: { type: String, default: 'Standard (3x3m)' },
  expectedVisitors: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
