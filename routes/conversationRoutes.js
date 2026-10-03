const express = require('express');

const router = express.Router();

const protect = require('../middleware/authMiddleware');

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