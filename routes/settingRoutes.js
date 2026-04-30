const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get a setting by key
router.get('/:key', async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      // Default initial states
      if (req.params.key === 'globalBanner') {
        return res.json({ value: 'Free Palestine 🇵🇸 🕊️ 🍉 | Humanity & Justice For All 🕊️ 🍉 🇵🇸 | Standing in Solidarity with Palestine 🇵🇸 🍉 🕊️' });
      }
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update setting (Organizer only)
router.put('/:key', protect, authorize('Organizer'), async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      setting = new Setting({ key: req.params.key, value: req.body.value });
    } else {
      setting.value = req.body.value;
    }
    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
