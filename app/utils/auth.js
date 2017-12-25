const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const logger = require('../logger');
const config = require('../config');
const error_util = require('./error');

/**
 * 
 * @param {*} user_id 
 * @param {*} expires_in_ms 
 */
exports.jwtSign = function jwtSign(user_id, expires_in_ms) {
    return jwt.sign({ id: user_id }, config.get('server.private_key'), {
        expiresIn: expires_in_ms
    });
}

/**
 * 
 * @param {*} token 
 */
exports.verifyJwt = function verifyJwt(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config.get('server.private_key'), (err, decoded) => {
            if (err) {
                logger.error(err);
                reject(error_util.createError(401, "Failed to authenticate token"));
            }
            resolve(decoded);
        });
    });
}

/**
 * 
 * @param {*} password 
 * @param {*} hash 
 */
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

/**
 * 
 * @param {*} password 
 * @param {*} salt_rounds 
 */
exports.getPasswordHash = function* getPasswordHash(password, salt_rounds) {
    const password_hash = yield new Promise((resolve, reject) => {
        bcrypt.hash(password, salt_rounds, function(err, hash) {
            if (err) {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
    return password_hash;
}



