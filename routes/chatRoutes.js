const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const https = require('https');
const { decryptMessage } = require('../utils/chatCrypto');

// ── GET /api/chat/contacts ────────────────────────────────────────────────────
// Organizers → all Exhibitors
// Exhibitors  → all Organizers
router.get('/contacts', protect, async (req, res) => {
  try {
    const { role } = req.user;

    let targetRole;
    if (role === 'Organizer') targetRole = 'Exhibitor';
    else if (role === 'Exhibitor') targetRole = 'Organizer';
    else return res.status(403).json({ message: 'Only Organizers and Exhibitors can use chat' });

    const contacts = await User.find({ role: targetRole })
      .select('name avatar companyName role verificationStatus')
      .sort({ name: 1 });

    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/chat/messages/:otherId ──────────────────────────────────────────
// Fetch full conversation between current user and otherId.
// Also marks all incoming unread messages as read.
router.get('/messages/:otherId', protect, async (req, res) => {
  try {
    const userId   = req.user._id;
    const { otherId } = req.params;

    // Verify other party exists and is the correct role
    const other = await User.findById(otherId).select('role');
    if (!other) return res.status(404).json({ message: 'User not found' });

    // Mark incoming messages as read
    await ChatMessage.updateMany(
      { senderId: otherId, receiverId: userId, read: false },
      { read: true }
    );

    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId,  receiverId: otherId },
        { senderId: otherId, receiverId: userId  },
      ],
    }).sort({ createdAt: 1 }).limit(300).lean();

    res.json(messages.map(decryptMessage));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/chat/unread ──────────────────────────────────────────────────────
// Returns unread counts keyed by senderId
router.get('/unread', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const mongoose = require('mongoose');

    const unread = await ChatMessage.aggregate([
      { $match: { receiverId: new mongoose.Types.ObjectId(userId.toString()), read: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } },
    ]);

    const result = {};
    unread.forEach(u => { result[u._id.toString()] = u.count; });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /api/chat/messages/:id ────────────────────────────────────────────
// Only the sender can delete their own message.
router.delete('/messages/:id', protect, async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.senderId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    await msg.deleteOne();
    res.json({ success: true, _id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/chat/giphy?type=trending|search&q=... ────────────────────────────
// Proxy to avoid Giphy 403/CORS issues from browser direct calls.
router.get('/giphy', protect, async (req, res) => {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return res.status(500).json({ message: 'Giphy key not configured' });

  const { type = 'trending', q = '', limit = 24 } = req.query;
  let path;
  if (type === 'search' && q.trim()) {
    path = `/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`;
  } else {
    path = `/v1/gifs/trending?api_key=${key}&limit=${limit}&rating=g`;
  }

  const options = { hostname: 'api.giphy.com', path, method: 'GET' };
  const proxyReq = https.request(options, (proxyRes) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => res.status(502).json({ message: 'Giphy proxy error: ' + e.message }));
  proxyReq.end();
});

module.exports = router;
