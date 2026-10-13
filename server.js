
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Notification = require('./models/Notification');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use(require('./routes/messageRoutes'));
app.use(require('./routes/userRoutes'));
app.use(require('./routes/authRoutes'));
app.use(require('./routes/conversationRoutes'));

app.get('/', (req, res) => {
    res.send('Chat server is running!');
});

app.use((err, req, res, next) => {
    console.error('Express error:', err.message);
    res.status(500).json({
        error: 'Something went wrong on the server'
    });
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// userId -> Set of socket IDs.
// This supports one user connected in multiple browser tabs.
const onlineUsers = new Map();

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        socket.user = jwt.verify(token, process.env.JWT_SECRET);

        if (!socket.user.userId) {
            return next(new Error('Invalid token payload'));
        }

        next();
    } catch (error) {
        next(new Error('Invalid or expired token'));
    }
});

io.on('connection', (socket) => {
    const userId = String(socket.user.userId);
    const username = socket.user.username || 'User';
    const wasOffline = !onlineUsers.has(userId);

    // A personal room lets us notify all of this user's tabs.
    socket.join(`user:${userId}`);

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    // Send the updated online list to this connection.
    socket.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // Tell other connected clients this user is online.
    if (wasOffline) {
        socket.broadcast.emit('userOnline', {
            userId,
            username
        });
    }

    console.log(`${username} connected`);

    socket.on('joinConversation', async (conversationId) => {
        try {
            if (!conversationId) return;

            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId
            });

            if (!conversation) {
                return socket.emit('conversationError', {
                    error: 'You are not a participant in this conversation'
                });
            }

            socket.join(`conversation:${conversationId}`);

            console.log(`${username} joined conversation ${conversationId}`);
        } catch (error) {
            console.error('Join conversation error:', error.message);

            socket.emit('conversationError', {
                error: 'Failed to join conversation'
            });
        }
    });

    socket.on('leaveConversation', (conversationId) => {
        if (conversationId) {
            socket.leave(`conversation:${conversationId}`);
        }
    });

    socket.on('typing', async ({ conversationId } = {}) => {
        if (!conversationId) return;

        const room = `conversation:${conversationId}`;
        if (!socket.rooms.has(room)) return;

        socket.to(room).emit('userTyping', {
            userId,
            username,
            conversationId
        });
    });

    socket.on('stopTyping', ({ conversationId } = {}) => {
        if (!conversationId) return;

        const room = `conversation:${conversationId}`;
        if (!socket.rooms.has(room)) return;

        socket.to(room).emit('userStoppedTyping', {
            userId,
            conversationId
        });
    });

    socket.on('sendMessage', async ({ conversationId, text } = {}) => {
        try {
            const messageText =
                typeof text === 'string' ? text.trim() : '';

            if (!conversationId || !messageText) {
                return socket.emit('messageError', {
                    error: 'Conversation ID and text are required'
                });
            }

            // Confirm the sender belongs to this conversation.
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId
            });

            if (!conversation) {
                return socket.emit('messageError', {
                    error: 'You are not a participant in this conversation'
                });
            }

            const newMessage = await Message.create({
                sender: userId,
                conversation: conversationId,
                text: messageText,
                readBy: [userId]
            });

            const populatedMessage = await Message.findById(newMessage._id)
                .populate('sender', 'username email');

            // Deliver the message to everyone currently in this chat room.
            io.to(`conversation:${conversationId}`).emit(
                'newMessage',
                populatedMessage
            );

            // Create and deliver a notification for each other participant.
            const populatedConversation = await Conversation.findById(
                conversationId
            ).populate('participants', 'username email');

            for (const participant of populatedConversation.participants) {
                const recipientId = String(participant._id);

                if (recipientId === userId) continue;

                try {
                    const notification = await Notification.create({
                        recipient: participant._id,
                        sender: userId,
                        conversation: conversationId,
                        message: newMessage._id,
                        type: 'message'
                    });

                    io.to(`user:${recipientId}`).emit('notification', {
                        id: String(notification._id),
                        type: 'message',
                        sender: {
                            id: userId,
                            username
                        },
                        conversationId: String(conversationId),
                        messageId: String(newMessage._id),
                        text: messageText,
                        createdAt: notification.createdAt
                    });
                } catch (notificationError) {
                    // A notification failure should not undo a sent message.
                    console.error(
                        'Notification error:',
                        notificationError.message
                    );
                }
            }
        } catch (error) {
            console.error('Socket message error:', error.message);

            socket.emit('messageError', {
                error: 'Failed to send message'
            });
        }
    });

    socket.on('markAsRead', async (conversationId) => {
        try {
            if (!conversationId) return;

            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId
            });

            if (!conversation) {
                return socket.emit('messageError', {
                    error: 'You cannot access this conversation'
                });
            }

            await Message.updateMany(
                {
                    conversation: conversationId,
                    sender: { $ne: userId },
                    readBy: { $ne: userId }
                },
                {
                    $addToSet: { readBy: userId }
                }
            );

            await Notification.updateMany(
                {
                    conversation: conversationId,
                    recipient: userId,
                    isRead: false
                },
                { $set: { isRead: true } }
            );

            io.to(`user:${userId}`).emit('notificationsRead', {
                conversationId: String(conversationId)
            });

            socket.to(`conversation:${conversationId}`).emit('messagesRead', {
                userId,
                conversationId
            });
        } catch (error) {
            console.error('Mark-as-read error:', error.message);

            socket.emit('messageError', {
                error: 'Failed to mark messages as read'
            });
        }
    });

    socket.on('disconnect', () => {
        const sockets = onlineUsers.get(userId);

        if (sockets) {
            sockets.delete(socket.id);

            // Only mark the user offline when their last socket disconnects.
            if (sockets.size === 0) {
                onlineUsers.delete(userId);

                io.emit('userOffline', {
                    userId,
                    username
                });
            }
        }

        console.log(`${username} disconnected`);
    });
});

server.listen(3000, () => {
    console.log('Chat server running on http://localhost:3000');
});