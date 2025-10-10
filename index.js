require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

// Импорты моделей
const Author = require('./models/Author.js');
const Post = require('./models/Post.js');
const Script = require('./models/Script.js');
const Idea = require('./models/Idea.js');
const User = require('./models/User.js');
const SystemStatus = require('./models/SystemStatus.js'); // <-- ДОБАВИЛИ НОВУЮ МОДЕЛЬ

// ... (остальной код остается таким же)

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_USER_ID = '68dbe08523a46aeb44dec6e6';
const MAX_AUTHORS_LIMIT = 30;
let isParserEnabled = true;
let isParsing = false;
const delay = ms => new Promise(res => setTimeout(res, ms));

app.use(cors());
app.use(express.json());

// --- НОВАЯ ФУНКЦИЯ ДЛЯ ЛОГИРОВАНИЯ ---
async function updateLastParseLog(type) {
    const log = { type, timestamp: new Date() };
    console.log(`[LOG] Обновление статуса парсера: ${type}`);
    await SystemStatus.findOneAndUpdate(
        { key: 'lastParseLog' },
        { value: log },
        { upsert: true } // Создаст запись, если ее нет
    );
}


async function updateAuthorProfile(author, type = 'Автоматический (Профили)') { 
    try { 
        console.log(`[ПРОФИЛЬ] Обновляю профиль для ${author.nickname}`); 
        const profileData = await getInstagramProfile(author.nickname); 
        if (profileData) { 
            author.name = profileData.fullName || author.nickname; 
            author.subscribers = profileData.followersCount; 
            author.instagramUserId = profileData.instagramUserId; 
            author.subscribersHistory.push({ count: profileData.followersCount, timestamp: new Date() }); 
            await author.save(); 
            await updateLastParseLog(type);
        } 
    } catch (e) { console.error(`[ПРОФИЛЬ] Ошибка обновления ${author.nickname}:`, e.message); throw e; } 
}

async function scrapePostsForAuthor(author, limit = 15, type = 'Автоматический (Посты)') {
    console.log(`[ПОСТЫ] Ищу ${limit} новых постов для ${author.nickname}...`);
    try {
        const postsData = await getInstagramPosts(author, limit);
        for (const postData of postsData) {
            if (!postData.mediaId) continue;
            let post = await Post.findOne({ mediaId: postData.mediaId, user: ADMIN_USER_ID });
            if (!post) {
                post = new Post({ mediaId: postData.mediaId, user: ADMIN_USER_ID, author: author._id, caption: postData.caption, url: postData.url, timestamp: new Date(postData.timestamp), metricsHistory: [{ views: postData.viewCount, likes: postData.likeCount, comments: postData.commentCount, timestamp: new Date() }] });
            } else {
                post.metricsHistory.push({ views: postData.viewCount, likes: postData.likeCount, comments: postData.commentCount, timestamp: new Date() });
            }
            post.viewsCount = postData.viewCount;
            post.likesCount = postData.likeCount;
            post.commentsCount = postData.commentCount;
            const updatedAuthor = await Author.findById(author._id);
            const { score: virality } = calculateVirality(post, updatedAuthor);
            post.viralCoefficient = virality;
            await post.save();
        }
        await updateLastParseLog(type);
    } catch (e) { console.error(`[ПОСТЫ] Ошибка при парсинге постов для ${author.nickname}:`, e.message); throw e; }
}

// ... (весь остальной код API-маршрутов остается без изменений, кроме /settings/status)

