require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const Author = require('./models/Author.js');
const Post = require('./models/Post.js');
const Script = require('./models/Script.js');
const Idea = require('./models/Idea.js');
const User = require('./models/User.js');

const { getInstagramProfile, getInstagramPosts } = require('./services/parser.js');
const { transcribeVideo } = require('./services/transcriber.js');
const { rewriteScript, refineScript, correctTranscript } = require('./services/ai.js');
const { calculateVirality } = require('./services/analytics.js');

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_USER_ID = '68dbe08523a46aeb44dec6e6';
const MAX_AUTHORS_LIMIT = 30;
let isParserEnabled = true;
let isParsing = false;
const delay = ms => new Promise(res => setTimeout(res, ms));

let lastParseLog = { type: 'Еще не запускался', timestamp: null };

app.use(cors());
app.use(express.json());

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
            lastParseLog = { type, timestamp: new Date() };
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
        lastParseLog = { type, timestamp: new Date() };
    } catch (e) { console.error(`[ПОСТЫ] Ошибка при парсинге постов для ${author.nickname}:`, e.message); throw e; }
}

app.get('/authors', async (req, res) => { try { const authors = await Author.find({ user: ADMIN_USER_ID }); const authorsWithStats = await Promise.all(authors.map(async (author) => { const posts = await Post.find({ author: author._id }).sort({ timestamp: -1 }); const postCount = posts.length; let averageVirality = 0; if (postCount > 0) { const recentPosts = posts.slice(0, 5); const totalVirality = recentPosts.reduce((sum, post) => sum + (post.viralCoefficient || 0), 0); averageVirality = Math.round(totalVirality / recentPosts.length); } let postsPerDay = 0; if (postCount > 1) { const oldestPost = posts[postCount - 1]; const newestPost = posts[0]; const diffTime = Math.abs(newestPost.timestamp - oldestPost.timestamp); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays > 0) { postsPerDay = (postCount / diffDays).toFixed(1); } else { postsPerDay = postCount; } } else if (postCount === 1) { postsPerDay = 1; } return { ...author.toObject(), postCount, averageVirality, postsPerDay }; })); res.json(authorsWithStats); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/authors', async (req, res) => { if (isParsing) return res.status(429).json({ message: 'Система занята обновлением. Попробуйте через минуту.' }); isParsing = true; try { const currentAuthorCount = await Author.countDocuments({ user: ADMIN_USER_ID }); if (currentAuthorCount >= MAX_AUTHORS_LIMIT) throw new Error(`Достигнут лимит авторов.`); const { link } = req.body; const match = link.match(/instagram\.com\/([a-zA-Z0-9_.]+)/); const nickname = match ? match[1].replace('/', '') : null; if (!nickname) throw new Error("Неверная ссылка Instagram"); const existingAuthor = await Author.findOne({ nickname, user: ADMIN_USER_ID }); if (existingAuthor) throw new Error("Автор уже существует."); const profileData = await getInstagramProfile(nickname); if (!profileData || !profileData.instagramUserId) throw new Error("Не удалось получить данные профиля от парсера."); let author = await Author.create({ name: profileData.fullName || nickname, nickname, link: profileData.link, user: ADMIN_USER_ID, instagramUserId: profileData.instagramUserId, subscribers: profileData.followersCount, subscribersHistory: [{ count: profileData.followersCount }] }); await scrapePostsForAuthor(author, 5, 'Ручной (добавление автора)'); res.status(201).json(author); } catch (e) { console.error('Ошибка при добавлении автора:', e.message); res.status(500).json({ message: e.message }); } finally { isParsing = false; } });
app.get('/authors/:id', async (req, res) => { try { const author = await Author.findById(req.params.id); if (!author) { return res.status(404).json({ message: 'Автор не найден' }); } const posts = await Post.find({ author: author._id }).populate('author', 'name nickname').sort({ timestamp: -1 }); res.json({ author: { ...author.toObject(), postCount: posts.length }, posts }); } catch (e) { res.status(500).json({ message: 'Ошибка сервера' }); } });
app.delete('/authors/:id', async (req, res) => { try { const author = await Author.findById(req.params.id); if(author) { await Idea.deleteMany({ originalAuthor: author.nickname }); } await Post.deleteMany({ author: req.params.id, user: ADMIN_USER_ID }); await Author.findOneAndDelete({ _id: req.params.id, user: ADMIN_USER_ID }); res.json({ message: "Автор удален." }); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/authors/:id', (req, res) => { if (isParsing) return res.status(429).json({ message: 'Система занята. Попробуйте через минуту.' }); res.status(202).json({ message: `Обновление для автора запущено в фоновом режиме.` }); (async () => { isParsing = true; try { const author = await Author.findById(req.params.id); if (author) { await updateAuthorProfile(author, 'Ручной'); await delay(1200); await scrapePostsForAuthor(author, 15, 'Ручной'); } } catch(e) { console.error('Ошибка при ручном обновлении автора:', e.message); } finally { isParsing = false; } })(); });
app.post('/parse-all', (req, res) => { if (isParsing) return res.status(429).json({ message: 'Обновление уже запущено.' }); res.status(202).json({ message: "Массовое обновление запущено." }); (async () => { isParsing = true; try { const authors = await Author.find({ user: ADMIN_USER_ID }); for (const author of authors) { await scrapePostsForAuthor(author, 15, 'Ручной (все авторы)'); await delay(5000); } } catch(e) { console.error('Ошибка при массовом парсинге:', e.message); } finally { isParsing = false; } })(); });
app.get('/posts/cleanup-duplicates', async (req, res) => { try { const duplicates = await Post.aggregate([ { $group: { _id: "$mediaId", count: { $sum: 1 }, docs: { $push: "$_id" } } }, { $match: { count: { "$gt": 1 } } } ]); if (duplicates.length === 0) { return res.send("Дубликаты не найдены."); } let deletedCount = 0; for (const group of duplicates) { const idsToDelete = group.docs.slice(1); const result = await Post.deleteMany({ _id: { $in: idsToDelete } }); deletedCount += result.deletedCount; } res.send(`Очистка завершена. Удалено дубликатов: ${deletedCount}.`); } catch (e) { res.status(500).json({ message: `Ошибка при очистке: ${e.message}` }); } });
app.get('/posts', async (req, res) => { try { const { authorId, period, sortBy, search } = req.query; let filter = { user: ADMIN_USER_ID }; if (authorId && authorId !== 'all') { filter.author = authorId; } if (period && period !== 'all') { const date = new Date(); if (period === '24h') { date.setDate(date.getDate() - 1); } else if (period === '7d') { date.setDate(date.getDate() - 7); } filter.timestamp = { $gte: date }; } if (search) { filter.caption = { $regex: search, $options: 'i' }; } const sortOptions = {}; if (sortBy === 'viralCoefficient') { sortOptions.viralCoefficient = -1; } else { sortOptions.timestamp = -1; } const posts = await Post.find(filter).populate('author', 'name nickname').sort(sortOptions); res.json(posts); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/posts/:id', async (req, res) => { try { const post = await Post.findById(req.params.id).populate('author', 'name nickname'); if (!post) return res.status(404).json({ message: 'Пост не найден' }); res.json(post); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/rewrite', async (req, res) => { try { const { text } = req.body; if (!text) return res.status(400).json({ message: 'Текст не предоставлен.' }); const rewrittenText = await rewriteScript(text); res.json({ rewrittenText }); } catch(e) { res.status(500).json({ message: e.message }); } });
app.post('/refine-script', async (req, res) => { try { const { text } = req.body; if (!text) return res.status(400).json({ message: 'Текст для улучшения не предоставлен.' }); const refinedText = await refineScript(text); res.json({ rewrittenText: refinedText }); } catch(e) { res.status(500).json({ message: e.message }); } });
app.post('/verify', (req, res) => { res.json({ ok: true, message: "Verification placeholder" }); });
app.get('/settings/parser-log', (req, res) => { res.json(lastParseLog); });

app.get('/settings/status', async (req, res) => {
    try {
        const currentAuthors = await Author.countDocuments({ user: ADMIN_USER_ID });
        const notifications = [];

        // Логика проверки лимитов
        const parserUsed = currentAuthors * 100; // Примерный расчет: 100 запросов на автора в месяц
        const parserTotal = 50000;
        if (parserUsed / parserTotal > 0.9) {
            notifications.push({ type: 'error', service: 'Парсер (RapidAPI)', message: 'Лимит запросов скоро будет исчерпан!' });
        }

        const transcriberUsed = 15; // Статичное значение для примера
        const transcriberTotal = 120;
        if (transcriberUsed / transcriberTotal > 0.9) {
            notifications.push({ type: 'error', service: 'Транскрибация (Apify)', message: 'Лимит минут скоро будет исчерпан!' });
        }
        
        const status = {
            parserSettings: { isEnabled: isParserEnabled, currentAuthors, maxAuthors: MAX_AUTHORS_LIMIT },
            lastParse: lastParseLog,
            notifications: notifications // Отправляем массив уведомлений
        };
        res.json(status);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.post('/settings/parser', async (req, res) => { const { enabled } = req.body; if (typeof enabled !== 'boolean') return res.status(400).json({ message: 'Неверный параметр.' }); isParserEnabled = enabled; res.json({ enabled: isParserEnabled, message: `Парсер теперь ${isParserEnabled ? 'включен' : 'выключен'}.` }); });
app.post('/scripts', async (req, res) => { try { const { originalText, rewrittenText, originalAuthorName, postId } = req.body; const newScript = new Script({ originalText, rewrittenText, originalAuthorName, postId, user: ADMIN_USER_ID }); await newScript.save(); res.status(201).json(newScript); } catch (e) { res.status(500).json({ message: e.message }); } });
app.get('/scripts', async (req, res) => { try { const { postId } = req.query; const filter = { user: ADMIN_USER_ID }; if (postId) { filter.postId = postId; } const scripts = await Script.find(filter).populate('postId').sort({ createdAt: -1 }); res.json(scripts); } catch (e) { res.status(500).json({ message: e.message }); } });
app.put('/scripts/:id', async (req, res) => { try { const { rewrittenText } = req.body; const updatedScript = await Script.findByIdAndUpdate( req.params.id, { rewrittenText }, { new: true } ).populate('postId'); if (!updatedScript) return res.status(404).json({ message: 'Сценарий не найден.' }); res.json(updatedScript); } catch (e) { res.status(500).json({ message: e.message }); } });
app.delete('/scripts/:id', async (req, res) => { try { const deletedScript = await Script.findByIdAndDelete(req.params.id); if (!deletedScript) return res.status(404).json({ message: 'Сценарий удален.' }); res.json({ message: 'Сценарий удален' }); } catch (e) { res.status(500).json({ message: 'Ошибка при удалении сценария.' }); } });
app.get('/ideas', async (req, res) => { try { const ideas = await Idea.find({ user: ADMIN_USER_ID }).populate('postId').sort({ createdAt: -1 }); res.json(ideas); } catch (e) { res.status(500).json({ message: 'Ошибка при получении идей.' }); }});
app.delete('/ideas/:id', async (req, res) => { try { const deletedIdea = await Idea.findByIdAndDelete(req.params.id); if (!deletedIdea) return res.status(404).json({ message: 'Идея не найдена.' }); res.json({ message: 'Идея успешно удалена.' }); } catch (e) { res.status(500).json({ message: 'Ошибка при удалении идеи.' }); } });
app.post('/transcribe-post', async (req, res) => { try { const { postId } = req.body; const post = await Post.findById(postId).populate('author'); if (!post) return res.status(404).json({ message: 'Пост не найден.' }); const garbledTranscript = await transcribeVideo(post.url); const finalTranscript = await correctTranscript(post.caption, garbledTranscript); const ideaData = { mediaId: post.mediaId, caption: post.caption, url: post.url, user: ADMIN_USER_ID, originalAuthor: post.author ? post.author.nickname : '?', postId: post._id, transcript: finalTranscript }; const newIdea = await Idea.findOneAndUpdate({ mediaId: post.mediaId, user: ADMIN_USER_ID }, ideaData, { upsert: true, new: true }); res.status(201).json(newIdea); } catch (e) { console.error('[ТРАНСКРИБАЦИЯ] Ошибка:', e.message); res.status(500).json({ message: 'Ошибка сервера при транскрибации.' }); } });

cron.schedule('0 */8 * * *', async () => { if (isParsing || !isParserEnabled) return; isParsing = true; try { console.log('[CRON] Запуск обновления постов...'); const authors = await Author.find({ user: ADMIN_USER_ID }); for (const author of authors) { await scrapePostsForAuthor(author, 15, 'Автоматический (Посты)'); await delay(5000); } console.log('[CRON] Обновление постов завершено.'); } catch(e) { console.error("Ошибка в CRON-задаче обновления постов:", e); } finally { isParsing = false; } });
cron.schedule('0 0 * * *', async () => { if (isParsing || !isParserEnabled) return; isParsing = true; try { console.log('[CRON] Запуск обновления профилей...'); const authors = await Author.find({ user: ADMIN_USER_ID }); for (const author of authors) { await updateAuthorProfile(author, 'Автоматический (Профили)'); await delay(5000); } console.log('[CRON] Обновление профилей завершено.'); } catch(e) { console.error("Ошибка в CRON-задаче обновления профилей:", e); } finally { isParsing = false; } });
cron.schedule('0 2 * * *', async () => { if (!isParserEnabled) return; console.log('[CRON-ИДЕИ] Запуск ежедневного поиска и транскрибации...'); try { const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); const recentPosts = await Post.find({ timestamp: { $gte: sevenDaysAgo }, user: ADMIN_USER_ID }).populate('author'); recentPosts.sort((a, b) => (b.viralCoefficient || 0) - (a.viralCoefficient || 0)); const topPosts = recentPosts.slice(0, 5); if (topPosts.length === 0) { console.log('[CRON-ИДЕИ] Не найдено виральных постов за неделю для анализа.'); lastParseLog = { type: 'Автоматический (Идеи)', timestamp: new Date() }; return; } for (const post of topPosts) { const existingIdea = await Idea.findOne({ mediaId: post.mediaId, user: ADMIN_USER_ID }); if (existingIdea && existingIdea.transcript && !existingIdea.transcript.includes('Транскрибация не удалась')) continue; console.log(`[CRON-ИДЕИ] Транскрибирую топ-пост: ${post.url}`); const garbledTranscript = await transcribeVideo(post.url); await delay(10000); const finalTranscript = await correctTranscript(post.caption, garbledTranscript); const ideaData = { mediaId: post.mediaId, caption: post.caption, url: post.url, user: ADMIN_USER_ID, originalAuthor: post.author ? post.author.nickname : '?', postId: post._id, transcript: finalTranscript }; await Idea.findOneAndUpdate({ mediaId: post.mediaId, user: ADMIN_USER_ID }, ideaData, { upsert: true }); console.log(`[CRON-ИДЕИ] Идея для поста ${post.mediaId} сохранена с исправленным текстом.`); await delay(10000); } lastParseLog = { type: 'Автоматический (Идеи)', timestamp: new Date() }; console.log('[CRON-ИДЕИ] Работа конвейера завершена.'); } catch (e) { console.error('[CRON-ИДЕИ] Ошибка в работе конвейера:', e.message); } });

async function startApp() { try { await mongoose.connect(process.env.DB_URL); console.log('✅ База данных подключена!'); app.listen(port, () => console.log(`🚀 Бэкенд запущен на http://localhost:${port}`)); } catch (e) { console.log('❌ Ошибка запуска:', e.message); } }
startApp();