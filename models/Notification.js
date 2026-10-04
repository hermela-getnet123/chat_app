const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },

    message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },

    type: {
        type: String,
        default: 'message'
    },

    isRead: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model(
    'Notification',
    notificationSchema
);

module.exports = Notification;