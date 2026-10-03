const Conversation = require('../models/Conversation');

const createConversation = async (req, res) => {
    try {
        const { participants } = req.body;

        if (!participants || !Array.isArray(participants)) {
            return res.status(400).json({
                error: 'Participants must be an array'
            });
        }

        if (participants.length < 1) {
            return res.status(400).json({
                error: 'At least one other participant is required'
            });
        }

        if (!participants.includes(req.user.userId)) {
            participants.push(req.user.userId);
        }

        const conversation = await Conversation.create({
            participants
        });

        res.status(201).json({
            message: 'Conversation created',
            data: conversation
        });

    } catch (error) {
        console.error(
            'Error creating conversation:',
            error.message
        );

        res.status(500).json({
            error: 'Failed to create conversation'
        });
    }
};

const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.userId
        }).populate(
            'participants',
            'username email'
        );

        res.json(conversations);

    } catch (error) {
        console.error(
            'Error getting conversations:',
            error.message
        );

        res.status(500).json({
            error: 'Failed to get conversations'
        });
    }
};

module.exports = {
    createConversation,
    getConversations
};