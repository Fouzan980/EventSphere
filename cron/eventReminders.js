const cron = require('node-cron');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const sendEmail = require('../utils/sendEmail');
const { eventReminderEmail } = require('../utils/emailTemplates');

const startEventReminders = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // Target time is exactly 6 hours from now
      const targetTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      
      const events = await Event.find({ reminderSent: false });

      for (const event of events) {
        if (!event.date || !event.time) continue;
        
        // Parse event.date and event.time to create an exact JS Date object
        const eventDateStr = event.date.toISOString().split('T')[0];
        // Ensure time string is like "14:30" (if "2:30 PM", we should convert, but usually time input is 24-hour "HH:mm")
        // The HTML time input gives 24-hour format (e.g., "14:00")
        const eventStartStr = `${eventDateStr}T${event.time}:00`;
        const eventStartDate = new Date(eventStartStr);
        
        // Calculate difference in hours
        const timeDiffMs = eventStartDate.getTime() - now.getTime();
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

        // If the event starts in roughly 6 hours (between 5.5 and 6.5 hours from now)
        if (timeDiffHours >= 5.5 && timeDiffHours <= 6.5 && !event.reminderSent) {
          const tickets = await Ticket.find({ event: event._id }).populate('user');
          
          for (const ticket of tickets) {
            if (ticket.user && ticket.user.email) {
              sendEmail({
                email: ticket.user.email,
                subject: `⏳ Reminder: ${event.title} is starting in 6 hours!`,
                message: `Hi ${ticket.user.name}, ${event.title} is starting today in 6 hours!`,
                htmlMessage: eventReminderEmail(ticket.user.name, event),
              }).catch(err => console.warn('Reminder email failed:', err.message));
            }
          }
          
          event.reminderSent = true;
          await event.save();
        }
      }
    } catch (err) {
      console.error('Error running event reminder cron job:', err);
    }
  });
};

module.exports = startEventReminders;
