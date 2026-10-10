const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.query;

        if (!conversationId) {
            return res.status(400).json({
                error: 'Conversation ID is required'
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.userId
        });

        if (!conversation) {
            return res.status(403).json({
                error: 'You cannot access this conversation'
            });
        }

        const messages = await Message.find({
            conversation: conversationId
        })
            .populate('sender', 'username email')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error.message);
        res.status(500).json({
            error: 'Failed to get messages'
        });
    }
};

const createMessage = async (req, res) => {
    try {
        const { text, conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({
                error: 'Conversation ID is required'
            });
        }

        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                error: 'A non-empty message text is required'
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.userId
        });

        if (!conversation) {
            return res.status(403).json({
                error: 'You cannot send messages to this conversation'
            });
        }

        const newMessage = await Message.create({
            sender: req.user.userId,
            conversation: conversationId,
            text: text.trim()
        });

        await newMessage.populate('sender', 'username email');

        res.status(201).json({
            message: 'Message saved!',
            data: newMessage
        });
    } catch (error) {
        console.error('Error creating message:', error.message);

        if (error.name === 'CastError') {
            return res.status(400).json({
                error: 'Invalid conversation ID'
            });
        }

        res.status(500).json({
            error: 'Failed to create message'
        });
    }
};

module.exports = {
    getMessages,
    createMessage
};