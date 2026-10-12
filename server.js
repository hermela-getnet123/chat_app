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

const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');

app.use(messageRoutes);
app.use(userRoutes);
app.use(authRoutes);
app.use(conversationRoutes);


app.get('/', (req, res) => {
    res.send('Chat server is running!');
});

app.use((err, req, res, next) => {
    console.error(err.message);

    res.status(500).json({
        error: 'Something went wrong on the server'
    });
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

// Socket authentication
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = decoded;

        next();

    } catch (error) {
        next(new Error('Invalid or expired token'));
    }
});

const onlineUsers = new Map();
// Socket connection
io.on('connection', (socket) => {
    const userId = String(socket.user.userId);

    // Tell this user who was already online.
    socket.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // Store this user's active socket.
    onlineUsers.set(userId, socket.id);

    // Notify everyone that this user is online.
    io.emit('userOnline', {
        userId,
        username: socket.user.username
    });

    console.log(`${socket.user.username} connected`);

        // Join conversation
    socket.on('joinConversation', async (conversationId) => {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: socket.user.userId
            });

            if (!conversation) {
                return socket.emit('conversationError', {
                    error: 'You are not a participant in this conversation'
                });
            }

            socket.join(`conversation:${conversationId}`);

            console.log(
                `${socket.user.username} joined conversation ${conversationId}`
            );

        } catch (error) {
            console.error(
                'Error joining conversation:',
                error.message
            );

            socket.emit('conversationError', {
                error: 'Failed to join conversation'
            });
        }
    });

    socket.on('typing', ({ conversationId }) => {
    if (!conversationId) return;

    const room = `conversation:${conversationId}`;
    if (!socket.rooms.has(room)) return;

    socket.to(room).emit('userTyping', {
        userId: String(socket.user.userId),
        username: socket.user.username,
        conversationId
    });
});

socket.on('stopTyping', ({ conversationId }) => {
    if (!conversationId) return;

    const room = `conversation:${conversationId}`;
    if (!socket.rooms.has(room)) return;

    socket.to(room).emit('userStoppedTyping', {
        userId: String(socket.user.userId),
        conversationId
    });
});

    socket.on('leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
});
    // Send message
    socket.on(
        'sendMessage',
        async ({ conversationId, text }) => {

            try {

                if (!conversationId || !text) {
                    return socket.emit('messageError', {
                        error:
                            'Conversation ID and text are required'
                    });
                }
                
                let conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.user.userId
                });

                if (!conversation) {
                    return socket.emit('messageError', {
                        error: 'You are not a participant in this conversation'
                    });
                }
               const newMessage = await Message.create({
                    sender: socket.user.userId,
                    conversation: conversationId,
                    text: text.trim(),
                    readBy: [socket.user.userId]
                });
                const populatedMessage =
                    await newMessage.populate(
                        'sender',
                        'username email'
                    );

                conversation = await Conversation
                    .findById(conversationId)
                    .populate('participants', 'username email');
                for (const participant of conversation.participants) {

            if (participant._id.toString() === socket.user.userId) {
                continue;
            }

            const notification = await Notification.create({
                recipient: participant._id,
                sender: socket.user.userId,
                conversation: conversationId,
                message: newMessage._id,
                type: 'message'
            });

            const recipientSocketId =
                onlineUsers.get(participant._id.toString());

            if (recipientSocketId) {

                io.to(recipientSocketId).emit(
                    'notification',
                    {
                        id: notification._id,
                        type: 'message',
                        sender: {
                            id: socket.user.userId,
                            username: socket.user.username
                        },
                        conversationId: conversationId,
                        messageId: newMessage._id,
                        text: text
                    }
                );
            }
        }
                io.to(
                    `conversation:${conversationId}`
                ).emit(
                    'newMessage',
                    populatedMessage
                );

            } catch (error) {

                console.error(
                    'Socket message error:',
                    error.message
                );

                socket.emit('messageError', {
                    error: 'Failed to send message'
                });
            }
        }
    );

    // Disconnect
socket.on('disconnect', () => {
    // Don't mark the user offline if this socket was replaced
    // by another connection for the same user.
    if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);

        io.emit('userOffline', {
            userId,
            username: socket.user.username
        });
    }

    console.log(`${socket.user.username} disconnected`);
});

socket.on('markAsRead', async (conversationId) => {
    try {
        const userId = String(socket.user.userId);

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

        socket.to(`conversation:${conversationId}`).emit('messagesRead', {
            userId,
            conversationId
        });
    } catch (error) {
        console.error('Error marking messages as read:', error.message);

        socket.emit('messageError', {
            error: 'Failed to mark messages as read'
        });
    }
});
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});