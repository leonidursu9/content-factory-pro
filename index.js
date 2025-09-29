const express = require('express');
const mongoose = require('mongoose');
const Author = require('./models/Author.js');

// --- ВАЖНО: НЕ ЗАБУДЬ ВСТАВИТЬ СЮДА СВОЮ СТРОКУ ПОДКЛЮЧЕНИЯ ---
const DB_URL = "mongodb+srv://AJN0BH97l0kbOeVs:AJN0BH97l0kbOeVs@cluster0.p56kujj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const app = express();
const port = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());
// Middleware для раздачи статичных файлов из папки 'public'
app.use(express.static('public'));

async function startApp() {
  try {
    await mongoose.connect(DB_URL);
    console.log('✅ База данных успешно подключена!');
    app.listen(port, () => {
      console.log(`🚀 Сервер успешно запущен на http://localhost:${port}`);
    });
  } catch (e) {
    console.log('❌ Ошибка подключения к базе данных:', e);
  }
}

// Endpoint для получения всех авторов
app.get('/authors', async (req, res) => {
  try {
    const authors = await Author.find();
    res.json(authors);
  } catch (e) {
    res.status(500).json(e);
  }
});

// Endpoint для добавления автора
app.post('/authors', async (req, res) => {
  try {
    const { name, nickname, link } = req.body;
    const author = await Author.create({ name, nickname, link });
    res.status(201).json(author);
  } catch (e) {
    res.status(500).json(e);
  }
});

startApp();