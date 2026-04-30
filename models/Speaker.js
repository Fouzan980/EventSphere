const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  role:       { type: String, default: 'Speaker' }, // Speaker, Musician, DJ, Performer, MC
  bio:        { type: String, maxlength: 1000 },
  photo:      { type: String },  // base64 or URL
  genre:      { type: String },  // for musicians
  expertise:  { type: String },  // for speakers
  socialLink: { type: String },
  addedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Speaker', speakerSchema);
