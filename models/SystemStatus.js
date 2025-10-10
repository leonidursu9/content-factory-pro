const mongoose = require('mongoose');

const SystemStatusSchema = new mongoose.Schema({
    // Ключ для идентификации нашей записи, например "parser"
    key: { type: String, required: true, unique: true },
    // Значение, которое мы будем хранить (в нашем случае, объект с логом)
    value: { type: Object }
});

module.exports = mongoose.model('SystemStatus', SystemStatusSchema);