const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWJmNzhjMzUyMWY0MDQwYmZjY2E5M2MiLCJ1c2VybmFtZSI6Ikhlcm1lbGEyIiwiaWF0IjoxNzkxMDUzMTM4LCJleHAiOjE3OTEwNTY3Mzh9.zRM-gGMaOlFNCh3zGfMAskj-kroxUEUzPHhIIbYwgfE';

const socket = io('http://localhost:3000', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('Connected to Socket.IO!');
    console.log('Socket ID:', socket.id);

    socket.emit(
        'joinConversation',
        '6ac1508f152deefd07ec214a'
    );

    socket.emit('sendMessage', {
    conversationId: '6ac1508f152deefd07ec214a',
    text: 'Hello from Socket.IO!'
});
});

socket.on('connect_error', (error) => {
    console.log('Connection error:', error.message);
});

socket.on('newMessage', (message) => {
    console.log('New message:', message);
});

socket.on('messageError', (error) => {
    console.log('Message error:', error);
});

