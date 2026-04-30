const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  purchaseDate: { type: Date, default: Date.now },
  price: { type: Number, required: true },
  ticketType: { type: String, enum: ['Standard', 'VIP', 'Meet & Greet'], default: 'Standard' },
  status: { type: String, enum: ['Booked', 'Cancelled'], default: 'Booked' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
