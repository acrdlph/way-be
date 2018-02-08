const interaction_model = require('./interaction_model');

exports.find = function* find(query) {
    const result = yield interaction_model.find(query);
    return result;
}

exports.save = function* save(interaction) {
    const result = yield interaction.save();
    return result;
}

exports.findByConfirmationCode = function* find(confirmationCode) {
    const result = yield interaction_model.find({ confirmation_code: confirmationCode });
    return result;
}

exports.findInteractionCountByUserId = function* find(userId) {
  const interactionCount = yield interaction_model.count(
      {
          $and: [
              {
                  $or:[
                      {
                          initiator_id: userId
                      },
                      {
                          confirmor_id: userId
                      }
                  ]
              },
              {
                confirmed_on: {
                    $exists: true
                }
              }
          ]
      }
  );
  return interactionCount;
}
