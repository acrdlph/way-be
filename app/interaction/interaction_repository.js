const interaction_model = require('./interaction_model');

exports.find = function* find(query) {
    const result = yield interaction_model.find(query);
    return result;
}

exports.save = function* save(interaction) {
    const result = yield interaction.save();
    return result;
}

exports.findByConfirmationCode = function* find(confirmation_code) {
    const result = yield interaction_model.find({ confirmation_code: confirmation_code });
    return result;
}
