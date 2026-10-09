
import { useState } from 'react';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        Boolean(localStorage.getItem('token'))
    );

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    return isLoggedIn ? (
        <div>
            <button
                onClick={handleLogout}
                style={{ margin: '12px' }}
            >
                Logout
            </button>

            <ChatPage />
        </div>
    ) : (
        <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
    );
}

export default App;