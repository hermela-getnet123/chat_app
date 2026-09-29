const express = require('express');

const router = express.Router();

const messages = require('../data');

router.get('/messages', (req, res) => {
    res.json(messages);
});

router.post('/messages', (req, res) => {
    const { sender, text } = req.body;

    if (!sender) {
        return res.status(400).json({
            error: 'Sender is required'
        });
    }

    if (!text) {
        return res.status(400).json({
            error: 'Message text is required'
        });
    }

    if (typeof text !== 'string') {
        return res.status(400).json({
            error: 'Message text must be a string'
        });
    }

    const newMessage = {
        id: Date.now(),
        sender: sender,
        text: text,
        createdAt: new Date()
    };

    messages.push(newMessage);

    res.status(201).json({
    message: 'Message saved!',
    data: newMessage
});
});

module.exports = router;