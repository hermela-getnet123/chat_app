
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../services/api';

function ChatWindow({ conversation, currentUser, socket, onlineUserIds = [] }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [typingUser, setTypingUser] = useState('');
    const typingTimeoutRef = useRef(null);

    const conversationId = conversation?._id;
    const currentUserId = String(
        currentUser?.userId || currentUser?._id || ''
    );

    useEffect(() => {
        if (!socket) {
            setConnected(false);
            return;
        }

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        setConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket || !conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        let active = true;

        setMessages([]);
        setError('');
        setTypingUser('');
        setLoading(true);

        const handleNewMessage = (message) => {
            const messageConversationId =
                message.conversation?._id || message.conversation;

            if (String(messageConversationId) !== String(conversationId)) {
                return;
            }

            setMessages((previous) => {
                if (previous.some((item) => item._id === message._id)) {
                    return previous;
                }

                return [...previous, message];
            });
        };

        const handleTyping = ({ userId, username, conversationId: id }) => {
            if (
                String(id) === String(conversationId) &&
                String(userId) !== currentUserId
            ) {
                setTypingUser(username || 'Someone');
            }
        };

        const handleStopTyping = ({ userId, conversationId: id }) => {
            if (
                String(id) === String(conversationId) &&
                String(userId) !== currentUserId
            ) {
                setTypingUser('');
            }
        };

        const handleMessagesRead = ({ userId, conversationId: id }) => {
            if (String(id) !== String(conversationId)) return;
            if (!userId || String(userId) === currentUserId) return;

            setMessages((previous) =>
                previous.map((message) => {
                    const senderId = String(
                        message.sender?._id || message.sender
                    );

                    if (senderId !== currentUserId) return message;

                    const readBy = message.readBy || [];

                    return {
                        ...message,
                        readBy: readBy.some((id) => String(id) === String(userId))
                            ? readBy
                            : [...readBy, userId]
                    };
                })
            );
        };

        const handleConversationError = (data) => {
            if (active) setError(data.error || 'Conversation error');
        };

        const handleMessageError = (data) => {
            if (active) setError(data.error || 'Message error');
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('userTyping', handleTyping);
        socket.on('userStoppedTyping', handleStopTyping);
        socket.on('messagesRead', handleMessagesRead);
        socket.on('conversationError', handleConversationError);
        socket.on('messageError', handleMessageError);

        const joinAndRead = () => {
            socket.emit('joinConversation', conversationId);
            socket.emit('markAsRead', conversationId);
        };

        if (socket.connected) {
            joinAndRead();
        }

        socket.on('connect', joinAndRead);

        const loadMessages = async () => {
            try {
                const data = await apiFetch(
                    `/messages?conversationId=${conversationId}`
                );

                if (active) {
                    setMessages(Array.isArray(data) ? data : data.data || []);
                    socket.emit('markAsRead', conversationId);
                }
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadMessages();

        return () => {
            active = false;

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            socket.emit('stopTyping', { conversationId });
            socket.emit('leaveConversation', conversationId);

            socket.off('connect', joinAndRead);
            socket.off('newMessage', handleNewMessage);
            socket.off('userTyping', handleTyping);
            socket.off('userStoppedTyping', handleStopTyping);
            socket.off('messagesRead', handleMessagesRead);
            socket.off('conversationError', handleConversationError);
            socket.off('messageError', handleMessageError);
        };
    }, [socket, conversationId, currentUserId]);

    const handleTextChange = (event) => {
        const value = event.target.value;
        setText(value);

        if (!socket || !conversationId || !socket.connected) return;

        socket.emit('typing', { conversationId });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', { conversationId });
        }, 1000);
    };

    const handleSend = (event) => {
        event.preventDefault();

        const messageText = text.trim();

        if (!messageText || !conversationId) return;

        if (!socket || !socket.connected) {
            setError('Not connected. Please wait and try again.');
            return;
        }

        setError('');
        socket.emit('sendMessage', {
            conversationId,
            text: messageText
        });

        socket.emit('stopTyping', { conversationId });
        setText('');
    };

    if (!conversation) {
        return <p>Select a conversation to start chatting.</p>;
    }

    const otherParticipant = conversation.participants?.find(
        (participant) =>
            String(participant._id || participant) !== currentUserId
    );
    const otherParticipantId = String(
        otherParticipant?._id || otherParticipant || ''
    );
    const otherParticipantOnline = onlineUserIds.includes(otherParticipantId);

    return (
        <div>
            <h2>
                {otherParticipant?.username || 'Chat'}
                {otherParticipantId && (
                    <small style={{ marginLeft: '10px', fontWeight: 'normal' }}>
                        {otherParticipantOnline ? 'Online' : 'Offline'}
                    </small>
                )}
            </h2>
            <p>{connected ? 'Connected' : 'Connecting...'}</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}

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
                    messages.map((message) => {
                        const senderId = String(
                            message.sender?._id || message.sender
                        );
                        const isMine = senderId === currentUserId;
                        const readBy = message.readBy || [];
                        const isRead = isMine && readBy.some(
                            (id) => String(id) !== currentUserId
                        );

                        return (
                            <div
                                key={message._id}
                                style={{
                                    marginBottom: '12px',
                                    textAlign: isMine ? 'right' : 'left'
                                }}
                            >
                                <strong>
                                    {message.sender?.username || 'User'}
                                </strong>
                                <p style={{ margin: '4px 0' }}>
                                    {message.text}
                                </p>
                                <small>
                                    {message.createdAt
                                        ? new Date(
                                            message.createdAt
                                        ).toLocaleTimeString()
                                        : ''}
                                    {isMine && (
                                        <> · {isRead ? 'Read' : 'Sent'}</>
                                    )}
                                </small>
                            </div>
                        );
                    })
                )}
            </div>

            {typingUser && (
                <p style={{ color: '#666' }}>
                    {typingUser} is typing...
                </p>
            )}

            <form onSubmit={handleSend}>
                <input
                    value={text}
                    onChange={handleTextChange}
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