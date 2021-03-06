const mongoose = require("mongoose");
const _ = require("lodash");
const uuidv4 = require("uuid/v4");

const interaction_model = require("../interaction/interaction_model");
const user_repository = require("./user_repository");
const role_repository = require("./role_repository");
const user_matchers = require("./user_matchers");
const user_helper = require("./user_helper");
const message_repository = require("../message/message_repository");
const partner_repository = require("../partner/partner_repository");
const interaction_repository = require("../interaction/interaction_repository");
const error_util = require("../utils/error");
const auth_util = require("../utils/auth");
const datetime_util = require("../utils/datetime");
const db_util = require("../utils/db");
const mapper_util = require("../utils/mapper");
const constants = require("../utils/constants");
const config = require("../config");
const logger = require("../logger");

const S3_USER_PHOTO_URL = (user, filename) =>
  `https://s3.${config.get(
    "s3.users_bucket.region"
  )}.amazonaws.com/${config.get("s3.users_bucket.name")}/${
    user.id
  }/${filename}`;

/**
 * get users from the perspective of a given user
 * @param {*} req
 * @param {*} res
 */
exports.usersByUser = function*(req, res) {
  const given_user = yield user_repository.getUserIfExists(req.params.user_id);
  const messages = yield message_repository.findByReceiverOrSender(
    given_user.id
  );
  const distance = req.query["distance"] || constants.USER_NEAR_BY_DISTANCE;
  const matched_users = yield user_matchers.geoMatcher(given_user, {
    messages: messages,
    distance: distance
  });
  const users = matched_users.map(user =>
    mapper_util.waitlistBuddy(given_user, user, messages)
  );
  // .filter(
  //     user => (
  //         true
  //         // mapper_util.getUserLocation(given_user.location, user.location)
  //         // user.time_left > 0 ||
  //         // user.count > 0 ||
  //         // user.god_user
  //     ) &&
  //     user.id != given_user.id)
  res.json(users);
};

// exports.getThemMessages = function*(req, res) {
//   const given_user = yield user_repository.getUserIfExists(req.params.user_id);
//   const messages = yield message_repository.findByReceiverOrSender(
//     given_user.id
//   );
//   let groupedMessages = [],
//     j = 0;
//   function alreadyAdded(groupedMessages, id) {
//     for (let k = 0; k < j; k++) {
//       if (groupedMessages[k].id === id) {
//         return k;
//       }
//     }
//   }
//   for (let i = 0; i < messages.length; i++) {
//     if (given_user.id === messages[i].sender_id) {
//       if (
//         alreadyAdded(groupedMessages, messages[i].receiver_id) === undefined
//       ) {
//         groupedMessages[j] = {
//           id: messages[i].receiver_id,
//           messages: messages[i]
//         };
//         console.log("proto");
//         j++;
//       } else {
//         console.log("deftero");
//         // groupedMessages[
//         //   alreadyAdded(groupedMessages, messages[i].receiver_id)
//         // ].messages.push(messages[i]);
//       }
//     } else {
//       if (alreadyAdded(groupedMessages, messages[i].sender_id) === undefined) {
//         console.log("trito");
//         groupedMessages[j] = {
//           id: messages[i].sender_id,
//           messages: messages[i]
//         };
//         j++;
//       } else {
//         console.log("tetarto");
//         // groupedMessages[
//         //   alreadyAdded(groupedMessages, messages[i].sender_id)
//         // ].messages.push(messages[i]);
//       }
//     }
//   }
//   console.log(groupedMessages);
//   res.json(messages);
// };

/**
 * get the given users details
 * @param {*} req
 * @param {*} res
 */
exports.getUserDetails = function*(req, res) {
  let user = yield user_repository.getUserForUsername(req.params.user_id);
  if (!user) {
    user = yield user_repository.getUserIfExists(req.params.user_id);
  }
  if (user.geolocation) {
    const partners_nearby = yield partner_repository.nearBy(user.geolocation);
    if (partners_nearby.length) {
      user.location = partners_nearby[0].location;
    }
  }

  const interactionCount = yield interaction_repository.findInteractionCountByUserId(
    user.id
  );
  user.waytcoins = interactionCount || 0;

  if (req.query.generate_url) {
    const confirmationCode = uuidv4().replace(/-/g, "");
    const interaction = new interaction_model({
      initiator_id: user.id,
      confirmor_id: null,
      confirmation_code: confirmationCode,
      created_at: datetime_util.serverCurrentDate()
    });
    yield interaction_repository.save(interaction);
    user.interaction_url =
      config.get("server.domain_name") +
      "/#/confirm-interaction/" +
      interaction.confirmation_code;
  }
  res.json(mapper_util.mapUserOutput(user));
};

/**
 * save a new user
 * @param {*} req
 * @param {*} res
 */
exports.saveUser = function*(req, res) {
  let location = req.body.location;
  let geolocation = req.body.geolocation;
  const name = req.body.name;
  if (!location && !geolocation)
    throw error_util.createError(400, "Please provide a location");
  const longitude = _.get(geolocation, "longitude");
  const latitude = _.get(geolocation, "latitude");
  if (longitude && latitude) {
    geolocation = db_util.constructPoint(
      parseFloat(longitude),
      parseFloat(latitude)
    );
  } else {
    geolocation = null;
  }
  const new_user = yield user_repository.createNewUser(
    name,
    location,
    geolocation
  );
  const token = auth_util.jwtSign(
    new_user.id,
    config.get("server.private_key"),
    constants.TWENTY_FOUR_HOURS
  );
  res.json(mapper_util.mapUserOutput(new_user, token));
};

/**
 * update a given user
 * @param {*} req
 * @param {*} res
 */
exports.updateUser = function*(req, res) {
  const user = yield user_repository.getUserIfExists(req.params.id);
  user.location = req.body.location || user.location;
  user.distance = req.body.distance || user.distance;
  user.geolocation = req.body.geolocation
    ? db_util.constructPoint(
        parseFloat(req.body.geolocation.longitude),
        parseFloat(req.body.geolocation.latitude)
      )
    : user.geolocation;
  user.name = req.body.name || user.name;
  user.interests = req.body.interests || user.interests;
  user.email = req.body.email || user.email;
  user.username = req.body.username || user.username;
  user.hangoutPlaces = req.body.hangoutPlaces || user.hangoutPlaces;
  user.seenModals = req.body.seenModals || user.seenModals;
  user.address = req.body.address;

  yield user.save();
  res.json(mapper_util.mapUserOutput(user));
};

exports.updateUserRole = function*(req, res) {
  if (user_helper.userAllowedRole(req.user, constants.USER_ROLES.SUPER_ADMIN)) {
    const new_role = yield role_repository.findByName(req.params.role_name);
    const user = yield user_repository.getUserIfExists(req.params.id);
    const is_add = req.query.is_add || false;
    if (is_add) {
      user.roles.push(new_role._id);
    } else {
      user.roles = [new_role._id];
    }
    yield user_repository.save(user);
    logger.warn("Role change for user ", user);
    res.json({});
  }
  throw error_util.createError(400);
};

exports.updatePhoto = function*(req, res) {
  const user = yield user_repository.getUserIfExists(req.params.user_id);
  user.photo = S3_USER_PHOTO_URL(user, req.file.standard_name);
  yield user.save();
  res.json(mapper_util.mapUserOutput(user));
};
