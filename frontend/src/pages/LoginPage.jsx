import React, { useState } from 'react';
import { apiVerify } from '../api.js';

function LoginPage({ onLogin }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await apiVerify(code); 
            onLogin(data.accessToken);
        } catch (err) {
            setError(err.message || 'Произошла ошибка');
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '300px', margin: '50px auto', textAlign: 'center' }}>
            <h1>Вход</h1>
            <p>Введите код доступа. (Для теста: 123456)</p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Код доступа"
                    style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '10px' }}
                />
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
                    {loading ? 'Проверка...' : 'Войти'}
                </button>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>
        </div>
    );
}

export default LoginPage;