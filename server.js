require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const startEventReminders = require('./cron/eventReminders');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/events/:eventId/booths', require('./routes/boothRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/speakers', require('./routes/speakerRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/spotify', require('./routes/spotifyRoutes'));
app.use('/api/person', require('./routes/personRoutes'));



const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  startEventReminders();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
