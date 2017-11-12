const moment = require('moment');
const mongoose = require('mongoose');
const user_model = require('./models/user');
const message_model = require('./models/message');

/**
 * create an error object
 * @param {*} code 
 * @param {*} message 
 */
exports.createError = function(code, message) {
    let e = new Error();
    e.code = code;
    e.message = message;
    return e;
}

/**
 * Get user for the given id, throw error if does not exist
 * @param {*} id 
 */
exports.getUserIfExists = function* (id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw this.createError(404, 'Invalid User Id');
    }
    let users = yield user_model.find({_id: id});
    if (!users.length) {
        throw this.createError(404, 'User Not Found');
    }
    return users[0];
}