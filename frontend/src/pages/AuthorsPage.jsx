import React, { useState, useEffect } from 'react';
import { apiGetAuthors, apiAddAuthor, apiDeleteAuthor, apiUpdateAuthor } from '../api.js';
import { useNavigate } from 'react-router-dom';
import './AuthorsPage.css';

// Импортируем твои иконки
import updateIcon from '../assets/обновить профиль.png';
import statsIcon from '../assets/icons8-статистика-50.png';
import deleteIcon from '../assets/icons8-удалить-50.png';

function AuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [links, setLinks] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  const fetchAuthors = async () => {
    try {
      const data = await apiGetAuthors();
      setAuthors(data);
    } catch (error) {
      setError('Не удалось загрузить авторов.');
    } finally {
        setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleAddAuthors = async (e) => {
    e.preventDefault();
    const urls = links.split('\n').map(link => link.trim()).filter(link => link);
    if (urls.length === 0) return;

    setLoadingAdd(true);
    setError('');
    setFeedback('');
    
    let addedCount = 0;
    for (const [index, url] of urls.entries()) {
        try {
            setFeedback(`Добавление ${index + 1} из ${urls.length}...`);
            await apiAddAuthor(url);
            addedCount++;
        } catch (err) {
            setError(`Ошибка при добавлении ${url}: ${err.message}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    setFeedback(`Готово! Успешно добавлено: ${addedCount}.`);
    setLinks('');
    setLoadingAdd(false);
    fetchAuthors();
  };

  const handleDelete = async (authorId) => {
    if (window.confirm('Вы уверены? Это действие удалит автора и все его посты.')) {
      try {
        await apiDeleteAuthor(authorId);
        fetchAuthors();
      } catch (error) { alert(error.message); }
    }
  };
  
  const handleUpdate = async (authorId) => {
      alert('Обновление для этого автора запущено в фоновом режиме!');
      await apiUpdateAuthor(authorId);
  };

  return (
    <div className="page-container">
      <div className="header-banner">
        <h1>Авторы</h1>
        <p>Добавляйте и отслеживайте ваших конкурентов</p>
      </div>

      <div className="add-author-form">
        <form onSubmit={handleAddAuthors}>
          <textarea
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="Вставьте одну или несколько ссылок на профили..."
            rows="4"
          />
          <button type="submit" disabled={loadingAdd}>
            {loadingAdd ? 'Добавление...' : 'Добавить'}
          </button>
        </form>
        {feedback && <p className="feedback-message">{feedback}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
      
      {loadingInitial ? <p className="loading-text">Загрузка авторов...</p> : (
        <div className="authors-grid">
          {authors.map(author => (
            <div key={author._id} className="author-card-new">
              <div className="author-card-new-header">
                <div className="author-card-new-info">
                  <div className="author-card-new-avatar">{author.name.charAt(0)}</div>
                  <div>
                    <div className="author-card-new-name">{author.name}</div>
                    <a href={author.link} target="_blank" rel="noopener noreferrer" className="author-card-new-nickname">@{author.nickname}</a>
                  </div>
                </div>
              </div>

              <div className="author-card-new-stats">
                <div><span>{((author.subscribers || 0) / 1000).toFixed(1)}K</span><label>Подписчиков</label></div>
                <div><span>{author.averageVirality || 0}</span><label>Средний КВ</label></div>
                <div><span>{author.postsPerDay || 0}</span><label>ЧПД</label></div>
              </div>

              <div className="author-card-new-footer">
                <button onClick={() => handleUpdate(author._id)} className="footer-icon-button" title="Обновить">
                    <img src={updateIcon} alt="Обновить" />
                </button>
                <button onClick={() => navigate(`/authors/${author._id}`)} className="footer-icon-button" title="Статистика">
                    <img src={statsIcon} alt="Статистика" />
                </button>
                <button onClick={() => handleDelete(author._id)} className="footer-icon-button" title="Удалить">
                    <img src={deleteIcon} alt="Удалить" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AuthorsPage;