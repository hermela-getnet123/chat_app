const User = require('../models/User');

const getUsers = async (req, res) => {
    try {
        const users = await User.find();

        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error.message);

        res.status(500).json({
            error: 'Failed to get users'
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                error: 'Username is required'
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({
                error: 'Username already exists'
            });
        }

        const newUser = await User.create({
            username
        });

        res.status(201).json({
            message: 'User created!',
            data: newUser
        });

    } catch (error) {
        console.error('Error creating user:', error.message);

        res.status(500).json({
            error: 'Failed to create user'
        });
    }
};

module.exports = {
    getUsers,
    createUser
};