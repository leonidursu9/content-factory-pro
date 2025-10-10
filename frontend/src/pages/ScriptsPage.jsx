import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetScripts, apiDeleteScript, apiUpdateScript, apiGetPostById } from '../api.js'; 
import ScriptCard from '../components/ScriptCard.jsx'; 
import './ScriptsPage.css';

// Импортируем твою иконку "Назад"
import backIcon from '../assets/назад.png';

function ScriptsPage() {
    const navigate = useNavigate();
    const { postId } = useParams(); 
    
    const [scripts, setScripts] = useState([]); 
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            if (!postId) return;
            setLoading(true);
            try {
                const [postData, scriptsData] = await Promise.all([
                    apiGetPostById(postId),
                    apiGetScripts(postId)
                ]);
                setPost(postData);
                setScripts(scriptsData);
            } catch (err) {
                setError('Не удалось загрузить данные.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [postId]);

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

    if (loading) return <p className="loading-text">Загрузка студии сценариев...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="page-container">
            <div className="header-banner">
                <h1>Студия Сценариев</h1>
                <p>Все версии для поста от @{post?.author?.nickname || '...'}</p>
            </div>
            
            <button onClick={() => navigate('/content')} className="back-button" title="Назад к ленте">
                <img src={backIcon} alt="Назад"/>
            </button>

            <div className="scripts-list">
                {scripts.length > 0 ? (
                    scripts.map((script) => (
                        <ScriptCard 
                            key={script._id} 
                            script={script} 
                            onUpdate={handleUpdateScript}
                            onDelete={handleDeleteScript} 
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <h3>Сценарии не найдены</h3>
                        <p>Для этого поста еще нет сохраненных сценариев.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ScriptsPage;