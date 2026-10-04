const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWJmZTI5MzQ4ZDYyYjU4MWNmZGM2ZmEiLCJ1c2VybmFtZSI6Ikhlcm1lbGEzIiwiaWF0IjoxNzkxMTIzMTk2LCJleHAiOjE3OTExMjY3OTZ9.vYY4CRtj96AnXTFmobuU8Pd0B14HEbKf7SboD_V7kek';

const conversationId = '6ac25f8c483259e6a2e8effc';

const socket = io('http://localhost:3000', {
    auth: {
        token: token
    }
});

socket.on('connect', () => {
    console.log('User B connected!');
    console.log('Socket ID:', socket.id);

    socket.emit(
        'joinConversation',
        conversationId
    );

    socket.emit(
    'markAsRead',
    conversationId
    );

    setTimeout(() => {
    console.log('User B is waiting for messages...');
    }, 1000);
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