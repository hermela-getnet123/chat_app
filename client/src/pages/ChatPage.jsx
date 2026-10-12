
import { useState } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';

function ChatPage({ currentUser }) {
    const [selectedConversation, setSelectedConversation] = useState(null);

    return (
        <div style={{
            display: 'flex',
            gap: '24px',
            padding: '20px',
            flexWrap: 'wrap'
        }}>
            <div style={{ width: '300px', maxWidth: '100%' }}>
                <ConversationList
                    currentUser={currentUser}
                    onSelectConversation={setSelectedConversation}
                    selectedConversationId={selectedConversation?._id}
                />
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
                {selectedConversation ? (
                    <ChatWindow conversation={selectedConversation} />
                ) : (
                    <p>Select a conversation to start chatting.</p>
                )}
            </div>
        </div>
    );
}

export default ChatPage;