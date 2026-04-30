const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  boothNumber: { type: String, required: true },
  label: { type: String },
  status: { type: String, enum: ['Available', 'Pending', 'Assigned'], default: 'Available' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Grid-based visual placement
  gridArea: {
    startCol: { type: Number },
    startRow: { type: Number },
    endCol: { type: Number },
    endRow: { type: Number }
  },
  // Physical dimensions
  widthM: { type: Number, default: 3 },
  depthM: { type: Number, default: 3 },
  areaM2: { type: Number, default: 9 },
  notes: { type: String },
  // Legacy x/y coordinates
  coordinates: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booth', boothSchema);

