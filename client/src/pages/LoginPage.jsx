
import { useState } from 'react';

function LoginPage({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (!data.token) {
                throw new Error('The server did not return a login token.');
            }

            localStorage.setItem('token', data.token);
            onLoginSuccess();
        } catch (err) {
            setError(err.message || 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '360px', margin: '80px auto' }}>
            <h1>Chat App</h1>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
                />

                <br /><br />

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                {error && (
                    <p style={{ color: 'red' }}>{error}</p>
                )}
            </form>
        </div>
    );
}

export default LoginPage;