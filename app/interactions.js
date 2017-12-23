
const interaction_model = require('./models/interaction');
const util = require('./util');

exports.verifyInteraction = function* verifyInteraction(req, res) {
    const confirmation_code = req.params.confirmation_code;
    const username = req.params.username;
    if (!username || !confirmation_code) 
        throw util.createError(400, "username and confirmation code required");
    const interactions = yield interaction_model.find({ initiator: username, confirmation_code: confirmation_code});
    if (interactions.length == 1) {
        const interaction = interactions[0];
        const initiator_id = interaction.initiator_id || '';
        if (interaction.confirmed_on) throw util.createError(400, "Already confirmed");
        const initiator = yield util.getUserIfExists(initiator_id);
        interaction.confirmed_on = util.serverCurrentDate();
        interaction.receiver = req.body.receiver;
        interaction.receiver_id = req.body.receiver_id;
        yield interaction.save();
        if (initiator.points) {
            initiator.points += 1;
        } else {
            initiator.points = 1;
        }
        yield initiator.save();
        res.json({confirmed: true});
    } else {
        throw util.createError(404, "No interaction found for the code");
    }
}