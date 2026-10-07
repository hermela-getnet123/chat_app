function ChatWindow() {
    return (
        <div>
            <h2>Chat Window</h2>

            <div>
                <p>No messages yet.</p>
            </div>

            <input
                type="text"
                placeholder="Type a message..."
            />

            <button>
                Send
            </button>
        </div>
    );
}

export default ChatWindow;