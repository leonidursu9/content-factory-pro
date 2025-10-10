const mongoose = require('mongoose');

const AuthorSchema = new mongoose.Schema({
    name: { type: String },
    nickname: { type: String, required: true },
    link: { type: String, required: true },
    subscribers: { type: Number, default: 0 },
    
    // ДОБАВЛЕНО: Поле для хранения ID из Instagram
    instagramUserId: { type: String }, 
    
    lastProfileScraped: { type: Date, default: new Date(0) },
    lastPostsScraped: { type: Date, default: new Date(0) },
    
    subscribersHistory: [{
        count: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

AuthorSchema.index({ nickname: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Author', AuthorSchema);