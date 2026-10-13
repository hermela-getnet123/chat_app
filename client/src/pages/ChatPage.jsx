
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';

function ChatPage({ currentUser }) {
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [socket, setSocket] = useState(null);
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const newSocket = io('http://localhost:3000', {
            auth: { token },
            autoConnect: false
        });

        newSocket.on('onlineUsers', (userIds) => {
            setOnlineUserIds(userIds.map(String));
        });

        newSocket.on('userOnline', ({ userId }) => {
            setOnlineUserIds((previous) =>
                previous.includes(String(userId))
                    ? previous
                    : [...previous, String(userId)]
            );
        });

        newSocket.on('userOffline', ({ userId }) => {
            setOnlineUserIds((previous) =>
                previous.filter((id) => id !== String(userId))
            );
        });

        newSocket.on('notification', (notification) => {
            setNotifications((previous) => [notification, ...previous]);
        });

        newSocket.on('notificationsRead', ({ conversationId }) => {
            setNotifications((previous) =>
                previous.map((notification) =>
                    String(notification.conversationId) ===
                    String(conversationId)
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
        });

        setSocket(newSocket);
        newSocket.connect();

        return () => {
            newSocket.disconnect();
            setSocket(null);
        };
    }, []);

    const unreadNotificationCount = notifications.filter(
        (notification) => !notification.isRead
    ).length;

    return (
        <div style={{ padding: '20px' }}>
            {notifications.length > 0 && (
                <section
                    aria-label="Notifications"
                    style={{
                        marginBottom: '16px',
                        padding: '12px',
                        border: '1px solid #ddd',
                        textAlign: 'left'
                    }}
                >
                    <strong>Notifications ({unreadNotificationCount} unread)</strong>
                    {notifications.slice(0, 4).map((notification) => (
                        <p key={notification.id}>
                            {notification.sender?.username || 'Someone'}:{' '}
                            {notification.text}
                            {!notification.isRead && ' · New'}
                        </p>
                    ))}
                </section>
            )}

            <div style={{
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap'
            }}>
                <div style={{ width: '300px', maxWidth: '100%' }}>
                    <ConversationList
                        currentUser={currentUser}
                        socket={socket}
                        onlineUserIds={onlineUserIds}
                        onSelectConversation={setSelectedConversation}
                        selectedConversationId={selectedConversation?._id}
                    />
                </div>

                <div style={{ flex: 1, minWidth: '280px' }}>
                    {selectedConversation ? (
                        <ChatWindow
                            conversation={selectedConversation}
                            currentUser={currentUser}
                            socket={socket}
                            onlineUserIds={onlineUserIds}
                        />
                    ) : (
                        <p>Select a conversation to start chatting.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatPage;

