const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');
const { contactEmail } = require('../utils/emailTemplates');

router.post('/subscribe', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    // Send the subscription/contact email to the user
    await sendEmail({
      email: email,
      subject: `🎪 Welcome to EventSphere Newsletter, ${name}!`,
      message: `Hi ${name}, you have subscribed to the newsletter and new event added news will come to you!`,
      htmlMessage: contactEmail(name, message)
    });

    // We can also send a notification to the system email that a new contact was made
    if (process.env.EMAIL_USER) {
      await sendEmail({
         email: process.env.EMAIL_USER,
         subject: `New Contact Submission from ${name}`,
         message: `New contact submission.\nName: ${name}\nEmail: ${email}\nMessage: ${message || 'No message provided.'}`
      });
    }

    res.status(200).json({ message: 'Subscription successful. Check your email!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process request', error: err.message });
  }
});

module.exports = router;
