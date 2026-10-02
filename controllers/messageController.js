const Message = require('../models/Message');

const getMessages = async (req, res) => {
    try {
        const messages = await Message.find();

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error.message);

        res.status(500).json({
            error: 'Failed to get messages'
        });
    }
};

const createMessage = async (req, res) => {
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

    const newMessage = await Message.create({
        sender: sender,
        text: text
    });

    res.status(201).json({
        message: 'Message saved!',
        data: newMessage
    });
};

module.exports = {
    getMessages,
    createMessage
};