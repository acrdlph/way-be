const mongoose = require('mongoose');
const user_model = require('../models/geo_user');
const error_util = require('../utils/error');
const datetime_util = require('../utils/datetime');
const constants = require('../utils/constants');

exports.find = function* find(query) {
    const result = yield user_model.find(query);
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
    const users = yield user_model.find({_id: id});
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
    const users = yield user_model.find({username: username});
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
    const users = yield user_model.find({email: email});
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
    const new_user = new user_model(
        {
            username: username,
            email: email,
            password: password,
            default_name: constants.USER_DEFAULT_NAME,
            signed_up: created_at,
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
    const new_user = new user_model(
        {
            name: name,
            default_name: constants.USER_DEFAULT_NAME,
            waiting_time: waiting_time,
            location: location,
            geolocation: geolocation,
            waiting_started_at: created_at,
            created_at: created_at
        });
    yield new_user.save();
    return new_user;
}