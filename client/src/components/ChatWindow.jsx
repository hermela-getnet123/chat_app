
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { apiFetch } from '../services/api';

function ChatWindow({ conversation }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token || !conversation?._id) return;

        let active = true;

        const socket = io('http://localhost:3000', {
            auth: { token }
        });

        const loadMessages = async () => {
            try {
                const data = await apiFetch(
                    `/messages?conversationId=${conversation._id}`
                );

                if (active) setMessages(data);
            } catch (err) {
                if (active) setError(err.message);
            }
        };

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('joinConversation', conversation._id);
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('connect_error', (err) => {
            setError(err.message);
        });

        socket.on('newMessage', (message) => {
            if (
                String(message.conversation) === String(conversation._id) ||
                String(message.conversation?._id) === String(conversation._id)
            ) {
                setMessages((previous) => {
                    if (previous.some((item) => item._id === message._id)) {
                        return previous;
                    }

                    return [...previous, message];
                });
            }
        });

        socket.on('messageError', (data) => {
            setError(data.error);
        });

        loadMessages();

        return () => {
            active = false;
            socket.disconnect();
        };
    }, [conversation?._id]);

    const handleSend = async (e) => {
        e.preventDefault();

        const messageText = text.trim();

        if (!messageText) return;

        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again.');
            return;
        }

        // The active socket will be added to the sending flow below.
        setError('Sending setup is not finished yet.');
    };

    return (
        <div>
            <h2>Chat</h2>

            <p>
                {connected ? 'Connected' : 'Connecting...'}
            </p>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ minHeight: '250px' }}>
                {messages.map((message) => (
                    <div key={message._id}>
                        <strong>
                            {message.sender?.username || 'User'}:
                        </strong>{' '}
                        {message.text}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default ChatWindow;