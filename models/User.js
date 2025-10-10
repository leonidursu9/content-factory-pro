const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String },
    // Здесь в будущем можно хранить настройки пользователя
});

module.exports = mongoose.model('User', UserSchema);