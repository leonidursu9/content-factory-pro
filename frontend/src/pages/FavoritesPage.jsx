import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetScripts, apiDeleteScript, apiUpdateScript } from '../api.js'; 
import ScriptCard from '../components/ScriptCard.jsx'; 
import './FavoritesPage.css'; // Подключаем новые стили

function FavoritesPage() {
    const navigate = useNavigate();
    const [scripts, setScripts] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchAllScripts = async () => {
            setLoading(true);
            try {
                const data = await apiGetScripts();
                setScripts(data);
            } catch (err) {
                setError('Не удалось загрузить избранные сценарии.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllScripts();
    }, []);

    const handleDeleteScript = async (scriptId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот сценарий?')) {
            try {
                await apiDeleteScript(scriptId);
                setScripts(prev => prev.filter(s => s._id !== scriptId));
            } catch (err) {
                alert(`Ошибка удаления: ${err.message}`);
            }
        }
    };

    const handleUpdateScript = async (scriptId, newContent) => {
        try {
            const updatedScript = await apiUpdateScript(scriptId, { rewrittenText: newContent });
            setScripts(prev => prev.map(s => s._id === scriptId ? updatedScript : s));
            return true;
        } catch (err) {
            alert(`Ошибка обновления: ${err.message}`);
            return false;
        }
    };

    if (loading) return <p className="loading-text">Загрузка избранного...</p>;

    return (
        <div className="page-container">
            <div className="header-banner">
                <h1>⭐ Избранное</h1>
                <p>Ваши лучшие сохраненные сценарии</p>
            </div>

            {error && <p className="error-message">{error}</p>}

            {scripts.length > 0 ? (
                <div className="scripts-list">
                    {scripts.map((script) => (
                        <ScriptCard 
                            key={script._id} 
                            script={script} 
                            onUpdate={handleUpdateScript}
                            onDelete={handleDeleteScript} 
                            showGoToPostLink={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>Здесь пока пусто</h3>
                    <p>Сохраненные сценарии со всех постов будут появляться здесь.</p>
                </div>
            )}
        </div>
    );
}

export default FavoritesPage;