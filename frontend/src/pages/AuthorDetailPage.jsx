import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetAuthorById, apiUpdateAuthor } from '../api.js';
import PostCard from '../components/PostCard.jsx';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './AuthorDetailPage.css';

import backIcon from '../assets/назад.png';
import updateIcon from '../assets/обновить профиль.png'; // Импортируем новую иконку

ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler );

function AuthorDetailPage() {
    const navigate = useNavigate();
    const { id: authorId } = useParams();
    
    const [author, setAuthor] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authorId) return;
        const fetchAuthorData = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await apiGetAuthorById(authorId);
                setAuthor(data.author);
                setPosts(data.posts);
            } catch (err) {
                setError(err.message || 'Не удалось загрузить данные автора.');
            } finally {
                setLoading(false);
            }
        };
        fetchAuthorData();
    }, [authorId]);

    const handleUpdate = async () => {
        alert('Обновление профиля автора запущено в фоновом режиме!');
        try {
            await apiUpdateAuthor(authorId);
        } catch (e) {
            alert(`Ошибка обновления: ${e.message}`);
        }
    };
    
    if (loading) return <p className="loading-text">Загрузка профиля автора...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!author) return <p className="loading-text">Автор не найден.</p>;

    const chartData = {
        labels: author.subscribersHistory.map(entry => new Date(entry.timestamp).toLocaleDateString('ru-RU')),
        datasets: [
            {
                label: 'Подписчики',
                data: author.subscribersHistory.map(entry => entry.count),
                fill: true,
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderColor: 'rgba(0, 122, 255, 1)',
                tension: 0.3,
                pointBackgroundColor: 'rgba(0, 122, 255, 1)',
                pointBorderColor: '#fff',
                pointHoverRadius: 7,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
            y: { ticks: { callback: (value) => `${(value / 1000)}k` } },
            x: { grid: { display: false } }
        },
    };

    return (
        <div className="page-container">
            <div className="detail-header">
                <button onClick={() => navigate('/authors')} className="back-button" title="Назад">
                    <img src={backIcon} alt="Назад" />
                </button>
                <h1>{author.name || author.nickname}</h1>
                <button onClick={handleUpdate} className="update-profile-button" title="Обновить профиль">
                    <img src={updateIcon} alt="Обновить" />
                </button>
            </div>
            
            <div className="stats-container">
                <div className="author-card-new-stats detail-stats">
                    <div><span>{((author.subscribers || 0) / 1000).toFixed(1)}K</span><label>Подписчиков</label></div>
                    <div><span>{posts.length || 0}</span><label>Постов в базе</label></div>
                </div>
            </div>

            <div className="chart-container">
                <h3>Динамика роста</h3>
                <div className="chart-wrapper">
                    {author.subscribersHistory && author.subscribersHistory.length > 1 ? (
                        <Line options={chartOptions} data={chartData} />
                    ) : (
                        <p className="no-chart-data">Недостаточно данных для построения графика.</p>
                    )}
                </div>
            </div>
            
            <h2 className="posts-section-title">Последние посты автора</h2>
            <div className="posts-grid">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard key={post._id} post={post} />
                    ))
                ) : (
                    <p className="loading-text">Посты этого автора еще не были загружены в базу.</p>
                )}
            </div>
        </div>
    );
}

export default AuthorDetailPage;