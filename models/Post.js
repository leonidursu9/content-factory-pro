const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    ownerId: { type: String, required: true }, // ID владельца поста
    shortCode: { type: String, required: true, unique: true }, // Уникальный код поста
    url: { type: String, required: true },
    caption: { type: String }, // Описание (крючок)
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    timestamp: { type: Date }, // Дата публикации
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' } // Ссылка на нашего автора
});

module.exports = mongoose.model('Post', PostSchema);