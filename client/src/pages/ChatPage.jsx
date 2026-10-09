
import { useState } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';

function ChatPage() {
    const [selectedConversation, setSelectedConversation] = useState(null);

    return (
        <div style={{ display: 'flex', gap: '24px', padding: '20px' }}>
            <div style={{ width: '300px' }}>
                <ConversationList
                    onSelectConversation={setSelectedConversation}
                    selectedConversationId={selectedConversation?._id}
                />
            </div>

            <div style={{ flex: 1 }}>
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