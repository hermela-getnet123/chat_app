const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWJmNzhjMzUyMWY0MDQwYmZjY2E5M2MiLCJ1c2VybmFtZSI6Ikhlcm1lbGEyIiwiaWF0IjoxNzkxMTIzMTIwLCJleHAiOjE3OTExMjY3MjB9.ZMLIJfy9YD7boRxxQnJGMtFls2BsE4zyKd1paU5rEUw';

const conversationId = '6ac25f8c483259e6a2e8effc';

const socket = io('http://localhost:3000', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('User A connected!');
    console.log('Socket ID:', socket.id);

    socket.emit(
        'joinConversation',
        conversationId
    );

    socket.emit(
    'markAsRead',
    conversationId
    );

    socket.emit('sendMessage', {
        conversationId: conversationId,
        text: 'Hello from Hermela2!'
    });

    socket.emit(
        'typing',
        conversationId
    );
});

socket.on('userTyping', (user) => {
    console.log(`${user.username} is typing...`);
});

socket.on('userStoppedTyping', (user) => {
    console.log(`${user.userId} stopped typing.`);
});

socket.on('newMessage', (message) => {
    console.log('New message:', message);
});

socket.on('messageError', (error) => {
    console.log('Message error:', error);
});

socket.on('conversationError', (error) => {
    console.log('Conversation error:', error);
});

socket.on('connect_error', (error) => {
    console.log('Connection error:', error.message);
});

socket.on('userOnline', (user) => {
    console.log(`${user.username} is online`);
});

socket.on('userOffline', (user) => {
    console.log(`${user.username} is offline`);
});

socket.on('messagesRead', (data) => {
    console.log(
        `Messages read by ${data.userId}`
    );
});