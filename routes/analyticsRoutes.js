const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Event    = require('../models/Event');
const Ticket   = require('../models/Ticket');
const Application = require('../models/Application');
const Bookmark = require('../models/Bookmark');
const User     = require('../models/User');

// ─── GET /api/analytics/organizer ────────────────────────────────────────────
// Returns real analytics for the logged-in organizer
router.get('/organizer', protect, authorize('Organizer'), async (req, res) => {
  try {
    const organizerId = req.user.id;

    // 1. All events owned by this organizer
    const events = await Event.find({ organizer: organizerId }).lean();
    const eventIds = events.map(e => e._id);

    // 2. All tickets sold for these events
    const tickets = await Ticket.find({
      event: { $in: eventIds },
      status: 'Booked'
    }).populate('event', 'title date price capacity').lean();

    // 3. Applications to these events
    const applications = await Application.find({
      eventId: { $in: eventIds }
    }).lean();

    // 4. Bookmarks for these events
    const bookmarks = await Bookmark.find({
      event: { $in: eventIds }
    }).lean();

    // 5. Total attendees (unique users who booked)
    const uniqueAttendees = new Set(tickets.map(t => t.user?.toString())).size;

    // 6. Revenue by event (sum of ticket prices)
    const revenueByEvent = {};
    const ticketsByEvent = {};
    tickets.forEach(t => {
      const eId = t.event?._id?.toString();
      if (!eId) return;
      revenueByEvent[eId] = (revenueByEvent[eId] || 0) + (t.price || 0);
      ticketsByEvent[eId] = (ticketsByEvent[eId] || 0) + 1;
    });

    const totalRevenue = Object.values(revenueByEvent).reduce((s, v) => s + v, 0);
    const totalTickets = tickets.length;

    // 7. Monthly revenue & tickets (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthTickets = tickets.filter(t => {
        const pd = new Date(t.purchaseDate);
        return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
      });
      monthlyData.push({
        month: label,
        revenue: monthTickets.reduce((s, t) => s + (t.price || 0), 0),
        tickets: monthTickets.length,
      });
    }

    // 8. Top 5 events by ticket sales
    const topEvents = events
      .map(e => ({
        _id: e._id,
        title: e.title,
        tickets: ticketsByEvent[e._id.toString()] || 0,
        revenue: revenueByEvent[e._id.toString()] || 0,
        capacity: e.capacity || 100,
        date: e.date,
        category: e.category,
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5);

    // 9. Ticket type breakdown
    const typeBreakdown = {};
    tickets.forEach(t => {
      typeBreakdown[t.ticketType] = (typeBreakdown[t.ticketType] || 0) + 1;
    });

    // 10. Sell-through rate (tickets sold / total capacity across all events)
    const totalCapacity = events.reduce((s, e) => s + (e.capacity || 100), 0);
    const sellThroughRate = totalCapacity > 0
      ? Math.min(100, Math.round((totalTickets / totalCapacity) * 100))
      : 0;

    // 11. Upcoming vs past events
    const upcomingCount = events.filter(e => new Date(e.date) >= now).length;
    const pastCount = events.length - upcomingCount;

    // 12. Category breakdown
    const categoryBreakdown = {};
    events.forEach(e => {
      categoryBreakdown[e.category || 'Other'] = (categoryBreakdown[e.category || 'Other'] || 0) + 1;
    });

    // 13. Recent ticket activity (last 10)
    const recentTickets = tickets
      .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
      .slice(0, 10)
      .map(t => ({
        eventTitle: t.event?.title || 'Unknown',
        ticketType: t.ticketType,
        price: t.price,
        purchaseDate: t.purchaseDate,
      }));

    res.json({
      overview: {
        totalEvents: events.length,
        upcomingEvents: upcomingCount,
        pastEvents: pastCount,
        totalTickets,
        totalRevenue,
        uniqueAttendees,
        totalApplications: applications.length,
        totalBookmarks: bookmarks.length,
        sellThroughRate,
      },
      monthlyData,
      topEvents,
      typeBreakdown,
      categoryBreakdown,
      recentTickets,
    });
  } catch (err) {
    console.error('[analytics] error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/analytics/admin ─────────────────────────────────────────────────
// Platform-wide stats for Admin role
router.get('/admin', protect, authorize('Admin'), async (req, res) => {
  try {
    const [totalEvents, totalUsers, totalTickets, totalRevAgg] = await Promise.all([
      Event.countDocuments(),
      User.countDocuments(),
      Ticket.countDocuments({ status: 'Booked' }),
      Ticket.aggregate([{ $match: { status: 'Booked' } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
    ]);

    // Monthly platform revenue (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyAgg = await Ticket.aggregate([
      { $match: { status: 'Booked', purchaseDate: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$purchaseDate' }, month: { $month: '$purchaseDate' } },
        revenue: { $sum: '$price' },
        tickets: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      totalEvents,
      totalUsers,
      totalTickets,
      totalRevenue: totalRevAgg[0]?.total || 0,
      monthlyAgg,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
