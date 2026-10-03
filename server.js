require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();

connectDB();

app.use(express.json());

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

// Socket connection
io.on('connection', (socket) => {

    console.log(
        `User connected: ${socket.user.username}`
    );

    console.log(
        `User ID: ${socket.user.userId}`
    );

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
                
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.user.userId
                });

                if (!conversation) {
                    return socket.emit('messageError', {
                        error: 'You are not a participant in this conversation'
                    });
                }
                const newMessage =
                    await Message.create({
                        sender: socket.user.userId,
                        conversation: conversationId,
                        text: text
                    });

                const populatedMessage =
                    await newMessage.populate(
                        'sender',
                        'username email'
                    );

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

        console.log(
            `User disconnected: ${socket.user.username}`
        );

    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});