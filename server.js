require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(express.json());

const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

app.use(messageRoutes);
app.use(userRoutes);
app.use(authRoutes);

app.get('/', (req, res) => {
    res.send('Chat server is running!');
});

app.use((err, req, res, next) => {
    console.error(err.message);

    res.status(500).json({
        error: 'Something went wrong on the server'
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});