
import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

function ConversationList({
    currentUser,
    socket,
    onlineUserIds = [],
    onSelectConversation,
    selectedConversationId
}) {
    const [conversations, setConversations] = useState([]);
    const [users, setUsers] = useState([]);
    const [showUsers, setShowUsers] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creatingUserId, setCreatingUserId] = useState(null);
    const [error, setError] = useState('');

    const currentUserId = String(
        currentUser?.userId || currentUser?._id || ''
    );

    const isOnline = (id) =>
        onlineUserIds.includes(String(id));

    const loadData = async () => {
        try {
            setError('');

            const [conversationData, userData] = await Promise.all([
                apiFetch('/conversations'),
                apiFetch('/users')
            ]);

            setConversations(
                Array.isArray(conversationData)
                    ? conversationData
                    : conversationData.data || []
            );

            setUsers(
                Array.isArray(userData)
                    ? userData
                    : userData.data || []
            );
        } catch (err) {
            setError(err.message || 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const startConversation = async (otherUser) => {
        try {
            setCreatingUserId(otherUser._id);
            setError('');

            const existing = conversations.find((conversation) => {
                const ids = conversation.participants.map(
                    (person) => String(person._id || person)
                );

                return (
                    ids.includes(currentUserId) &&
                    ids.includes(String(otherUser._id)) &&
                    ids.length === 2
                );
            });

            if (existing) {
                onSelectConversation(existing);
                setShowUsers(false);
                return;
            }

            const result = await apiFetch('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    participants: [currentUserId, otherUser._id]
                })
            });

            const newConversation = result.data || result;
            const updatedConversations = await apiFetch('/conversations');

            const list = Array.isArray(updatedConversations)
                ? updatedConversations
                : updatedConversations.data || [];

            setConversations(list);

            const populatedConversation = list.find(
                (item) => String(item._id) === String(newConversation._id)
            );

            onSelectConversation(
                populatedConversation || newConversation
            );

            setShowUsers(false);
        } catch (err) {
            setError(err.message || 'Failed to start conversation.');
        } finally {
            setCreatingUserId(null);
        }
    };

    const renderStatus = (userId) => (
        <span
            title={isOnline(userId) ? 'Online' : 'Offline'}
            style={{
                display: 'inline-block',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: isOnline(userId)
                    ? '#22c55e'
                    : '#9ca3af',
                marginRight: '8px',
                flexShrink: 0
            }}
        />
    );

    if (loading) {
        return <p>Loading conversations...</p>;
    }

    return (
        <div>
            <h2>Conversations</h2>

            <button onClick={() => setShowUsers((value) => !value)}>
                {showUsers ? 'Cancel' : '+ New conversation'}
            </button>

            {error && (
                <p style={{ color: 'red' }}>{error}</p>
            )}

            {showUsers && (
                <div>
                    <h3>Choose a user</h3>

                    {users.filter(
                        (person) =>
                            String(person._id) !== currentUserId
                    ).map((person) => (
                        <button
                            key={person._id}
                            onClick={() => startConversation(person)}
                            disabled={creatingUserId !== null}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '10px',
                                marginBottom: '6px',
                                textAlign: 'left'
                            }}
                        >
                            {renderStatus(person._id)}
                            <span>
                                {person.username || person.email}
                                {creatingUserId === person._id
                                    ? ' — Starting...'
                                    : ''}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <h3>Your chats</h3>

            {conversations.length === 0 ? (
                <p>No conversations yet.</p>
            ) : (
                conversations.map((conversation) => {
                    const otherParticipants =
                        conversation.participants.filter(
                            (person) =>
                                String(person._id || person) !==
                                currentUserId
                        );

                    return (
                        <button
                            key={conversation._id}
                            onClick={() =>
                                onSelectConversation(conversation)
                            }
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '12px',
                                marginTop: '8px',
                                textAlign: 'left',
                                background:
                                    selectedConversationId === conversation._id
                                        ? '#dbeafe'
                                        : '#ffffff',
                                border: '1px solid #ddd',
                                cursor: 'pointer'
                            }}
                        >
                            {otherParticipants.map((person, index) => {
                                const personId = person._id || person;

                                return (
                                    <span
                                        key={String(personId)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            marginRight: '8px'
                                        }}
                                    >
                                        {renderStatus(personId)}
                                        {person.username ||
                                            person.email ||
                                            'User'}
                                        {index < otherParticipants.length - 1
                                            ? ', '
                                            : ''}
                                    </span>
                                );
                            })}

                            {otherParticipants.length === 0 &&
                                'Conversation'}
                        </button>
                    );
                })
            )}
        </div>
    );
}

export default ConversationList;