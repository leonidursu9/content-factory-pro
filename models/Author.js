const mongoose = require('mongoose');

const AuthorSchema = new mongoose.Schema({
    name: { type: String }, // Поле "имя" теперь необязательное
    nickname: { type: String, required: true, unique: true },
    link: { type: String, required: true },
    subscribers: { type: Number, default: 0 },
    videos: { type: Number, default: 0 },
    viralCoefficient: { type: Number, default: 0 }
});

module.exports = mongoose.model('Author', AuthorSchema);