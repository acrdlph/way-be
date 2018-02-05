const mongoose = require('mongoose');
const _ = require('lodash');

const interaction_model = require('../interaction/interaction_model');
const user_repository = require('./user_repository');
const role_repository = require('./role_repository');
const user_matchers = require('./user_matchers');
const user_helper = require('./user_helper');
const message_repository = require('../message/message_repository');
const partner_repository = require('../partner/partner_repository');
const interaction_repository = require('../interaction/interaction_repository');
const error_util = require('../utils/error');
const auth_util = require('../utils/auth');
const datetime_util = require('../utils/datetime');
const db_util = require('../utils/db');
const mapper_util = require('../utils/mapper');
const constants = require('../utils/constants');
const config = require('../config');
const logger = require('../logger');

const S3_USER_PHOTO_URL = (user, filename) =>
`https://s3.${config.get('s3.users_bucket.region')}.amazonaws.com/${config.get('s3.users_bucket.name')}/${user.id}/${filename}`

/**
 * get users from the perspective of a given user
 * @param {*} req
 * @param {*} res
 */
exports.usersByUser = function* (req, res) {
    const given_user = yield user_repository.getUserIfExists(req.params.user_id);
    const messages = yield message_repository.findByReceiverOrSender(given_user.id);
    const matched_users = yield user_matchers.matchUsersToUser(given_user, { messages: messages });
    const users = matched_users
        .map(user => mapper_util.waitlistBuddy(given_user, user, messages))
        .filter(
            user => (
                user.time_left > 0 ||
                user.count > 0 ||
                user.god_user
            ) &&
            user.id != given_user.id);
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
      const partners_nearby = yield partner_repository.nearBy(user.geolocation);
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
        yield interaction_repository.save(interaction);
        user.interaction_url = config.get('server.domain_name') + '/#/confirm-interaction/' + interaction.confirmation_code;
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
        geolocation = db_util.constructPoint(parseFloat(longitude), parseFloat(latitude));
    } else {
        geolocation = null;
    }
    const new_user = yield user_repository.createNewUser(name, waiting_time, location, geolocation);
    const token = auth_util.jwtSign(new_user.id, config.get('server.private_key'), constants.TWENTY_FOUR_HOURS);
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

    user.geolocation = req.body.geolocation ?
        db_util.constructPoint(
            parseFloat(req.body.geolocation.longitude),
            parseFloat(req.body.geolocation.latitude))
            : user.geolocation;
    if (req.query.waiting_started === 'true') {
        user.waiting_started_at = datetime_util.serverCurrentDate();
    }
    user.waiting_time = req.body.waiting_time || user.waiting_time;
    user.name = req.body.name || user.name;
    user.interests = req.body.interests || user.interests;
    yield user.save();
    res.json(mapper_util.mapUserOutput(user));
};

exports.updateUserRole = function* (req, res) {
    if (user_helper.userAllowedRole(req.user, constants.USER_ROLES.SUPER_ADMIN)) {
        const new_role = yield role_repository.findByName(req.params.role_name);
        const user = yield user_repository.getUserIfExists(req.params.id);
        const is_add = req.query.is_add || false;
        if (is_add) {
            user.roles.push(new_role._id);
        } else {
            user.roles = [new_role._id];
        }
        yield user_repository.save(user);
        logger.warn("Role change for user ", user);
        res.json({});
    }
    throw error_util.createError(400);
}

exports.updatePhoto = function* (req, res) {
    const user = yield user_repository.getUserIfExists(req.params.user_id);
    user.photo = S3_USER_PHOTO_URL(user, req.file.standard_name);
    yield user.save();
    res.json(mapper_util.mapUserOutput(user));
};
