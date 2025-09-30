require('dotenv').config();
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: process.env.APIFY_API_KEY,
});

const INSTAGRAM_ACTOR_ID = 'apify/instagram-profile-scraper';

async function getInstagramProfileData(username) {
    console.log(`[ПАРСЕР] Начинаю парсинг реального профиля: ${username}`);
    
    try {
        const input = {
            usernames: [username],
            // Добавляем сессионные cookie, чтобы запрос выглядел аутентифицированным
            proxyConfiguration: { useApifyProxy: true },
            sessionCookies: [
                {
                    "name": "sessionid",
                    "value": process.env.INSTAGRAM_SESSION_COOKIE,
                    "domain": ".instagram.com",
                }
            ]
        };

        const run = await client.actor(INSTAGRAM_ACTOR_ID).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items && items.length > 0) {
            console.log(`[ПАРСЕР] Успешно получил данные для: ${username}`);
            return items[0];
        } else {
            console.log(`[ПАРСЕР] Не удалось найти данные для: ${username}`);
            return null;
        }
    } catch (error) {
        console.error('[ПАРСЕР] Произошла ошибка:', error);
        throw new Error('Ошибка во время парсинга');
    }
}

module.exports = { getInstagramProfileData };