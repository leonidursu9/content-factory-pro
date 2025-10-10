import React, { useState, useEffect } from 'react';
import { apiGetPosts, apiParseAll, apiGetAuthors } from '../api.js'; 
import PostCard from '../components/PostCard.jsx';
import './ContentPage.css';

import refreshIcon from '../assets/обновить все.png';

function ContentPage() {
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState([]); // Для списка авторов в фильтре
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Состояния для фильтров
  const [filters, setFilters] = useState({
    search: '',
    authorId: 'all',
    period: 'all',
    sortBy: 'timestamp'
  });

  const fetchPostsAndAuthors = async () => {
    setLoading(true);
    setError('');
    try {
      const [postsData, authorsData] = await Promise.all([
        apiGetPosts(filters),
        apiGetAuthors()
      ]);
      setPosts(postsData);
      setAuthors(authorsData);
    } catch (err) {
      setError('Не удалось загрузить данные.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPostsAndAuthors();
  }, [filters]); // Перезагружаем посты при изменении фильтров

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError('');
    try {
      await apiParseAll();
      alert('Массовое обновление запущено. Новые посты появятся через несколько минут.');
      setTimeout(() => fetchPostsAndAuthors(), 120000); 
    } catch (error) {
      setError(`Не удалось запустить обновление: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="header-with-action">
        <div className="header-banner">
            <h1>Лента Контента</h1>
            <p>Самые свежие посты ваших конкурентов</p>
        </div>
        <button 
            onClick={handleRefresh} 
            className="refresh-button" 
            disabled={isRefreshing} 
            title="Обновить все"
        >
            {isRefreshing ? '...' : <img src={refreshIcon} alt="Обновить" />}
        </button>
      </div>

      {/* --- НОВАЯ ПАНЕЛЬ ФИЛЬТРОВ --- */}
      <div className="filter-panel">
        <input 
          type="text"
          name="search"
          placeholder="Поиск по тексту..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-search"
        />
        <div className="filter-row">
          <select name="authorId" value={filters.authorId} onChange={handleFilterChange} className="filter-select">
            <option value="all">Все авторы</option>
            {authors.map(author => (
              <option key={author._id} value={author._id}>{author.name}</option>
            ))}
          </select>
          <select name="period" value={filters.period} onChange={handleFilterChange} className="filter-select">
            <option value="all">За все время</option>
            <option value="7d">За неделю</option>
            <option value="24h">За 24 часа</option>
          </select>
          <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="filter-select">
            <option value="timestamp">Сортировка: по дате</option>
            <option value="viralCoefficient">Сортировка: по КВ</option>
          </select>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      
      {loading ? (
        <p className="loading-text">Загрузка ленты...</p>
      ) : (
        <div className="posts-grid">
          {posts && posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post._id} post={post} /> 
            ))
          ) : (
            <div className="empty-state">
              <h3>Посты не найдены</h3>
              <p>Попробуйте изменить фильтры или добавить больше авторов.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContentPage;