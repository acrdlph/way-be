const moment = require('moment');
const mongoose = require('mongoose');
const _ = require('lodash');
const user_model = require('./models/user');
const message_model = require('./models/message');
const partner_model = require('./models/partner');
const util = require('./util');

const USER_DEFAULT_NAME = 'Still Anonymous';
const USER_NEAR_BY_DISTANCE = 5000; // 5km
const PARTNER_NEAR_BY_DISTANCE = 50000; // 50km

/**
 * get users from the perspective of a given user
 * @param {*} req 
 * @param {*} res 
 */
exports.usersByUser = function* (req, res) {
    let given_user = yield util.getUserIfExists(req.params.user_id);
    // we can not do $or here because mondb does not support $or for geo queries
    let same_location_users = yield user_model.find({
        location: given_user.location
    });
    let geo_near_users = yield user_model.find({ 
        geolocation: {
            $nearSphere: {
                $geometry: given_user.geolocation,
                $maxDistance: USER_NEAR_BY_DISTANCE
            }
        }
    });
    let users = _.uniqBy(_.flatten([same_location_users, geo_near_users]), user1 => user1.id);
    let messages = yield message_model.find({ receiver_id: given_user.id });
    users = users.map(user => {
        let filtered_messages = messages.filter(message => message.sender_id == user.id &&
                message.receiver_id == given_user.id);
        let non_delivered_messages = filtered_messages.filter(message => message.delivered === false);
        // sort so that we can get the last contact time
        filtered_messages.sort((message1, message2) => {
            let message1_time = message1.created_at.getTime();
            let message2_time = message2.created_at.getTime();
            if (message1_time > message2_time) {
                return -1;
            }
            if (message1_time < message2_time) {
                return 1;
            }
            return 0;
        });
        return {
            id: user.id,
            name: user.name,
            default_name: user.default_name,
            interests: user.interests,
            location: user.location,
            geolocation: {
                longitude: _.get(user, 'geolocation.coordinates.0'),
                latitude: _.get(user, 'geolocation.coordinates.1')
            },
            time_left: getMinTimeLeft(user, given_user),
            count: filtered_messages.length,
            non_delivered_count: non_delivered_messages.length,
            last_contact: filtered_messages.length > 0 ? filtered_messages[0].created_at : null
        }
    }).filter(user => (user.time_left > 0 || user.count > 0) && user.id != given_user.id);
    res.json(users);
};

/**
 * get the given users details
 * @param {*} req 
 * @param {*} res 
 */
exports.getUserDetails = function* (req, res) {
    let user = yield util.getUserIfExists(req.params.user_id);
    res.json(mapUserOutput(user));
}

/**
 * save a new user
 * @param {*} req 
 * @param {*} res 
 */
exports.saveUser = function* (req, res) {
    let location = req.body.location;
    let geolocation = req.body.geolocation;
    let name = req.body.name;
    let waiting_time = req.body.waiting_time;
    if ((!location && !geolocation) || !waiting_time) throw new Error("Can not save user");
    let longitude = _.get(geolocation, 'longitude');
    let latitude = _.get(geolocation, 'latitude');
    if (longitude && latitude) {
        geolocation = {
            type: 'Point',
            coordinates: [ parseFloat(longitude), parseFloat(latitude) ]
        };
        let partners_nearby = yield partner_model.find({
            geolocation: {
                $nearSphere: {
                    $geometry: geolocation,
                    $maxDistance: PARTNER_NEAR_BY_DISTANCE
                }
            }
        });
        if (partners_nearby.length) {
            location = partners_nearby[0].location;
        }
    } else {
        geolocation = null;
    }
    let new_user = new user_model(
        {
            name: name,
            default_name: USER_DEFAULT_NAME,
            waiting_time: waiting_time,
            location: location,
            geolocation: geolocation,
            created_at: new Date()
        });
    yield new_user.save();
    res.send(mapUserOutput(new_user));
};

/**
 * update a given user
 * @param {*} req 
 * @param {*} res 
 */
exports.updateUser = function* (req, res) {
    let user = yield util.getUserIfExists(req.params.id);
    user.location = req.body.location || user.location;
    user.geolocation = req.body.geolocation ? {
        type: 'Point',
        coordinates: [
            parseFloat(req.body.geolocation.longitude),
            parseFloat(req.body.geolocation.latitude)
        ]
    } : user.geolocation;
    user.waiting_time = req.body.waiting_time || user.waiting_time;
    user.name = req.body.name || user.name;
    user.interests = req.body.interests || user.interests;
    yield user.save();
    res.send(mapUserOutput(user));
};

function mapUserOutput(user) {
    return {
        id: user.id,
        name: user.name,
        default_name: user.default_name,
        interests: user.interests,
        waiting_time: user.waiting_time,
        location: user.location,
        geolocation: {
            longitude: _.get(user, 'geolocation.coordinates.0'),
            latitude: _.get(user, 'geolocation.coordinates.1')
        },
        created_at: user.created_at
    }
}

function getMinTimeLeft(user1, user2) {
    return Math.min(getTimeLeft(user1), getTimeLeft(user2));
}

function getTimeLeft(user) {
    return moment(user.created_at).add(user.waiting_time, 'm')
        .diff(new Date(), 'minutes');
}

