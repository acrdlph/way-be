const co = require('co');
const util = require('./util');
const feedback_model = require('./models/feedback');

exports.save = function* (req, res) {
    const {email, feedback} = req.body;
    if (!feedback) {
        throw util.createError(400, "Please provide proper feedback!");
    }

    const new_feedback = new feedback_model({
        email,
        feedback,
        created_at: util.serverCurrentDate()
    });

    yield new_feedback.save();
    res.json(new_feedback);
}
