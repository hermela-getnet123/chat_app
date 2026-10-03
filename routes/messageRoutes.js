const express = require('express');

const router = express.Router();

const {
    getMessages,
    createMessage
} = require('../controllers/messageController');

const protect = require('../middleware/authMiddleware');

router.get('/messages', protect, getMessages);

router.post('/messages', protect, createMessage);

module.exports = router;