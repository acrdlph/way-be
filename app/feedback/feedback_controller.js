const co = require('co');
const error_util = require('../utils/error');
const date_util = require('../utils/datetime');
const feedback_repository = require('./feedback_repository');
const feedback_model = require('./feedback_model');

exports.save = function* (req, res) {
    const {email, feedback} = req.body;
    if (!feedback) {
        throw error_util.createError(400, "Please provide proper feedback!");
    }

    const new_feedback = new feedback_model({
        email,
        feedback,
        created_at: date_util.serverCurrentDate()
    });

    yield feedback_repository.save(new_feedback);
    res.json(new_feedback);
}
