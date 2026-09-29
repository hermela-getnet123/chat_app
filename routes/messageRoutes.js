const express = require('express');

const router = express.Router();

const messages = require('../data');

router.get('/messages', (req, res) => {
    res.json(messages);
});

router.get('/test-error', (req, res) => {
    throw new Error('Something went wrong!');
});

const { createMessage } = require('../controllers/messageController');

router.post('/messages', createMessage);


module.exports = router;