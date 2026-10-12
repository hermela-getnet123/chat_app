
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../services/api';

function ChatWindow({ conversation, currentUser, socket }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [typingUser, setTypingUser] = useState('');
    const typingTimeout = useRef(null);

    const conversationId = conversation?._id;
    const currentUserId = String(
        currentUser?.userId || currentUser?._id || ''
    );

    useEffect(() => {
        if (!socket || !conversationId) {
            setLoading(false);
            return;
        }

        let active = true;

        setMessages([]);
        setText('');
        setError('');
        setTypingUser('');
        setLoading(true);

        const handleConnect = () => {
            if (!active) return;
            setConnected(true);
            socket.emit('joinConversation', conversationId);
        };

        const handleDisconnect = () => {
            if (active) setConnected(false);
        };

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

            const senderId = String(
                message.sender?._id || message.sender || ''
            );

            if (senderId !== currentUserId) {
                socket.emit('markAsRead', conversationId);
            }
        };

        const handleUserTyping = (data) => {
            if (
                String(data.conversationId) === String(conversationId) &&
                String(data.userId) !== currentUserId
            ) {
                setTypingUser(data.username || 'Someone');
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (
                String(data.conversationId) === String(conversationId) &&
                String(data.userId) !== currentUserId
            ) {
                setTypingUser('');
            }
        };

        const handleMessagesRead = ({ userId, conversationId: readConversationId }) => {
            if (String(readConversationId) !== String(conversationId)) return;

            // The other user read messages that we sent.
            setMessages((previous) =>
                previous.map((message) => {
                    const senderId = String(
                        message.sender?._id || message.sender || ''
                    );

                    if (senderId === String(userId)) return message;

                    const readBy = (message.readBy || []).map((id) =>
                        String(id?._id || id)
                    );

                    if (!readBy.includes(String(userId))) {
                        readBy.push(String(userId));
                    }

                    return { ...message, readBy };
                })
            );
        };

        const handleSocketError = (data) => {
            if (active) setError(data.error || 'A chat error occurred.');
        };

        const loadMessages = async () => {
            try {
                const data = await apiFetch(
                    `/messages?conversationId=${conversationId}`
                );

                if (!active) return;

                setMessages(data);
                socket.emit('markAsRead', conversationId);
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('newMessage', handleNewMessage);
        socket.on('userTyping', handleUserTyping);
        socket.on('userStoppedTyping', handleUserStoppedTyping);
        socket.on('messagesRead', handleMessagesRead);
        socket.on('conversationError', handleSocketError);
        socket.on('messageError', handleSocketError);

        if (socket.connected) {
            handleConnect();
        }

        loadMessages();

        return () => {
            active = false;

            socket.emit('leaveConversation', conversationId);

            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('newMessage', handleNewMessage);
            socket.off('userTyping', handleUserTyping);
            socket.off('userStoppedTyping', handleUserStoppedTyping);
            socket.off('messagesRead', handleMessagesRead);
            socket.off('conversationError', handleSocketError);
            socket.off('messageError', handleSocketError);

            clearTimeout(typingTimeout.current);
            socket.emit('stopTyping', { conversationId });
        };
    }, [socket, conversationId, currentUserId]);

    const handleTextChange = (e) => {
        const value = e.target.value;
        setText(value);

        if (!socket?.connected || !conversationId) return;

        if (value.trim()) {
            socket.emit('typing', { conversationId });

            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
                socket.emit('stopTyping', { conversationId });
            }, 1200);
        } else {
            clearTimeout(typingTimeout.current);
            socket.emit('stopTyping', { conversationId });
        }
    };

    const handleSend = (e) => {
        e.preventDefault();

        const messageText = text.trim();

        if (!messageText || !conversationId || !socket?.connected) return;

        setError('');
        socket.emit('sendMessage', {
            conversationId,
            text: messageText
        });

        clearTimeout(typingTimeout.current);
        socket.emit('stopTyping', { conversationId });
        setText('');
    };

    if (!conversation) {
        return <p>Select a conversation to start chatting.</p>;
    }

    return (
        <div>
            <h2>Chat</h2>
            <p>{connected ? 'Connected' : 'Connecting...'}</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {typingUser && (
                <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                    {typingUser} is typing...
                </p>
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
                    messages.map((message) => {
                        const senderId = String(
                            message.sender?._id || message.sender || ''
                        );
                        const isMine = senderId === currentUserId;
                        const readBy = (message.readBy || []).map((id) =>
                            String(id?._id || id)
                        );
                        const otherParticipants = (
                            conversation.participants || []
                        ).filter(
                            (person) =>
                                String(person._id || person) !== currentUserId
                        );
                        const hasBeenRead = otherParticipants.some((person) =>
                            readBy.includes(String(person._id || person))
                        );

                        return (
                            <div key={message._id} style={{ marginBottom: '12px' }}>
                                <strong>
                                    {isMine
                                        ? 'You'
                                        : message.sender?.username || 'User'}
                                </strong>

                                <p style={{ margin: '4px 0' }}>{message.text}</p>

                                <small>
                                    {message.createdAt
                                        ? new Date(message.createdAt).toLocaleTimeString()
                                        : ''}
                                </small>

                                {isMine && (
                                    <small style={{ marginLeft: '8px' }}>
                                        {hasBeenRead ? '✓✓ Read' : '✓ Sent'}
                                    </small>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

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
