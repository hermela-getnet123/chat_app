import { useState } from 'react';

function App() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

const handleLogin = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        console.log('Login response:', data);

        if (response.ok) {
            localStorage.setItem('token', data.token);
            console.log('Login successful!');
        } else {
            console.log('Login failed:', data.error);
        }

    } catch (error) {
        console.error('Login error:', error);
    }
};

    return (
        <div>
            <h1>Chat App</h1>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <br /><br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <br /><br />

                <button type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}

export default App;