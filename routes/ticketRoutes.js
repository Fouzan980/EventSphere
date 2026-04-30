const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const { ticketConfirmEmail } = require('../utils/emailTemplates');

// ─── Book a ticket ────────────────────────────────────────────────────────────
router.post('/book/:eventId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existingTicket = await Ticket.findOne({ user: req.user.id, event: event._id });
    if (existingTicket) {
      return res.status(400).json({ message: 'You have already booked a ticket for this event.' });
    }

    const ticketType = req.body.ticketType || 'Standard';
    let finalPrice = event.price || 0;
    if (ticketType === 'VIP') finalPrice = finalPrice * 2;
    if (ticketType === 'Meet & Greet') finalPrice = finalPrice * 4;

    const ticket = await Ticket.create({
      user: req.user.id,
      event: event._id,
      price: finalPrice,
      ticketType
    });

    // Fetch full user to get name/email
    const user = await User.findById(req.user.id);

    // Send confirmation email for ALL bookings (free and paid)
    sendEmail({
      email: user.email,
      subject: `🎉 Ticket Confirmed — ${event.title}`,
      message: `Hi ${user.name}, your ${ticketType} ticket for ${event.title} is confirmed!`,
      htmlMessage: ticketConfirmEmail(user.name, event),
    }).catch(err => console.warn('⚠️ Ticket-confirm email failed:', err.message));

    res.status(201).json({ message: 'Ticket booked successfully', ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Get user's tickets ───────────────────────────────────────────────────────
router.get('/my-tickets', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).populate('event');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
