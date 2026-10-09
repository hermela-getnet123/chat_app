const express = require('express');

const router = express.Router();

const protect = require('../middleware/authMiddleware');
router.get('/messages', protect, getMessages);

const {
    createConversation,
    getConversations
} = require('../controllers/conversationController');

router.post(
    '/conversations',
    protect,
    createConversation
);

router.get(
    '/conversations',
    protect,
    getConversations
);

module.exports = router;