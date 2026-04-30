const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Attendee
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  exhibitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, bookmark specific stall
}, { timestamps: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
