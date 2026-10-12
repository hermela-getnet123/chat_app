
import { useEffect, useState } from 'react';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionVersion, setSessionVersion] = useState(0);

    useEffect(() => {
        let active = true;

        const verifySession = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                if (active) {
                    setUser(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(
                    'http://localhost:3000/profile',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    localStorage.removeItem('token');
                    if (active) setUser(null);
                } else if (active) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Session verification failed:', error);
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        setLoading(true);
        verifySession();

        return () => {
            active = false;
        };
    }, [sessionVersion]);

    const handleLoginSuccess = () => {
        setLoading(true);
        setSessionVersion((version) => version + 1);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    if (loading) {
        return <p>Checking your session...</p>;
    }

    if (!user) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div>
            <header style={{ padding: '12px 20px' }}>
                <span>Logged in as {user.username}</span>
                <button onClick={handleLogout} style={{ marginLeft: '16px' }}>
                    Logout
                </button>
            </header>

            <ChatPage />
        </div>
    );
}

export default App;