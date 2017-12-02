const moment = require('moment');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const _ = require('lodash');

const user_model = require('./models/geo_user');
const message_model = require('./models/message');

const PASSWORD_SALT_ROUNDS = 10;

/**
 * create an error object
 * @param {*} code 
 * @param {*} message 
 */
exports.createError = function(code, message) {
    const e = new Error();
    e.code = code;
    e.message = message;
    return e;
}

/**
 * Get user for the given id, throw error if does not exist
 * @param {*} id 
 */
exports.getUserIfExists = function* getUserIfExists(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw this.createError(400, 'Invalid User Id');
    }
    const users = yield user_model.find({_id: id});
    if (!users.length) {
        throw this.createError(404, 'User Not Found');
    }
    return users[0];
}

exports.getUserForUsername = function* getUserForUsername(username) {
    const users = yield user_model.find({username: username});
    if (!users.length) {
        return false;
    }
    return users[0];
}

exports.getUserForEmail = function* getUserForEmail(email) {
    const users = yield user_model.find({email: email});
    if (!users.length) {
        return false;
    }
    return users[0];
}

exports.mapUserOutput = function mapUserOutput(user) {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        default_name: user.default_name,
        interests: user.interests,
        waiting_time: user.waiting_time,
        location: user.location,
        photo: user.photo,
        geolocation: {
            longitude: _.get(user, 'geolocation.coordinates.0'),
            latitude: _.get(user, 'geolocation.coordinates.1')
        },
        signed_up: user.signed_up,
        created_at: user.created_at
    }
}


exports.getPasswordHash = function* getPasswordHash(password) {
    const password_hash = yield new Promise((resolve, reject) => {
        bcrypt.hash(password, PASSWORD_SALT_ROUNDS, function(err, hash) {
            if (err) {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
    return password_hash;
}

exports.verifyPassword = function* verifyPassword(password, hash) {
    const correct_pass = yield new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, function(err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
    return correct_pass;
}