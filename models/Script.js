const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
    // Оригинальный текст из поста конкурента
    originalText: {
        type: String,
        required: true,
    },
    // Текст, сгенерированный ИИ, который пользователь может редактировать
    rewrittenText: {
        type: String,
        required: true,
    },
    // Для контекста сохраним имя автора-источника
    originalAuthorName: {
        type: String,
        required: false,
    },
    // ДОБАВЛЕНО: Ссылка на исходный пост
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    // Ссылка на пользователя, которому принадлежит сценарий
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Script = mongoose.model('Script', scriptSchema);

module.exports = Script;