const express = require('express');

const app = express();

app.use(express.json());

const messageRoutes = require('./routes/messageRoutes');

app.use(messageRoutes);

app.get('/', (req, res) => {
    res.send('Chat server is running!');
});

app.get('/users', (req, res) => {
    res.send('Users endpoint');
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

