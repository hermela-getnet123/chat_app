
import { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

function ConversationList({ onSelectConversation, selectedConversationId }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const data = await apiFetch('/conversations');
                setConversations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, []);

    if (loading) {
        return <p>Loading conversations...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Conversations</h2>

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
                            marginBottom: '8px',
                            background:
                                selectedConversationId === conversation._id
                                    ? '#dbeafe'
                                    : '#ffffff',
                            border: '1px solid #ddd',
                            cursor: 'pointer',
                            textAlign: 'left'
                        }}
                    >
                        {conversation.participants
                            .map((participant) => participant.username)
                            .join(', ')}
                    </button>
                ))
            )}
        </div>
    );
}

export default ConversationList;