import React, { useState, useEffect } from 'react';
import { apiGetStatus, apiSetParserStatus } from '../api.js';
import './ProfilePage.css';

function ProfilePage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const data = await apiGetStatus();
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleToggleParser = async () => {
    if (!status) return;
    const newStatus = !status.parserSettings.isEnabled;
    try {
      setStatus(prev => ({ 
          ...prev, 
          parserSettings: { ...prev.parserSettings, isEnabled: newStatus }
      }));
      await apiSetParserStatus(newStatus);
    } catch (err) {
      setError(err.message);
      setStatus(prev => ({ 
          ...prev, 
          parserSettings: { ...prev.parserSettings, isEnabled: !newStatus }
      }));
    }
  };

  if (loading) {
    return <div className="page-container"><p className="loading-text">Загрузка профиля...</p></div>;
  }

  if (error) {
    return <div className="page-container"><p className="error-message">{error}</p></div>;
  }
  
  // Добавляем проверку на случай, если status или вложенные объекты еще не загрузились
  if (!status || !status.parserSettings || !status.lastParse) {
      return <div className="page-container"><p className="loading-text">Загрузка данных...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="header-banner profile-banner">
        <h1>Профиль и Настройки</h1>
        <p>Управление работой приложения.</p>
      </div>
      
      {status.notifications && status.notifications.length > 0 && (
          <div className="notification-card">
              <h2>Важные уведомления</h2>
              {status.notifications.map((notif, index) => (
                  <div key={index} className="notification-item">
                      <strong>{notif.service}:</strong> {notif.message}
                  </div>
              ))}
          </div>
      )}

      <div className="profile-card">
        <h2>Статус Парсера</h2>
        <div className="setting-row">
          <span>Автоматический парсинг</span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={status.parserSettings.isEnabled}
              onChange={handleToggleParser}
            />
            <span className="slider round"></span>
          </label>
        </div>
        <p className="setting-description">
          {status.parserSettings.isEnabled ? 'Парсер активен и сканирует авторов по расписанию.' : 'Парсер выключен. Новые посты не будут загружаться.'}
        </p>
      </div>

      <div className="profile-card">
          <h2>Последний запуск</h2>
          <div className="setting-row">
              <span>Тип:</span>
              <strong>{status.lastParse.type}</strong>
          </div>
          <div className="setting-row">
              <span>Время:</span>
              <strong>
                  {status.lastParse.timestamp 
                      ? new Date(status.lastParse.timestamp).toLocaleString('ru-RU') 
                      : '...'}
              </strong>
          </div>
      </div>
      
      <div className="profile-card">
        <h2>Статистика</h2>
        <div className="setting-row">
          <span>Отслеживаемые авторы:</span>
          <strong>{status.parserSettings.currentAuthors} / {status.parserSettings.maxAuthors}</strong>
        </div>
        <div className="progress-bar-container">
            <div 
                className="progress-bar" 
                style={{ width: `${(status.parserSettings.currentAuthors / status.parserSettings.maxAuthors) * 100}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;