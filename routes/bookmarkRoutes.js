const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, async (req, res) => {
    try {
      const bookmarks = await Bookmark.find({ userId: req.user.id })
        .populate('eventId', 'title date location')
        .populate('exhibitorId', 'companyName');
      res.json(bookmarks);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, async (req, res) => {
    try {
      const { eventId, exhibitorId } = req.body;
      const bz = await Bookmark.create({ userId: req.user.id, eventId, exhibitorId });
      res.status(201).json(bz);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

router.delete('/:id', protect, async (req, res) => {
  try {
    await Bookmark.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
