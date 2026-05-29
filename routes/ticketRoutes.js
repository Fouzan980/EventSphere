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
    if (req.user.role === 'Organizer' || req.user.role === 'Exhibitor') {
      return res.status(403).json({ message: 'Event booking is restricted to Attendees only.' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if the event has already ended
    const isPast = event.endDate ? new Date(event.endDate) < new Date() : new Date(event.date) < new Date();
    if (isPast) {
      return res.status(400).json({ message: 'This event has already ended.' });
    }

    // Check if the event is marked as sold out
    if (event.soldOut) {
      return res.status(400).json({ message: 'This event is sold out.' });
    }

    const ticketType = req.body.ticketType || 'Standard';

    // Check if the specific ticket tier is sold out
    if (event.hasMultipleTickets && event.tickets && event.tickets.length > 0) {
      const matchedTicket = event.tickets.find(t => t.name.toLowerCase() === ticketType.toLowerCase());
      if (matchedTicket && matchedTicket.soldOut) {
        return res.status(400).json({ message: `The ${ticketType} ticket tier is sold out.` });
      }
    }

    const existingTicket = await Ticket.findOne({ user: req.user.id, event: event._id });
    if (existingTicket) {
      return res.status(400).json({ message: 'You have already booked a ticket for this event.' });
    }

    let finalPrice = event.price || 0;
    if (event.hasMultipleTickets && event.tickets && event.tickets.length > 0) {
      const matchedTicket = event.tickets.find(t => t.name.toLowerCase() === ticketType.toLowerCase());
      if (matchedTicket) {
        finalPrice = matchedTicket.price || 0;
      } else {
        if (ticketType === 'VIP') finalPrice = finalPrice * 2;
        if (ticketType === 'Meet & Greet') finalPrice = finalPrice * 4;
      }
    } else {
      if (ticketType === 'VIP') finalPrice = finalPrice * 2;
      if (ticketType === 'Meet & Greet') finalPrice = finalPrice * 4;
    }

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
      htmlMessage: ticketConfirmEmail(user.name, event, ticket),
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
