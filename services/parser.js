require('dotenv').config();
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: process.env.APIFY_API_KEY,
});

const INSTAGRAM_POST_SCRAPER_ID = 'apify/instagram-scraper';
const INSTAGRAM_PROFILE_SCRAPER_ID = 'apify/instagram-profile-scraper';

// Эта функция получает посты
async function getInstagramPosts(profileUrl) {
    console.log(`[ПАРСЕР-ПОСТЫ] Начинаю парсинг постов по ссылке: ${profileUrl}`);
    try {
        const input = {
            directUrls: [profileUrl],
            resultsType: "posts",
            resultsLimit: 15,
        };
        const run = await client.actor(INSTAGRAM_POST_SCRAPER_ID).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;
    } catch (error) {
        console.error('[ПАРСЕР-ПОСТЫ] Ошибка:', error);
        return [];
    }
}

// Эта функция получает данные профиля
async function getInstagramProfile(username) {
    console.log(`[ПАРСЕР-ПРОФИЛЬ] Получаю данные для: ${username}`);
    try {
        const input = {
            usernames: [username],
        };
        const run = await client.actor(INSTAGRAM_PROFILE_SCRAPER_ID).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        if (items && items.length > 0) {
            return items[0];
        }
        return null;
    } catch (error) {
        console.error('[ПАРСЕР-ПРОФИЛЬ] Ошибка:', error);
        return null;
    }
}

module.exports = { getInstagramPosts, getInstagramProfile };