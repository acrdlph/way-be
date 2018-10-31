const mongoose = require("mongoose");
const user_model = require("./geo_user_model");
const role_repository = require("./role_repository");
const error_util = require("../utils/error");
const datetime_util = require("../utils/datetime");
const constants = require("../utils/constants");

exports.find = function* find(query) {
  const result = yield user_model.find(query).populate("roles");
  return result;
};

exports.findByRole = function* findByRole(role) {
  const role_in_db = yield role_repository.findByName(role.name);
  const result = yield user_model
    .find({ roles: role_in_db._id })
    .populate("roles");
  return result;
};

exports.save = function* save(user) {
  const result = yield user.save();
  return result;
};

/**
 * Get user for the given id, throw error if does not exist
 * @param {*} id
 */
exports.getUserIfExists = function* getUserIfExists(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw error_util.createError(400, "Invalid User Id " + id);
  }
  const users = yield user_model.find({ _id: id }).populate("roles");
  if (!users.length) {
    throw error_util.createError(404, "User Not Found");
  }
  return users[0];
};

/**
 * Get user for the given id, throw error if does not exist
 * @param {*} id
 */
exports.getUserByAddress = function* getUserByAddress(address) {
  const users = yield user_model.find({ address: address }).populate("roles");
  if (!users.length) {
    throw error_util.createError(404, "User Not Found");
  }
  return users[0];
};

/**
 *
 * @param {*} username
 */
exports.getUserForUsername = function* getUserForUsername(username) {
  const users = yield user_model.find({ username: username }).populate("roles");
  if (!users.length) {
    return false;
  }
  return users[0];
};

/**
 *
 * @param {*} email
 */
exports.getUserForEmail = function* getUserForEmail(email) {
  const users = yield user_model.find({ email: email }).populate("roles");
  if (!users.length) {
    return false;
  }
  return users[0];
};

/**
 *
 * @param {*} username
 * @param {*} email
 * @param {*} password
 */
exports.createNewRegisteredUser = function* createNewRegisteredUser(
  username,
  email,
  password
) {
  const created_at = datetime_util.serverCurrentDate();
  const user_role = yield role_repository.findByName(
    constants.USER_ROLES.USER.name
  );
  const seenModals = {
    seenListModal: false,
    seenLocModal: false,
    seenProfModal: false
  };
  const new_user = new user_model({
    username: username,
    email: email,
    password: password,
    default_name: constants.USER_DEFAULT_NAME,
    signed_up: created_at,
    roles: [user_role._id],
    created_at: created_at,
    seenModals: seenModals
  });
  yield new_user.save();
  return new_user;
};

/**
 *
 * @param {*} name
 * @param {*} location
 * @param {*} geolocation
 */
exports.createNewUser = function* createNewUser(name, location, geolocation) {
  const created_at = datetime_util.serverCurrentDate();
  const anon_user_role = yield role_repository.findByName(
    constants.USER_ROLES.ANON_USER.name
  );
  const new_user = new user_model({
    name: name,
    default_name: constants.USER_DEFAULT_NAME,
    location: location,
    geolocation: geolocation,
    roles: [anon_user_role._id],
    created_at: created_at
  });
  yield new_user.save();
  return new_user;
};

/**
 *
 * @param {*} geolocation
 */
exports.nearByUsers = function* nearByUsers(
  geolocation,
  maxDistance = constants.USER_NEAR_BY_DISTANCE,
  id
) {
  function distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = ((lat2 - lat1) * Math.PI) / 180; // deg2rad below
    var dLon = ((lon2 - lon1) * Math.PI) / 180;
    var a =
      0.5 -
      Math.cos(dLat) / 2 +
      (Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon))) /
        2;

    return R * 2 * Math.asin(Math.sqrt(a)) * 1000;
  }

  const geo_near_users = yield user_model
    .find()
    .sort({ endorsement: 1 })
    .limit(200)
    .populate("roles")
    .exec();
  const filtered_users = geo_near_users.filter(user => {
    return (
      user._id.toString() === id.toString() ||
      (distance(
        geolocation.coordinates[1],
        geolocation.coordinates[0],
        user.geolocation.coordinates[1],
        user.geolocation.coordinates[0]
      ) <= user.distance &&
        distance(
          geolocation.coordinates[1],
          geolocation.coordinates[0],
          user.geolocation.coordinates[1],
          user.geolocation.coordinates[0]
        ) <= Number(maxDistance))
    );
  });
  return filtered_users;
};
