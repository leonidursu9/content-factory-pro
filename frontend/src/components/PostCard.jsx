import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRewriteScript, apiRefineScript, apiSaveScript, apiTranscribePost } from '../api.js'; 
import './PostCard.css';

import createScriptIcon from '../assets/создать новый сценарий.png';
import scriptsIcon from '../assets/сценарии.png';
import transcribeIcon from '../assets/транскрибация.png';
import externalLinkIcon from '../assets/перейти к посту в инстаграм.png';
import saveIcon from '../assets/save-icon.png';
import discardIcon from '../assets/discard-icon.png';

const ViewsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const LikesIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const CommentsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

const MAX_CAPTION_LENGTH = 120; 

const formatCount = (count) => { if (count === null || count === undefined) return 0; if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'; if (count >= 1000) return (count / 1000).toFixed(1) + 'K'; return count; };
const getViralityColor = (score) => { const numScore = parseFloat(score); if (numScore >= 500) return '#34c759'; if (numScore >= 100) return '#ff9500'; return '#ff3b30'; };

function PostCard({ post }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rewrittenScript, setRewrittenScript] = useState('');
  const [error, setError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const authorName = post.author?.name || post.author?.nickname || 'Неизвестный Автор';
  const postDate = new Date(post.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const rawCaption = post.caption || '';
  const needsTruncating = rawCaption.length > MAX_CAPTION_LENGTH;
  const displayCaption = isExpanded ? rawCaption : `${rawCaption.substring(0, MAX_CAPTION_LENGTH)}`;

  const handleRewriteClick = async () => { if (!rawCaption && !post.transcript) { alert('У этого поста нет текста для анализа.'); return; } setIsModalOpen(true); setIsLoadingAI(true); setError(''); setRewrittenScript(''); try { const textToRewrite = post.transcript ? `Текст из видео: ${post.transcript}\n\nОписание: ${rawCaption}` : rawCaption; const response = await apiRewriteScript(textToRewrite); setRewrittenScript(response.rewrittenText); } catch (error) { setError(`Ошибка: ${error.message}`); } finally { setIsLoadingAI(false); } };
  const handleRefineScript = async () => { if (!rewrittenScript) return; setIsLoadingAI(true); setError(''); setSaveSuccess(false); try { const response = await apiRefineScript(rewrittenScript); setRewrittenScript(response.rewrittenText); } catch (error) { setError(`Ошибка улучшения: ${error.message}`); } finally { setIsLoadingAI(false); } };
  const handleSaveScript = async () => { setIsSaving(true); setSaveSuccess(false); try { await apiSaveScript({ originalText: rawCaption, rewrittenText: rewrittenScript, originalAuthorName: authorName, postId: post._id }); setSaveSuccess(true); setTimeout(() => {setIsModalOpen(false)}, 1500); } catch(error) { setError(`Не удалось сохранить: ${error.message}`); } finally { setIsSaving(false); } };
  const handleTranscribeClick = async () => { if (!post.url) { alert('У этого поста нет URL для транскрибации.'); return; } const confirm = window.confirm('Это действие потратит один запрос к API транскрибации. Продолжить?'); if (!confirm) return; setIsTranscribing(true); try { await apiTranscribePost(post._id); alert('✅ Готово! Пост отправлен на транскрибацию. Результат появится на странице "Идеи".'); } catch (error) { alert(`Ошибка: ${error.message}`); } finally { setIsTranscribing(false); } };
  const handleCloseModal = () => setIsModalOpen(false);
  const handleGoToScripts = () => navigate(`/scripts/${post._id}`);

  return (
    <>
      <div className="author-card-new">
        <div className="author-card-new-header">
          <div className="author-info">
             <div className="author-avatar">{authorName.charAt(0)}</div>
             <div>
                <div className="author-name">{authorName}</div>
                <div className="post-date-small">{postDate}</div>
             </div>
          </div>
          <div className="post-card-new-virality" style={{ backgroundColor: getViralityColor(post.viralCoefficient) }}>
            КВ: {post.viralCoefficient || '0'}
          </div>
        </div>
        
        <p className="post-card-new-caption">
          {displayCaption}
          {needsTruncating && (
            <span onClick={() => setIsExpanded(!isExpanded)} className="expand-caption-btn">
              {isExpanded ? ' Свернуть' : '...еще'}
            </span>
          )}
        </p>

        <div className="author-card-new-stats">
            <div className="metric-item-new"><ViewsIcon /><span>{formatCount(post.viewsCount)}</span></div>
            <div className="metric-item-new"><LikesIcon /><span>{formatCount(post.likesCount)}</span></div>
            <div className="metric-item-new"><CommentsIcon /><span>{formatCount(post.commentsCount)}</span></div>
        </div>
        
        <div className="author-card-new-footer">
            <button onClick={handleRewriteClick} className="footer-icon-button" title="Создать новый сценарий">
              <img src={createScriptIcon} alt="Создать сценарий" />
            </button>
            <button onClick={handleGoToScripts} className="footer-icon-button" title="Все сценарии">
              <img src={scriptsIcon} alt="Все сценарии" />
            </button>
            <button onClick={handleTranscribeClick} className="footer-icon-button" disabled={isTranscribing} title="Получить текст из видео">
              <img src={transcribeIcon} alt="Получить текст" />
            </button>
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="footer-icon-button" title="Посмотреть в Instagram">
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

export default PostCard;