const moment = require('moment');
const co = require('co');
const mongoose = require('mongoose');
const _ = require('lodash');
const jwt = require('jsonwebtoken');

const logger = require('./logger');
const config = require('./config');
const user_model = require('./models/geo_user');
const message_model = require('./models/message');

const TWENTY_FOUR_HOURS = 86400;

/**
 * create an error object with a http error code
 * @param {*} code
 * @param {*} message
 */
exports.createError = (code, message) => {
    const e = new Error();
    e.code = code;
    e.message = message;
    return e;
}

/**
 * Handle error with proper http response
 * @param {*} req
 * @param {*} res
 * @param {*} err
 */
exports.handleError = (req, res, err, details) => {
    logger.error(err);
    res.status(err.code || 500).json({
        ...details,
        message: err.message
    });
}

/**
 * Main controller which calls other controllers and handles errors
 * @param {*} controllerFunc
 * @param {*} req
 * @param {*} res
 */
exports.mainControlller = (controllerFunc, req, res) =>
    co(controllerFunc(req, res))
    .catch(err => this.handleError(req, res, err))


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

exports.jwtSign = function jwtSign(user_id) {
    return jwt.sign({ id: user_id }, config.get('server.private_key'), {
        expiresIn: TWENTY_FOUR_HOURS
    });
}

exports.verifyJwt = function verifyJwt(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config.get('server.private_key'), (err, decoded) => {
            if (err) {
                logger.error(err);
                reject(this.createError(401, "Failed to authenticate token"));
            }
            resolve(decoded);
        });
    });
}

exports.mapUserOutput = function mapUserOutput(user, token) {
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
        interaction_url: user.interation_url,
        created_at: user.created_at,
        token: token
    }
}
