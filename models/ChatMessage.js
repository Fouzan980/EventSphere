const mongoose = require('mongoose');

/**
 * ChatMessage — messages are stored AES-256-CBC encrypted on the server.
 * The `message` and `imageData` fields contain "ivHex:ciphertextHex" values
 * produced by utils/chatCrypto.js. Clients NEVER see raw ciphertext; the
 * server decrypts before emitting via Socket.IO or returning via REST.
 */
const chatMessageSchema = new mongoose.Schema({
  senderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName:   { type: String, required: true },
  senderRole:   { type: String, enum: ['Organizer', 'Exhibitor'], required: true },
  receiverId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverName: { type: String, required: true },

  // Stored encrypted (AES-256-CBC). Decrypted by server before sending to clients.
  message:   { type: String, default: '' },   // encrypted text
  imageData: { type: String, default: '' },   // encrypted image data URI or GIF URL
  imageType: { type: String, default: '' },   // mime type / 'gif' — stored plain
  isDeleted: { type: Boolean, default: false },

  read: { type: Boolean, default: false },
}, { timestamps: true });

chatMessageSchema.index({ senderId: 1, receiverId: 1 });
chatMessageSchema.index({ receiverId: 1, read: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
