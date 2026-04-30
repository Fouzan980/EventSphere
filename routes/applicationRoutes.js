const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');
const {
  applicationSubmittedEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
  newApplicationNotifyEmail,
} = require('../utils/emailTemplates');
const logActivity = require('../utils/logActivity');

// ─── GET applications ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'Exhibitor') {
      const apps = await Application.find({ exhibitorId: req.user.id }).populate('eventId', 'title date');
      return res.json(apps);
    }
    const apps = await Application.find()
      .populate('exhibitorId', 'name companyName email')
      .populate('eventId', 'title');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST — Exhibitor submits application ─────────────────────────────────────
router.post('/', protect, authorize('Exhibitor'), async (req, res) => {
  try {
    const { eventId, boothId, message, companyWebsite, productCategory, boothSizePreference, expectedVisitors } = req.body;
    const app = await Application.create({
      eventId, exhibitorId: req.user.id, boothId, message,
      companyWebsite, productCategory, boothSizePreference, expectedVisitors
    });

    // Fetch extra data for emails
    const exhibitor = await User.findById(req.user.id);
    const event     = await Event.findById(eventId).populate('organizer');

    // 1. Notify exhibitor — application received
    sendEmail({
      email: exhibitor.email,
      subject: `📋 Application Submitted — ${event?.title || 'Event'}`,
      message: `Your application has been submitted successfully.`,
      htmlMessage: applicationSubmittedEmail(exhibitor.name, event?.title || 'the event', exhibitor.companyName),
    }).catch(err => console.warn('⚠️ App-submitted email failed:', err.message));

    // 2. Notify organizer — new application received
    if (event?.organizer?.email) {
      sendEmail({
        email: event.organizer.email,
        subject: `📬 New Exhibitor Application — ${event.title}`,
        message: `A new exhibitor application was submitted.`,
        htmlMessage: newApplicationNotifyEmail(
          event.organizer.name,
          exhibitor.name,
          exhibitor.companyName,
          event.title,
        ),
      }).catch(err => console.warn('⚠️ New-app notify email failed:', err.message));
    }

    await logActivity(req.user.id, 'Application Submitted', `You submitted an application for ${event?.title || 'an event'}.`);

    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT — Organizer approves/rejects ────────────────────────────────────────
router.put('/:id/status', protect, authorize('Organizer'), async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' | 'Rejected'
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('exhibitorId', 'name email companyName')
      .populate('eventId', 'title');

    // Assign booth if approved
    let boothLabel = null;
    if (status === 'Approved' && app.boothId) {
      const Booth = require('../models/Booth');
      const booth = await Booth.findByIdAndUpdate(
        app.boothId,
        { status: 'Assigned', assignedTo: app.exhibitorId._id },
        { new: true }
      );
      boothLabel = booth ? `Booth ${booth.label || booth._id}` : null;
    }

    // Email exhibitor
    if (app.exhibitorId?.email) {
      const emailFn = status === 'Approved' ? applicationApprovedEmail : applicationRejectedEmail;
      const subject = status === 'Approved'
        ? `🎊 Your Application Was Approved — ${app.eventId?.title}`
        : `📋 Application Update — ${app.eventId?.title}`;
      sendEmail({
        email: app.exhibitorId.email,
        subject,
        message: `Your application status has been updated to: ${status}.`,
        htmlMessage: status === 'Approved'
          ? applicationApprovedEmail(app.exhibitorId.name, app.eventId?.title, boothLabel)
          : applicationRejectedEmail(app.exhibitorId.name, app.eventId?.title),
      }).catch(err => console.warn('⚠️ Status-update email failed:', err.message));
    }

    await logActivity(req.user.id, `Application ${status}`, `You marked an application as ${status} for event ${app.eventId?.title}.`);

    res.json(app);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
