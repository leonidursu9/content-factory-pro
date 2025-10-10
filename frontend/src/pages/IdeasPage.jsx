import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetIdeas, apiDeleteIdea, apiRewriteScript, apiRefineScript, apiSaveScript } from '../api.js';
import './IdeasPage.css';

import createScriptIcon from '../assets/создать новый сценарий.png';
import scriptsIcon from '../assets/сценарии.png';
import externalLinkIcon from '../assets/перейти к посту в инстаграм.png';
import saveIcon from '../assets/save-icon.png';
import discardIcon from '../assets/discard-icon.png';

const ViewsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const LikesIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const CommentsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

const formatCount = (count) => { if (count === null || count === undefined) return 0; if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'; if (count >= 1000) return (count / 1000).toFixed(1) + 'K'; return count; };

function IdeaCard({ idea, onDelete }) {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [rewrittenScript, setRewrittenScript] = useState('');
    const [error, setError] = useState('');

    const MAX_TRANSCRIPT_LENGTH = 150;
    const transcript = idea.transcript || '';
    const needsTruncating = transcript.length > MAX_TRANSCRIPT_LENGTH;
    const displayTranscript = isExpanded ? transcript : `${transcript.substring(0, MAX_TRANSCRIPT_LENGTH)}...`;

    const handleRewriteClick = async () => {
        if (!idea.transcript && !idea.caption) { alert('У этой идеи нет текста для анализа.'); return; }
        setIsModalOpen(true);
        setIsLoadingAI(true);
        setError('');
        setRewrittenScript('');
        try {
            const textToRewrite = idea.transcript ? `Текст из видео: ${idea.transcript}\n\nОписание: ${idea.caption}` : idea.caption;
            const response = await apiRewriteScript(textToRewrite);
            setRewrittenScript(response.rewrittenText);
        } catch (error) {
            setError(`Ошибка: ${error.message}`);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleRefineScript = async () => {
        if (!rewrittenScript) return;
        setIsLoadingAI(true);
        setError('');
        setSaveSuccess(false);
        try {
            const response = await apiRefineScript(rewrittenScript);
            setRewrittenScript(response.rewrittenText);
        } catch (error) {
            setError(`Ошибка улучшения: ${error.message}`);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleSaveScript = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            await apiSaveScript({
                originalText: idea.caption || idea.transcript,
                rewrittenText: rewrittenScript,
                originalAuthorName: idea.originalAuthor,
                postId: idea.postId._id
            });
            setSaveSuccess(true);
            setTimeout(() => {setIsModalOpen(false)}, 1500);
        } catch(error) {
            setError(`Не удалось сохранить: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCloseModal = () => setIsModalOpen(false);
    const handleGoToScripts = () => navigate(`/scripts/${idea.postId._id}`);

    return (
        <>
            <div className="idea-card-new">
                <div className="idea-card-header">
                    <div>
                        <p className="idea-caption">{idea.caption?.substring(0, 100) || 'Нет описания'}...</p>
                        <p className="idea-author">Автор: @{idea.originalAuthor}</p>
                    </div>
                    <button onClick={() => onDelete(idea._id)} className="delete-button-idea" title="Удалить идею">×</button>
                </div>
                
                {idea.transcript && (
                    <div className="transcript-block">
                        <h4>🎙️ Текст из видео:</h4>
                        <p>
                            {displayTranscript}
                            {needsTruncating && (
                                <span onClick={() => setIsExpanded(!isExpanded)} className="expand-transcript">
                                    {isExpanded ? ' Свернуть' : ' еще'}
                                </span>
                            )}
                        </p>
                    </div>
                )}
                
                <div className="idea-card-stats">
                    <div className="metric-item-new"><ViewsIcon /><span>{formatCount(idea.postId?.viewsCount)}</span></div>
                    <div className="metric-item-new"><LikesIcon /><span>{formatCount(idea.postId?.likesCount)}</span></div>
                    <div className="metric-item-new"><CommentsIcon /><span>{formatCount(idea.postId?.commentsCount)}</span></div>
                </div>

                <div className="idea-card-footer">
                    <button onClick={handleRewriteClick} className="footer-icon-button" title="Создать новый сценарий">
                      <img src={createScriptIcon} alt="Создать сценарий" />
                    </button>
                    <button onClick={handleGoToScripts} className="footer-icon-button" title="Все сценарии">
                      <img src={scriptsIcon} alt="Все сценарии" />
                    </button>
                    <a href={idea.url} target="_blank" rel="noopener noreferrer" className="footer-icon-button" title="Посмотреть в Instagram">
                      <img src={externalLinkIcon} alt="Посмотреть в Instagram" />
                    </a>
                </div>
            </div>

            {isModalOpen && (
              <div className="modal-overlay" onClick={handleCloseModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button onClick={handleCloseModal} className="modal-close-btn">×</button>
                  <h2>Студия Сценариев</h2>
                  {isLoadingAI && <div className="loader">🤖 Искусственный интеллект пишет...</div>}
                  {error && <div className="modal-error">{error}</div>}
                  {rewrittenScript && (
                    <>
                      <div className="script-result">{rewrittenScript}</div>
                      <div className="modal-actions">
                        <button onClick={handleRefineScript} disabled={isLoadingAI} className="modal-icon-btn" title="Отклонить и сгенерировать новый">
                          <img src={discardIcon} alt="Отклонить" />
                        </button>
                        <button onClick={handleSaveScript} disabled={isSaving} className="modal-icon-btn save" title="Сохранить">
                          {isSaving ? '...' : <img src={saveIcon} alt="Сохранить" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
        </>
    );
}

function IdeasPage() {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchIdeas = async () => {
            setLoading(true);
            try {
                const data = await apiGetIdeas();
                setIdeas(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchIdeas();
    }, []);

    const handleDelete = async (ideaId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту идею из архива?')) {
            try {
                await apiDeleteIdea(ideaId);
                setIdeas(prev => prev.filter(idea => idea._id !== ideaId));
            } catch (e) { alert(`Ошибка удаления: ${e.message}`); }
        }
    };

    if (loading) return <p className="loading-text">Загрузка архива идей...</p>;

    return (
        <div className="page-container">
            <div className="header-banner">
                <h1>Архив Идей</h1>
                <p>Лучшие посты, отобранные автоматически</p>
            </div>

            {error && <p className="error-message">{error}</p>}

            {ideas.length === 0 && !loading ? (
                <div className="empty-state">
                    <h3>Архив пока пуст</h3>
                    <p>Система автоматически добавляет сюда лучшие идеи раз в сутки. Загляните завтра!</p>
                </div>
            ) : (
                <div className="ideas-grid">
                    {ideas.map((idea) => (
                        <IdeaCard 
                            key={idea._id}
                            idea={idea}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default IdeasPage;