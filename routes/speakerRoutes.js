const express = require('express');
const router = express.Router();
const Speaker = require('../models/Speaker');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET all speakers (searchable)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? { name: { $regex: q, $options: 'i' } }
      : {};
    const speakers = await Speaker.find(filter).populate('addedBy', 'name').sort({ name: 1 });
    res.json(speakers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create speaker (Organizer only)
router.post('/', protect, authorize('Organizer'), async (req, res) => {
  try {
    const { name, role, bio, photo, genre, expertise, socialLink } = req.body;
    const speaker = await Speaker.create({
      name, role, bio, photo, genre, expertise, socialLink,
      addedBy: req.user.id,
    });
    res.status(201).json(speaker);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update speaker (Organizer who created it)
router.put('/:id', protect, authorize('Organizer'), async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
    if (speaker.addedBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    const updated = await Speaker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE speaker
router.delete('/:id', protect, authorize('Organizer'), async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id);
    if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
    if (speaker.addedBy.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    await Speaker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Speaker removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
