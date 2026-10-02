const express = require('express');

const protect = require('../middleware/authMiddleware');

const router = express.Router();

const {
    getUsers,
    createUser
} = require('../controllers/userController');

router.get('/users', getUsers);

router.post('/users', createUser);

router.get('/profile', protect, (req, res) => {
    res.json({
        message: 'You are authenticated!',
        user: req.user
    });
});

module.exports = router;