const moment = require('moment');
const mongoose = require('mongoose');
const _ = require('lodash');

const geo_user_model = require('./models/geo_user');
const interaction_model = require('./models/interaction');
const user_repository = require('./repository/user');
const message_repository = require('./repository/message');
const partner_repository = require('./repository/partner');
const interaction_repository = require('./repository/interaction');
const error_util = require('./utils/error');
const auth_util = require('./utils/auth');
const datetime_util = require('./utils/datetime');
const mapper_util = require('./utils/mapper');
const constants = require('./utils/constants');
const config = require('./config');

const S3_USER_PHOTO_URL = (user, filename) =>
`https://s3.${config.get('s3.users_bucket.region')}.amazonaws.com/${config.get('s3.users_bucket.name')}/${user.id}/${filename}`

/**
 * get users from the perspective of a given user
 * @param {*} req
 * @param {*} res
 */
exports.usersByUser = function* (req, res) {
    const given_user = yield user_repository.getUserIfExists(req.params.user_id);
    let geo_near_users = [];
    if (given_user.geolocation) {
        geo_near_users = yield geo_user_model.find()
            .where('geolocation').near({
                center: given_user.geolocation,
                maxDistance: constants.USER_NEAR_BY_DISTANCE
            })
            .exec();
    }
    const messages = yield message_repository.find({ receiver_id: given_user.id });
    const users = geo_near_users.map(user => {
        const filtered_messages = messages.filter(message => message.sender_id == user.id &&
                message.receiver_id == given_user.id);
        const non_delivered_messages = filtered_messages.filter(message => message.delivered === false);
        // sort so that we can get the last contact time
        filtered_messages.sort((message1, message2) => {
            const message1_time = message1.created_at.getTime();
            const message2_time = message2.created_at.getTime();
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
            photo: user.photo,
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
    let user = yield user_repository.getUserForUsername(req.params.user_id);
    if (!user) {
        user = yield user_repository.getUserIfExists(req.params.user_id);
    }
    if(user.geolocation) {
      const partners_nearby = yield partner_repository.find({
          geolocation: {
              $nearSphere: {
                  $geometry: user.geolocation,
                  $maxDistance: constants.PARTNER_NEAR_BY_DISTANCE
              }
          }
      });
      if (partners_nearby.length) {
          user.location = partners_nearby[0].location;
      }
    }

    if (req.query.generate_url) {
        const interaction_date = datetime_util.serverCurrentDate();
        const interaction = new interaction_model({
            initiator: user.username, // username
            initiator_id: user.id,
            confirmation_code: interaction_date.getTime(), // timestamp
            geolocation: user.geolocation,
            created_at: interaction_date
        });
        interaction_repository.save(interaction);
        user.interaction_url = config.get('server.domain_name') + '/' + interaction.initiator + '/' +
            interaction.confirmation_code
    }
    res.json(mapper_util.mapUserOutput(user));
}

/**
 * save a new user
 * @param {*} req
 * @param {*} res
 */
exports.saveUser = function* (req, res) {
    let location = req.body.location;
    let geolocation = req.body.geolocation;
    const name = req.body.name;
    const waiting_time = req.body.waiting_time || 30; // default 30 mins
    if (!location && !geolocation) throw error_util.createError(400, "Please provide a location");
    const longitude = _.get(geolocation, 'longitude');
    const latitude = _.get(geolocation, 'latitude');
    if (longitude && latitude) {
        geolocation = {
            type: 'Point',
            coordinates: [ parseFloat(longitude), parseFloat(latitude) ]
        };
    } else {
        geolocation = null;
    }
    const new_user = yield user_repository.createNewUser(name, waiting_time, location, geolocation);
    const token = auth_util.jwtSign(new_user.id, constants.TWENTY_FOUR_HOURS);
    res.json(mapper_util.mapUserOutput(new_user, token));
};

/**
 * update a given user
 * @param {*} req
 * @param {*} res
 */
exports.updateUser = function* (req, res) {
    const user = yield user_repository.getUserIfExists(req.params.id);
    user.location = req.body.location || user.location;
    user.geolocation = req.body.geolocation ? {
        type: 'Point',
        coordinates: [
            parseFloat(req.body.geolocation.longitude),
            parseFloat(req.body.geolocation.latitude)
        ]
    } : user.geolocation;
    if (req.query.waiting_started === 'true') {
        user.waiting_started_at = datetime_util.serverCurrentDate();
    }
    user.waiting_time = req.body.waiting_time || user.waiting_time;
    user.name = req.body.name || user.name;
    user.interests = req.body.interests || user.interests;
    yield user.save();
    res.json(mapper_util.mapUserOutput(user));
};

exports.updatePhoto = function* (req, res) {
    const user = yield user_repository.getUserIfExists(req.params.user_id);
    user.photo = S3_USER_PHOTO_URL(user, req.file.standard_name);
    yield user.save();
    res.json(mapper_util.mapUserOutput(user));
};

function getMinTimeLeft(user1, user2) {
    return Math.min(getTimeLeft(user1), getTimeLeft(user2));
}

function getTimeLeft(user) {
    // for backward compatibility set waiting_started_at=created_at if waiting_started_at 
    // is not available 
    const waiting_started_at = user.waiting_started_at || user.created_at;
    return moment(waiting_started_at).add(user.waiting_time, 'm')
        .diff(datetime_util.serverCurrentDate(), 'minutes');
}
