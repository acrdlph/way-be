const moment = require('moment');
const mongoose = require('mongoose');
const user_model = require('./models/user');
const message_model = require('./models/message');
const util = require('./util');

/**
 * get users from the perspective of a given user
 * @param {*} req 
 * @param {*} res 
 */
exports.usersByUser = function* (req, res) {
    let given_user = yield util.getUserIfExists(req.params.user_id);
    let users = yield user_model.find({});
    let messages = yield message_model.find({ receiver_id: given_user.id });
    users = users.map(user => {
        return {
            id: user._id,
            name: user.name,
            interests: user.interests,
            location: user.location,
            time_left: moment(user.created_at)
                .add(user.waiting_time, 'm')
                .diff(new Date(), 'minutes'),
            count: messages.filter(
                message => message.sender_id === user._id &&
                    message.receiver_id === given_user.id).length
        }
    }).filter(user => user.time_left > 0 && user.id !== given_user.id);
    res.json(users);
};

/**
 * get the given users details
 * @param {*} req 
 * @param {*} res 
 */
exports.getUserDetails = function* (req, res) {
    let user = yield util.getUserIfExists(req.params.user_id);
    res.json(user);
}

/**
 * save a new user
 * @param {*} req 
 * @param {*} res 
 */
exports.saveUser = function* (req, res) {
    let location = req.body.location;
    let waiting_time = req.body.waiting_time;
    if (!location || !waiting_time) throw new Error("Can not save user");
    let new_user = new user_model(
        {
            waiting_time: waiting_time,
            location: location,
            created_at: new Date()
        });
    yield new_user.save();
    res.send({
        id: new_user.id,
        waiting_time: new_user.waiting_time,
        location: new_user.location,
        created_at: new_user.created_at
    });
};

/**
 * update a given user
 * @param {*} req 
 * @param {*} res 
 */
exports.updateUser = function* (req, res) {
    let user = yield util.getUserIfExists(req.params.id);
    user.location = req.body.location || user.location;
    user.waiting_time = req.body.waiting_time || user.waiting_time;
    user.name = req.body.name || user.name;
    user.interests = req.body.interests || user.interests;
    yield user.save();
    res.send({
        id: user.id,
        name: user.name,
        interests: user.interests,
        waiting_time: user.waiting_time,
        location: user.location,
        created_at: user.created_at
    });
};
