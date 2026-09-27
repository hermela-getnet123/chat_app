const express = require('express');

const app = express();

const messages = [];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Chat server is running!');
});

app.get('/users', (req, res) => {
    res.send('Users endpoint');
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.post('/messages', (req, res) => {
    const newMessage = req.body;

    if (!newMessage.text) {
        return res.status(400).json({
            error: 'Message text is required'
        });
    }

    if (typeof newMessage.text !== 'string') {
        return res.status(400).json({
            error: 'Message text must be a string'
        });
    }

    messages.push(newMessage);

    res.json({
        message: 'Message saved!',
        data: newMessage
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
