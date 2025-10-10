require('dotenv').config();
const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = 'instagram-api-fast-reliable-data-scraper.p.rapidapi.com';
const BASE_URL = 'https://instagram-api-fast-reliable-data-scraper.p.rapidapi.com';

const delay = ms => new Promise(res => setTimeout(res, ms));

// Вспомогательная функция для выполнения запросов
async function makeRequest(url) {
    if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY не найден в файле .env.");
    
    const options = {
        method: 'GET',
        url: url,
        // ИЗМЕНЕНИЕ: Устанавливаем таймаут в 30 секунд (30000 миллисекунд)
        timeout: 30000, 
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': API_HOST,
            'Accept-Encoding': '*' 
        }
    };
    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('[RapidAPI] Критическая ошибка запроса:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Шаг 1: Получаем ID пользователя по его имени
async function getUserIdByUsername(username) {
    const url = `${BASE_URL}/user_id_by_username?username=${username}`;
    const result = await makeRequest(url);
    if (result && result.UserID) {
        return result.UserID;
    }
    const errorMessage = result?.message || `Не удалось найти user_id для пользователя ${username}`;
    throw new Error(errorMessage);
}

// 1. Функция для получения ПРОФИЛЯ
async function getInstagramProfile(username) {
    try {
        const userId = await getUserIdByUsername(username);
        await delay(1200);
        
        const url = `${BASE_URL}/profile?user_id=${userId}`;
        const data = await makeRequest(url);
        
        return {
            fullName: data.full_name || username,
            followersCount: data.follower_count || 0,
            instagramUserId: userId, // Возвращаем ID, который мы получили
            link: `https://www.instagram.com/${data.username}/`
        };
    } catch (error) {
        console.error(`[RapidAPI] Не удалось получить профиль для ${username}:`, error.message);
        return null;
    }
}

// 2. Функция для получения ПОСТОВ
async function getInstagramPosts(author, limit = 15) {
    try {
        // Используем сохраненный ID, если он есть
        const userId = author.instagramUserId || await getUserIdByUsername(author.nickname);
        if (!userId) {
            throw new Error(`Не удалось получить User ID для ${author.nickname}`);
        }
        await delay(1200);

        const url = `${BASE_URL}/reels?user_id=${userId}&include_feed_video=true`;
        const data = await makeRequest(url);
        
        const items = data.data?.items || [];
        const postsToReturn = items.slice(0, limit);

        return postsToReturn.map(item => {
            const post = item.media;
            if (!post) return null;

            return {
                mediaId: post.code,
                caption: post.caption?.text || '',
                url: `https://www.instagram.com/p/${post.code}/`,
                likeCount: post.like_count || 0,
                commentCount: post.comment_count || 0,
                viewCount: post.play_count || post.view_count || 0,
                timestamp: new Date(post.taken_at * 1000),
            }
        }).filter(Boolean);
    } catch (error) {
        console.error(`[RapidAPI] Не удалось получить посты для ${author.nickname}:`, error.message);
        return [];
    }
}

module.exports = { getInstagramProfile, getInstagramPosts };