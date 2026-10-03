const Message = require('../models/Message');

const getMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('sender', 'username email');

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

        const newMessage = await Message.create({
            sender: req.user.userId,
            conversation: conversationId,
            text: text
        });

        res.status(201).json({
            message: 'Message saved!',
            data: newMessage
        });

    } catch (error) {
        console.error('Error creating message:', error.message);

        res.status(500).json({
            error: 'Failed to create message'
        });
    }
};

module.exports = {
    getMessages,
    createMessage
};