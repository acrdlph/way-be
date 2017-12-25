
const user_repository = require('./repository/user');
const interaction_repository = require('./repository/interaction');
const error_util = require('./utils/error');
const datetime_util = require('./utils/datetime');

exports.verifyInteraction = function* verifyInteraction(req, res) {
    const confirmation_code = req.params.confirmation_code;
    const username = req.params.username;
    if (!username || !confirmation_code) 
        throw error_util.createError(400, "username and confirmation code required");
    const interactions = yield interaction_repository.find({ initiator: username, confirmation_code: confirmation_code});
    if (interactions.length == 1) {
        const interaction = interactions[0];
        const initiator_id = interaction.initiator_id || '';
        if (interaction.confirmed_on) throw error_util.createError(400, "Already confirmed");
        const initiator = yield user_repository.getUserIfExists(initiator_id);
        interaction.confirmed_on = datetime_util.serverCurrentDate();
        interaction.receiver = req.body.receiver;
        interaction.receiver_id = req.body.receiver_id;
        yield interaction.save();
        if (initiator.points) {
            initiator.points += 1;
        } else {
            initiator.points = 1;
        }
        yield interaction_repository.save(initiator);
        res.json({confirmed: true});
    } else {
        throw error_util.createError(404, "No interaction found for the code");
    }
}