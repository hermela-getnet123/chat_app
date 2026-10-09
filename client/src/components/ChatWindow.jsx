
function ChatWindow({ conversation }) {
    return (
        <div>
            <h2>Chat Window</h2>

            <p>
                Conversation ID: {conversation._id}
            </p>

            <p>
                Participants:{' '}
                {conversation.participants
                    .map((participant) => participant.username)
                    .join(', ')}
            </p>

            <div>
                <p>Message history will appear here next.</p>
            </div>

            <input type="text" placeholder="Type a message..." />
            <button disabled>Send</button>
        </div>
    );
}

export default ChatWindow;