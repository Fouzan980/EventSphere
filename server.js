require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const startEventReminders = require('./cron/eventReminders');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');
const { encrypt, decryptMessage } = require('./utils/chatCrypto');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 10e6, // 10 MB — needed for image payloads
});

// Auth middleware: validate JWT on socket connect
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id || decoded.id;
    // Fetch full user from DB — JWT only stores id+role, not name
    const dbUser = await User.findById(userId).select('name role');
    if (!dbUser) return next(new Error('User not found'));
    socket.user = { _id: dbUser._id.toString(), name: dbUser.name, role: dbUser.role };
    next();
  } catch (err) {
    next(new Error('Auth failed: ' + err.message));
  }
});

// Organizer ↔ Exhibitor — no event requirement
const canChat = async (userRole, otherId) => {
  const other = await User.findById(otherId).select('role');
  if (!other) return false;
  if (userRole === 'Organizer') return other.role === 'Exhibitor';
  if (userRole === 'Exhibitor') return other.role === 'Organizer';
  return false;
};

// Track online users: userId → Set of socketIds (multi-tab support)
const onlineUsers = new Map(); // userId → socketId count

// Notify contacts of this user's online status
const broadcastPresence = async (userId, userRole, isOnline) => {
  try {
    const contactRole = userRole === 'Organizer' ? 'Exhibitor' : 'Organizer';
    const contacts = await User.find({ role: contactRole }).select('_id');
    contacts.forEach(c => {
      io.to(`user:${c._id}`).emit('presence', { userId, isOnline });
    });
  } catch(e) { /* ignore */ }
};

io.on('connection', (socket) => {
  const { _id: userId, name: userName, role: userRole } = socket.user;

  // Each user joins their personal delivery room
  socket.join(`user:${userId}`);
  console.log(`[chat] connected: ${userName} (${userRole}) id=${userId}`);

  // ── Presence tracking ───────────────────────────────────────────────────────
  const prev = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, prev + 1);
  if (prev === 0) broadcastPresence(userId, userRole, true); // first tab → online

  // ── Send message (server-side AES-256-CBC encrypted) ──────────────────────
  // Client sends plaintext; server encrypts before writing to MongoDB.
  // Server decrypts before emitting back to clients — DB never holds plaintext.
  socket.on('send_message', async ({ receiverId, message, imageData, imageType }) => {
    try {
      const hasText  = message?.trim();
      // Accept data URIs AND external URLs (Giphy CDN links)
      const hasImage = imageData && (imageData.startsWith('data:image') || imageData.startsWith('http'));
      if (!hasText && !hasImage) return;
      if (!receiverId) return;

      if (!(await canChat(userRole, receiverId))) {
        socket.emit('chat_error', { message: 'Not authorised to chat' });
        return;
      }
      const receiver = await User.findById(receiverId).select('name');
      if (!receiver) return;

      // Encrypt before storing
      const saved = await ChatMessage.create({
        senderId:     userId,
        senderName:   userName,
        senderRole:   userRole,
        receiverId,
        receiverName: receiver.name,
        message:   encrypt(hasText   ? message.trim() : ''),
        imageData: encrypt(hasImage  ? imageData      : ''),
        imageType: imageType || '',
      });

      // Decrypt before sending to clients (they only see plaintext)
      const payload = decryptMessage(saved.toObject());
      io.to(`user:${receiverId}`).emit('new_message', payload);
      io.to(`user:${userId}`).emit('new_message', payload);
    } catch (err) {
      console.error('send_message error:', err);
    }
  });


  // ── Typing indicator ────────────────────────────────────────────────────────
  socket.on('typing', ({ receiverId, isTyping }) => {
    io.to(`user:${receiverId}`).emit('typing', { senderId: userId, isTyping });
  });

  // ── Mark messages as read ───────────────────────────────────────────────────
  socket.on('mark_read', async ({ senderId }) => {
    try {
      await ChatMessage.updateMany(
        { senderId, receiverId: userId, read: false },
        { read: true }
      );
      io.to(`user:${senderId}`).emit('messages_read', { readBy: userId });
    } catch (err) {
      console.error('mark_read error:', err);
    }
  });

  // ── Delete message ───────────────────────────────────────────────────────────
  socket.on('delete_message', async ({ messageId, receiverId }) => {
    try {
      const msg = await ChatMessage.findById(messageId);
      if (!msg || msg.senderId.toString() !== userId) return;
      msg.isDeleted = true;
      msg.message = '';
      msg.imageData = '';
      await msg.save();
      // notify both sides
      io.to(`user:${userId}`).emit('message_deleted', { _id: messageId });
      io.to(`user:${receiverId}`).emit('message_deleted', { _id: messageId });
    } catch (err) {
      console.error('delete_message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[chat] disconnected: ${userName}`);
    const remaining = (onlineUsers.get(userId) || 1) - 1;
    if (remaining <= 0) {
      onlineUsers.delete(userId);
      broadcastPresence(userId, userRole, false);
    } else {
      onlineUsers.set(userId, remaining);
    }
  });

  // Let client query who's online from their contact list
  socket.on('get_online', async (contactIds, cb) => {
    const result = {};
    (contactIds || []).forEach(id => { result[id] = onlineUsers.has(id); });
    if (typeof cb === 'function') cb(result);
  });
});

// ── Express middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/events',       require('./routes/eventRoutes'));
app.use('/api/events/:eventId/booths', require('./routes/boothRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/bookmarks',    require('./routes/bookmarkRoutes'));
app.use('/api/tickets',      require('./routes/ticketRoutes'));
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/contact',      require('./routes/contactRoutes'));
app.use('/api/logs',         require('./routes/logRoutes'));
app.use('/api/speakers',     require('./routes/speakerRoutes'));
app.use('/api/settings',     require('./routes/settingRoutes'));
app.use('/api/spotify',      require('./routes/spotifyRoutes'));
app.use('/api/person',       require('./routes/personRoutes'));
app.use('/api/payments',     require('./routes/paymentRoutes'));
app.use('/api/chat',         require('./routes/chatRoutes'));
app.use('/api/analytics',    require('./routes/analyticsRoutes'));

app.get('/', (req, res) => res.json({ status: 'ok', message: 'EventSphere API is running.' }));

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  startEventReminders();
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('MongoDB connection error:', err));
