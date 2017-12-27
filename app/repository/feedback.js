const feedback_model = require('../models/feedback');

/**
 * TODO create a base repository for these
 */

exports.find = function* find(query) {
    const result = yield feedback_model.find(query);
    return result;
}

exports.save = function* save(feedback) {
    const result = yield feedback.save();
    return result;
}