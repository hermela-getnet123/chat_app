const express = require('express');

const router = express.Router();

router.get('/messages', (req, res) => {
    res.json(messages);
});

router.get('/test-error', (req, res) => {
    throw new Error('Something went wrong!');
});

const { getMessages, createMessage } = require('../controllers/messageController');

router.get('/messages', getMessages);
router.post('/messages', createMessage);


module.exports = router;