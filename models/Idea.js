const mongoose = require('mongoose');

const IdeaSchema = new mongoose.Schema({
    mediaId: { type: String, required: true }, 
    caption: { type: String },
    url: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalAuthor: { type: String, default: 'Неизвестно' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    
    // ДОБАВЛЕНО: Поле для хранения текста из видео
    transcript: { type: String },

    createdAt: { type: Date, default: Date.now },
});

// Делаем mediaId уникальным для каждого пользователя, чтобы не было дублей
IdeaSchema.index({ mediaId: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Idea', IdeaSchema);