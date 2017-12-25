const message_model = require('../models/message');

exports.find = function* find(query) {
    const result = yield message_model.find(query);
    return result;
}

exports.save = function* save(message) {
    const result = yield message.save();
    return result;
}