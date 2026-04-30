const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details) => {
  try {
    if (!userId) return;
    await ActivityLog.create({ user: userId, action, details });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
