// Самая первая строка - активация dotenv
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const Author = require('./models/Author.js');
const { getInstagramProfileData } = require('./services/parser.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

async function startApp() {
  try {
    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
    // Получаем URL базы данных и сразу проверяем, что он есть
    const DB_URL = process.env.DB_URL;
    if (!DB_URL) {
      throw new Error('ОШИБКА: DB_URL не найдена. Проверьте ваш .env файл.');
    }

    await mongoose.connect(DB_URL);
    console.log('✅ База данных успешно подключена!');

    app.listen(port, () => {
      console.log(`🚀 Сервер успешно запущен на http://localhost:${port}`);
    });

  } catch (e) {
    // Теперь мы будем видеть нашу собственную ошибку, если проблема в .env
    console.log('❌ Ошибка запуска приложения:', e.message);
  }
}

// ... (весь ваш код с эндпоинтами остается без изменений) ...
app.get('/authors', async (req, res) => {
    try {
        const authors = await Author.find();
        res.json(authors);
    } catch (e) {
        res.status(500).json(e);
    }
});

app.post('/authors', async (req, res) => {
    try {
        const { name, nickname, link } = req.body;
        const author = await Author.create({ name, nickname, link });
        res.status(201).json(author);
    } catch (e) {
        res.status(500).json(e);
    }
});

app.post('/parse', async (req, res) => {
    try {
        const { nickname } = req.body;
        if (!nickname) {
            return res.status(400).json({ message: "Nickname is required" });
        }
        const parsedData = await getInstagramProfileData(nickname);
        res.json(parsedData);
    } catch (error) {
        console.error('Parsing error:', error);
        res.status(500).json({ message: 'Failed to parse data' });
    }
});


startApp();