// --- ОБНОВЛЕННЫЙ МАРШРУТ ---
app.get('/settings/status', async (req, res) => {
    try {
        const currentAuthors = await Author.countDocuments({ user: ADMIN_USER_ID });
        const notifications = [];

        const parserUsed = currentAuthors * 100;
        const parserTotal = 50000;
        if (parserUsed / parserTotal > 0.9) {
            notifications.push({ type: 'error', service: 'Парсер (RapidAPI)', message: 'Лимит запросов скоро будет исчерпан!' });
        }

        const transcriberUsed = 15;
        const transcriberTotal = 120;
        if (transcriberUsed / transcriberTotal > 0.9) {
            notifications.push({ type: 'error', service: 'Транскрибация (Apify)', message: 'Лимит минут скоро будет исчерпан!' });
        }
        
        // Получаем лог из базы данных
        const lastParseStatus = await SystemStatus.findOne({ key: 'lastParseLog' });
        const lastParse = lastParseStatus ? lastParseStatus.value : { type: 'Еще не запускался', timestamp: null };

        const status = {
            parserSettings: { isEnabled: isParserEnabled, currentAuthors, maxAuthors: MAX_AUTHORS_LIMIT },
            lastParse: lastParse,
            notifications: notifications
        };
        res.json(status);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});


// ... (остальной код CRON-задач и запуска сервера остается таким же, но с вызовом updateLastParseLog)

cron.schedule('0 */8 * * *', async () => { if (isParsing || !isParserEnabled) return; isParsing = true; try { console.log('[CRON] Запуск обновления постов...'); const authors = await Author.find({ user: ADMIN_USER_ID }); for (const author of authors) { await scrapePostsForAuthor(author, 15, 'Автоматический (Посты)'); await delay(5000); } console.log('[CRON] Обновление постов завершено.'); } catch(e) { console.error("Ошибка в CRON-задаче обновления постов:", e); } finally { isParsing = false; } });
cron.schedule('0 0 * * *', async () => { if (isParsing || !isParserEnabled) return; isParsing = true; try { console.log('[CRON] Запуск обновления профилей...'); const authors = await Author.find({ user: ADMIN_USER_ID }); for (const author of authors) { await updateAuthorProfile(author, 'Автоматический (Профили)'); await delay(5000); } console.log('[CRON] Обновление профилей завершено.'); } catch(e) { console.error("Ошибка в CRON-задаче обновления профилей:", e); } finally { isParsing = false; } });
cron.schedule('0 2 * * *', async () => { if (!isParserEnabled) return; console.log('[CRON-ИДЕИ] Запуск ежедневного поиска и транскрибации...'); try { const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); const recentPosts = await Post.find({ timestamp: { $gte: sevenDaysAgo }, user: ADMIN_USER_ID }).populate('author'); recentPosts.sort((a, b) => (b.viralCoefficient || 0) - (a.viralCoefficient || 0)); const topPosts = recentPosts.slice(0, 5); if (topPosts.length === 0) { console.log('[CRON-ИДЕИ] Не найдено виральных постов за неделю для анализа.'); await updateLastParseLog('Автоматический (Идеи)'); return; } for (const post of topPosts) { const existingIdea = await Idea.findOne({ mediaId: post.mediaId, user: ADMIN_USER_ID }); if (existingIdea && existingIdea.transcript && !existingIdea.transcript.includes('Транскрибация не удалась')) continue; console.log(`[CRON-ИДЕИ] Транскрибирую топ-пост: ${post.url}`); const garbledTranscript = await transcribeVideo(post.url); await delay(10000); const finalTranscript = await correctTranscript(post.caption, garbledTranscript); const ideaData = { mediaId: post.mediaId, caption: post.caption, url: post.url, user: ADMIN_USER_ID, originalAuthor: post.author ? post.author.nickname : '?', postId: post._id, transcript: finalTranscript }; await Idea.findOneAndUpdate({ mediaId: post.mediaId, user: ADMIN_USER_ID }, ideaData, { upsert: true }); console.log(`[CRON-ИДЕИ] Идея для поста ${post.mediaId} сохранена с исправленным текстом.`); await delay(10000); } await updateLastParseLog('Автоматический (Идеи)'); console.log('[CRON-ИДЕИ] Работа конвейера завершена.'); } catch (e) { console.error('[CRON-ИДЕИ] Ошибка в работе конвейера:', e.message); } });

async function startApp() { try { await mongoose.connect(process.env.DB_URL); console.log('✅ База данных подключена!'); app.listen(port, () => console.log(`🚀 Бэкенд запущен на http://localhost:${port}`)); } catch (e) { console.log('❌ Ошибка запуска:', e.message); } }
startApp();