
import { useEffect, useState } from 'react';

function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore login when the page loads
    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            return;
        }

        const getProfile = async () => {
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

                if (response.ok) {
                    setUser(data.user);
                } else {
                    localStorage.removeItem('token');
                }

            } catch (error) {
                console.error(
                    'Profile error:',
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                'http://localhost:3000/login',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.log(
                    'Login failed:',
                    data.error
                );
                return;
            }

            localStorage.setItem(
                'token',
                data.token
            );

            setUser(data.user);

            console.log('Login successful!');

        } catch (error) {
            console.error(
                'Login error:',
                error
            );
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setEmail('');
        setPassword('');
    };

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div>
            <h1>Chat App</h1>

            {!user ? (
                <form onSubmit={handleLogin}>
                    <h2>Login</h2>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <br /><br />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <br /><br />

                    <button type="submit">
                        Login
                    </button>
                </form>
            ) : (
                <div>
                    <h2>
                        Welcome, {user.username}!
                    </h2>

                    <p>
                        Email: {user.email}
                    </p>

                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;

