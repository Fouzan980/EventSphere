const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Booth = require('../models/Booth');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const { eventCreatedEmail } = require('../utils/emailTemplates');
const logActivity = require('../utils/logActivity');

// ─── GET Proxy for Photon (Komoot) Autocomplete ──────────────────────────────
router.get('/geocode/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    // Bias to Pakistan bounding box: lon 60-77, lat 23-37
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&bbox=60,23,77,37`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EventSphere-App' }
    });
    const data = await response.json();

    const suggestions = (data.features || [])
      .filter(f => {
        // Only Pakistan results
        if (f.properties.country && f.properties.country !== 'Pakistan') return false;
        // Must have at least a city OR a name that isn't just a state
        const hasSpecific = f.properties.name || f.properties.street || f.properties.district
          || f.properties.suburb || f.properties.neighbourhood || f.properties.city;
        return !!hasSpecific;
      })
      .map(f => {
        const p = f.properties;
        // Build parts from most specific to broadest — Google Maps style
        const parts = [
          p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street,
          p.neighbourhood || p.suburb || p.district,
          // Only include name if it's different from street/neighbourhood
          (p.name && p.name !== p.street && p.name !== p.neighbourhood && p.name !== p.city) ? p.name : null,
          p.city,
          p.state,
          p.country,
        ].filter(Boolean);
        // Deduplicate adjacent identical segments
        const deduped = parts.filter((v, i) => v !== parts[i - 1]);
        const display_name = deduped.join(', ');
        return { display_name, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
      })
      // Filter out bare "State, Pakistan" results with no locality
      .filter(s => s.display_name.split(',').length >= 2)
      // Deduplicate by display_name
      .filter((s, i, arr) => arr.findIndex(x => x.display_name === s.display_name) === i)
      .slice(0, 5);

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: 'Geocoding proxy failed' });
  }
});

// ─── GET Proxy for Google Reverse Geocode (pin → address) ───────────────────
router.get('/geocode/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Reverse geocoding failed' });
  }
});

// ─── GET all events / POST create event ──────────────────────────────────────
router.route('/')
  .get(async (req, res) => {
    try {
      const events = await Event.find()
        .populate('organizer', 'name companyName')
        .populate('speakers', 'name role photo genre expertise bio socialLink');
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, authorize('Organizer'), async (req, res) => {
    try {
      const { title, date, time, location, coordinates, description, price, category, capacity, poster, discounts, sessions, websiteLink, dressCode, isFeatured, speakers } = req.body;
      const event = await Event.create({
        title, date, time, location, coordinates, description, price, category, capacity, poster, discounts, sessions, websiteLink, dressCode, isFeatured: isFeatured || false, speakers: speakers || [],
        organizer: req.user.id,
      });

      const organizer = await User.findById(req.user.id);
      sendEmail({
        email: organizer.email,
        subject: `🚀 Event Published — ${event.title}`,
        message: `Your event "${event.title}" has been successfully created.`,
        htmlMessage: eventCreatedEmail(organizer.name, event),
      }).catch(err => console.warn('⚠️ Event-created email failed:', err.message));

      await logActivity(req.user.id, 'Event Created', `You successfully published the event: ${event.title}`);

      res.status(201).json(event);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

// ─── GET/PUT/DELETE event by id ───────────────────────────────────────────────
router.route('/:id')
  .get(async (req, res) => {
    try {
      const event = await Event.findById(req.params.id).populate('organizer', 'name companyName');
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.json(event);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .put(protect, authorize('Organizer'), async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.organizer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this event' });
      }
      const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedEvent);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  })
  .delete(protect, authorize('Organizer'), async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.organizer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this event' });
      }
      await Event.findByIdAndDelete(req.params.id);
      await Booth.deleteMany({ eventId: req.params.id });
      res.json({ message: 'Event removed' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
