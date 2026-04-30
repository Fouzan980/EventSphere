const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  time: { type: String, default: '10:00 AM' },
  endTime: { type: String },
  location: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  description: { type: String },
  price: { type: Number, default: 0 },
  capacity: { type: Number, default: 100 },
  hasMultipleTickets: { type: Boolean, default: false },
  tickets: [{
    name: { type: String },
    price: { type: Number },
    capacity: { type: Number },
    features: { type: String },
    soldOut: { type: Boolean, default: false }
  }],
  category: { type: String, default: 'Expo' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  poster: { type: String },
  banner: { type: String },
  discounts: { type: String },
  websiteLink: { type: String },
  dressCode: { type: String },
  isFeatured: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  speakers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Speaker' }],
  sessions: [{
    date: { type: String },
    title: { type: String },
    time: { type: String },
    speaker: { type: String },
    speakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Speaker' },
    location: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
