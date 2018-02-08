
const user_repository = require('../user/user_repository');
const interaction_repository = require('./interaction_repository');
const error_util = require('../utils/error');
const datetime_util = require('../utils/datetime');

const interactionExpirationTimeMS = 60 * 60 * 1000; // 1h

exports.confirmInteraction = function* confirmInteraction(req, res) {
    const confirmationCode = req.params.confirmation_code;
    const confirmorId = req.body.confirmorId;
    console.log('confirmationCode', confirmationCode);
    console.log('confirmorId', confirmorId);

    if (!confirmorId || !confirmationCode) {
        throw error_util.createError(400, "confirmationCode and confirmorId required");
    }

    const interactions = yield interaction_repository.findByConfirmationCode(confirmationCode);
    if (interactions.length == 1) {
      const interaction = interactions[0];
      const currentTime = datetime_util.serverCurrentDate();
      console.log(interaction);

      if (confirmorId === interaction.initiator_id) {
          //throw error_util.createError(400, "initiator and confirmor have to be different persons");
      }

      if(interaction.confirmed_on) {
          if(!interaction.expired_on) {
              interaction.expired_on = currentTime;
              yield interaction_repository.save(interaction);
          }
          throw error_util.createError(400, "interaction was already confirmed");
      }

      const currentTimeMS = currentTime.getTime()
      const interactionStartTimeMS = interaction.created_at.getTime();
      const interactionAgeMS = currentTimeMS - interactionStartTimeMS;
      if(interactionAgeMS > interactionExpirationTimeMS) {
          throw error_util.createError(400, "interaction has expired");
      }

      interaction.confirmor_id = confirmorId;
      interaction.confirmed_on = currentTime;
      yield interaction_repository.save(interaction);

      res.json({confirmed: true});

    } else {
        throw error_util.createError(404, "No interaction found for the code");
    }

}
