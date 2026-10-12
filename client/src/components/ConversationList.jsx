
import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

function ConversationList({
    currentUser,
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

    const loadData = async () => {
        try {
            setError('');

            const [conversationData, userData] = await Promise.all([
                apiFetch('/conversations'),
                apiFetch('/users')
            ]);

            setConversations(conversationData);
            setUsers(userData);
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

            // Check whether a conversation already exists.
            const existing = conversations.find((conversation) => {
                const participantIds = conversation.participants.map(
                    (person) => String(person._id || person)
                );

                return (
                    participantIds.includes(currentUserId) &&
                    participantIds.includes(String(otherUser._id)) &&
                    participantIds.length === 2
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

            // Reload to get populated participant names.
            const updatedConversations = await apiFetch('/conversations');
            setConversations(updatedConversations);

            const populatedConversation = updatedConversations.find(
                (item) => item._id === newConversation._id
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

    if (loading) {
        return <p>Loading conversations...</p>;
    }

    return (
        <div>
            <h2>Conversations</h2>

            <button onClick={() => setShowUsers((value) => !value)}>
                {showUsers ? 'Cancel' : '+ New conversation'}
            </button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {showUsers && (
                <div>
                    <h3>Choose a user</h3>

                    {users.filter(
                        (person) => String(person._id) !== currentUserId
                    ).map((person) => (
                        <button
                            key={person._id}
                            onClick={() => startConversation(person)}
                            disabled={creatingUserId !== null}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px',
                                marginBottom: '6px',
                                textAlign: 'left'
                            }}
                        >
                            {person.username || person.email}
                            {creatingUserId === person._id
                                ? ' — Starting...'
                                : ''}
                        </button>
                    ))}
                </div>
            )}

            {conversations.length === 0 ? (
                <p>No conversations yet.</p>
            ) : (
                conversations.map((conversation) => (
                    <button
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation)}
                        style={{
                            display: 'block',
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
                        {conversation.participants
                            .filter(
                                (person) =>
                                    String(person._id || person) !==
                                    currentUserId
                            )
                            .map(
                                (person) =>
                                    person.username ||
                                    person.email ||
                                    'User'
                            )
                            .join(', ') || 'Conversation'}
                    </button>
                ))
            )}
        </div>
    );
}

export default ConversationList;

