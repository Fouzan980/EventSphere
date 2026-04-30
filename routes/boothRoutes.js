const express = require('express');
const router = express.Router({ mergeParams: true });
const Booth = require('../models/Booth');
const { protect, authorize } = require('../middleware/authMiddleware');
const logActivity = require('../utils/logActivity');

router.route('/')
  .get(async (req, res) => {
    try {
      const booths = await Booth.find({ eventId: req.params.eventId }).populate('assignedTo', 'name companyName');
      res.json(booths);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  .post(protect, authorize('Organizer'), async (req, res) => {
    try {
      const { boothNumber, label, coordinates, gridArea, widthM, depthM, areaM2, notes, assignedTo } = req.body;
      const booth = await Booth.create({
        eventId: req.params.eventId,
        boothNumber, label, coordinates, gridArea, widthM, depthM, areaM2, notes,
        assignedTo: assignedTo || null,
        status: assignedTo ? 'Assigned' : 'Available'
      });
      await logActivity(req.user.id, 'Booth Added', `You successfully configured booth ${booth.label || booth.boothNumber}.`);
      res.status(201).json(booth);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

// DELETE a specific booth
router.delete('/:boothId', protect, authorize('Organizer'), async (req, res) => {
  try {
    await Booth.findByIdAndDelete(req.params.boothId);
    res.json({ message: 'Booth deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

