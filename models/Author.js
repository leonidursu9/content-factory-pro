const mongoose = require('mongoose');

// Создаем "чертеж" (схему) для автора
const AuthorSchema = new mongoose.Schema({
    // Имя, тип - текст, поле обязательное
    name: { type: String, required: true },
    // Никнейм, тип - текст, обязательное и уникальное (не может быть двух одинаковых)
    nickname: { type: String, required: true, unique: true },
    // Ссылка на профиль, текст, обязательное
    link: { type: String, required: true },
    // Число подписчиков, тип - число, по умолчанию 0
    subscribers: { type: Number, default: 0 },
    // Число роликов, тип - число, по умолчанию 0
    videos: { type: Number, default: 0 },
    // Коэффициент виральности, тип - число, по умолчанию 0
    viralCoefficient: { type: Number, default: 0 }
});

// Экспортируем модель, чтобы ее можно было использовать в других файлах
module.exports = mongoose.model('Author', AuthorSchema);