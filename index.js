require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const Author = require('./models/Author.js');
const Post = require('./models/Post.js');
const { getInstagramPosts, getInstagramProfile } = require('./services/parser.js'); // Импортируем обе функции
const { rewriteScript } = require('./services/ai.js');
const { calculateVirality, forecastViews } = require('./services/analytics.js');

// Настройка бота
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot;
if (token && chatId) {
    bot = new TelegramBot(token);
    console.log('🤖 Телеграм-бот инициализирован.');
} else {
    console.warn('⚠️  Токен или ID чата для Телеграм-бота не найдены.');
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Функция для массового парсинга
async function parseAllAuthors() {
    console.log('[AUTO-PARSE] Запуск парсинга всех авторов...');
    const authors = await Author.find();
    if (!authors || authors.length === 0) {
        console.log('[AUTO-PARSE] Авторы не найдены в базе.');
        return;
    }

    for (const author of authors) {
        try {
            console.log(`[AUTO-PARSE] Парсинг автора: ${author.nickname}`);

            // 1. Получаем данные профиля и обновляем подписчиков
            const profileData = await getInstagramProfile(author.nickname);
            if (profileData && profileData.followersCount) {
                author.subscribers = profileData.followersCount;
                await author.save();
                console.log(`[DATABASE] Обновлены подписчики для ${author.nickname}: ${author.subscribers}`);
            }

            // 2. Получаем и сохраняем посты
            const allPosts = await getInstagramPosts(author.link);
            if (!allPosts || allPosts.length === 0) continue;

            const videoPosts = allPosts.filter(post => post.type !== 'Image');
            if (videoPosts.length === 0) continue;

            for (const postData of videoPosts) {
                const existingPost = await Post.findOne({ shortCode: postData.shortCode });
                if (!existingPost) {
                    const newPost = new Post({
                        ownerId: postData.ownerId, shortCode: postData.shortCode, url: postData.url,
                        caption: postData.caption, likesCount: postData.likesCount, commentsCount: postData.commentsCount,
                        viewsCount: postData.videoPlayCount || 0, timestamp: new Date(postData.timestamp), author: author._id,
                        metricsHistory: [{ likes: postData.likesCount, comments: postData.commentsCount, views: postData.videoPlayCount || 0 }]
                    });
                    await newPost.save();
                } else {
                    existingPost.likesCount = postData.likesCount;
                    existingPost.commentsCount = postData.commentsCount;
                    existingPost.viewsCount = postData.videoPlayCount || 0;
                    if (!existingPost.metricsHistory) { existingPost.metricsHistory = []; }
                    existingPost.metricsHistory.push({
                        likes: postData.likesCount, comments: postData.commentsCount, views: postData.videoPlayCount || 0
                    });
                    await existingPost.save();
                }
            }
        } catch (e) {
            console.error(`[AUTO-PARSE] Ошибка при парсинге автора ${author.nickname}:`, e.message);
        }
    }
    console.log('[AUTO-PARSE] Парсинг всех авторов завершен.');
    
    // Анализ и отправка отчета
    if (bot) {
        // ... (здесь будет логика отправки отчета ботом)
    }
}

// Старт приложения
async function startApp() {
  try {
    const DB_URL = process.env.DB_URL;
    if (!DB_URL) { throw new Error('ОШИБКА: DB_URL не найдена. Проверьте ваш .env файл.'); }
    await mongoose.connect(DB_URL);
    console.log('✅ База данных успешно подключена!');
    app.listen(port, () => {
      console.log(`🚀 Сервер успешно запущен на http://localhost:${port}`);
      cron.schedule('0 * * * *', () => {
          parseAllAuthors();
      });
      console.log('🕒 Автоматический ежечасный парсинг настроен.');
    });
  } catch (e) {
    console.log('❌ Ошибка запуска приложения:', e.message);
  }
}

// Эндпоинты
app.get('/authors', async (req, res) => {
    try { const authors = await Author.find(); res.json(authors); } catch (e) { res.status(500).json(e); }
});

app.get('/posts', async (req, res) => {
    try { const posts = await Post.find().sort({ timestamp: -1 }); res.json(posts); } catch (e) { res.status(500).json(e); }
});

app.post('/authors', async (req, res) => {
    try { const { name, nickname, link } = req.body; const author = await Author.create({ name, nickname, link }); res.status(201).json(author); } catch (e) { res.status(500).json(e); }
});

app.post('/parse-all', (req, res) => {
    parseAllAuthors();
    res.json({ message: "Массовый парсинг запущен в фоновом режиме." });
});

app.post('/rewrite', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) { return res.status(400).json({ message: "Текст не предоставлен" }); }
        const rewrittenText = await rewriteScript(text);
        res.json({ rewrittenText: rewrittenText });
    } catch (error) {
        res.status(500).json({ message: 'Внутренняя ошибка сервера при переписывании' });
    }
});

startApp();