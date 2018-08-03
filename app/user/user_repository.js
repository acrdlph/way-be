const mongoose = require('mongoose');
const user_model = require('./geo_user_model');
const role_repository = require('./role_repository');
const error_util = require('../utils/error');
const datetime_util = require('../utils/datetime');
const constants = require('../utils/constants');

exports.find = function* find(query) {
    const result = yield user_model.find(query).populate('roles');
    return result;
}

exports.findByRole = function* findByRole(role) {
    const role_in_db = yield role_repository.findByName(role.name);
    const result = yield user_model.find({ roles: role_in_db._id }).populate('roles');
    return result;
}

exports.save = function* save(user) {
    const result = yield user.save();
    return result;
}

/**
 * Get user for the given id, throw error if does not exist
 * @param {*} id
 */
exports.getUserIfExists = function* getUserIfExists(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw error_util.createError(400, 'Invalid User Id ' + id);
    }
    const users = yield user_model.find({ _id: id }).populate('roles');
    if (!users.length) {
        throw error_util.createError(404, 'User Not Found');
    }
    return users[0];
}

/**
 * Get user for the given id, throw error if does not exist
 * @param {*} id
 */
exports.getUserByAddress = function* getUserByAddress(address) {
    const users = yield user_model.find({ address: address }).populate('roles');
    if (!users.length) {
        throw error_util.createError(404, 'User Not Found');
    }
    return users[0];
}

/**
 * 
 * @param {*} username 
 */
exports.getUserForUsername = function* getUserForUsername(username) {
    const users = yield user_model.find({ username: username }).populate('roles');
    if (!users.length) {
        return false;
    }
    return users[0];
}

/**
 * 
 * @param {*} email 
 */
exports.getUserForEmail = function* getUserForEmail(email) {
    const users = yield user_model.find({ email: email }).populate('roles');
    if (!users.length) {
        return false;
    }
    return users[0];
}

/**
 * 
 * @param {*} username 
 * @param {*} email 
 * @param {*} password 
 */
exports.createNewRegisteredUser = function* createNewRegisteredUser(username, email, password) {
    const created_at = datetime_util.serverCurrentDate();
    const user_role = yield role_repository.findByName(constants.USER_ROLES.USER.name);
    const new_user = new user_model({
        username: username,
        email: email,
        password: password,
        default_name: constants.USER_DEFAULT_NAME,
        signed_up: created_at,
        roles: [user_role._id],
        created_at: created_at
    });
    yield new_user.save();
    return new_user;
}

/**
 * 
 * @param {*} name 
 * @param {*} waiting_time 
 * @param {*} location 
 * @param {*} geolocation 
 */
exports.createNewUser = function* createNewUser(name, waiting_time, location, geolocation) {
    const created_at = datetime_util.serverCurrentDate();
    const anon_user_role = yield role_repository.findByName(constants.USER_ROLES.ANON_USER.name);
    const new_user = new user_model({
        name: name,
        default_name: constants.USER_DEFAULT_NAME,
        waiting_time: waiting_time,
        location: location,
        geolocation: geolocation,
        waiting_started_at: created_at,
        roles: [anon_user_role._id],
        created_at: created_at
    });
    yield new_user.save();
    return new_user;
}

/**
 * 
 * @param {*} geolocation 
 */
exports.nearByUsers = function* nearByUsers(geolocation, maxDistance = constants.USER_NEAR_BY_DISTANCE) {
    const geo_near_users = yield user_model.find()
        .where('geolocation').near({
            center: geolocation,
            maxDistance: maxDistance
        }).sort({ endorsement: 1 }).limit(200)
        .populate('roles')
        .exec();
    return geo_near_users;
}