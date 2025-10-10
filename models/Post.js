const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    // 💡 КРИТИЧЕСКОЕ ПОЛЕ: Уникальный ID поста, который мы получаем от парсера.
    mediaId: { type: String, required: true, unique: true }, 

    url: { type: String, required: true },
    caption: { type: String },
    
    // Метрики поста
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    timestamp: { type: Date },

    // 💡 ГЛАВНОЕ ПОЛЕ АНАЛИТИКИ: Коэффициент Виральности
    viralCoefficient: { type: Number, default: 0 }, 
    
    // Связь с автором и пользователем
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // История метрик для расчета КВ (скорости роста)
    metricsHistory: [{
        views: Number,
        likes: Number,
        comments: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    
});

module.exports = mongoose.model('Post', PostSchema);