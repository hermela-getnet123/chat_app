const express = require('express');

const router = express.Router();

const messages = require('../data');

router.get('/messages', (req, res) => {
    res.json(messages);
});

router.post('/messages', (req, res) => {
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

module.exports = router;