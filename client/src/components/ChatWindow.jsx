
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiFetch } from '../services/api';

function ChatWindow({ conversation }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const conversationId = conversation?._id;

        if (!token || !conversationId) {
            setLoading(false);
            return;
        }

        let active = true;
        setMessages([]);
        setError('');
        setLoading(true);

        const socket = io('http://localhost:3000', {
            auth: { token }
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            if (!active) return;

            setConnected(true);
            socket.emit('joinConversation', conversationId);
        });

        socket.on('disconnect', () => {
            if (active) setConnected(false);
        });

        socket.on('connect_error', (err) => {
            if (active) setError(err.message);
        });

        socket.on('conversationError', (data) => {
            if (active) setError(data.error);
        });

        socket.on('messageError', (data) => {
            if (active) setError(data.error);
        });

        socket.on('newMessage', (message) => {
            const messageConversationId =
                message.conversation?._id || message.conversation;

            if (
                String(messageConversationId) !== String(conversationId)
            ) {
                return;
            }

            setMessages((previous) => {
                if (previous.some((item) => item._id === message._id)) {
                    return previous;
                }

                return [...previous, message];
            });
        });

        const loadMessages = async () => {
            try {
                const data = await apiFetch(
                    `/messages?conversationId=${conversationId}`
                );

                if (active) setMessages(data);
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadMessages();

        return () => {
            active = false;
            socket.disconnect();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [conversation?._id]);

    const handleSend = (e) => {
        e.preventDefault();

        const messageText = text.trim();
        const socket = socketRef.current;

        if (!messageText || !conversation?._id) return;

        if (!socket || !socket.connected) {
            setError('Not connected. Please wait and try again.');
            return;
        }

        setError('');

        socket.emit('sendMessage', {
            conversationId: conversation._id,
            text: messageText
        });

        setText('');
    };

    if (!conversation) {
        return <p>Select a conversation to start chatting.</p>;
    }

    return (
        <div>
            <h2>Chat</h2>

            <p>
                {connected ? 'Connected' : 'Connecting...'}
            </p>

            {error && (
                <p style={{ color: 'red' }}>{error}</p>
            )}

            <div
                style={{
                    minHeight: '250px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    padding: '12px',
                    marginBottom: '12px'
                }}
            >
                {loading ? (
                    <p>Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p>No messages yet. Say hello!</p>
                ) : (
                    messages.map((message) => (
                        <div key={message._id} style={{ marginBottom: '12px' }}>
                            <strong>
                                {message.sender?.username || 'User'}
                            </strong>
                            <p style={{ margin: '4px 0' }}>
                                {message.text}
                            </p>
                            <small>
                                {message.createdAt
                                    ? new Date(message.createdAt).toLocaleTimeString()
                                    : ''}
                            </small>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSend}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    style={{ padding: '10px', width: '70%' }}
                />

                <button
                    type="submit"
                    disabled={!connected || !text.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default ChatWindow;