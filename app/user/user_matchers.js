const _ = require('lodash');

const user_repository = require('./user_repository');
const user_helper = require('./user_helper');
const constants = require('../utils/constants');

exports.geoMatcher = function* geoMatcher(user, options) {
    let geo_near_users = [];
    if (user.geolocation) {
        geo_near_users = yield user_repository.nearByUsers(user.geolocation);
    }
    return geo_near_users;
}

/**
 * can be cached
 * @param {*} user 
 * @param {*} options 
 */
exports.godMatcher = function* godMatcher(user, options) {
    const users = yield user_repository.findByRole(constants.USER_ROLES.GOD_USER);
    return users
        .map(mapGodUser);
}

/**
 * can be made more efficient by querying for role and location in the db it self using one query
 * @param {*} user 
 * @param {*} options 
 */
exports.locationGodMatcher = function* locationGodMatcher(user, options) {
    const geo_near_users = yield exports.geoMatcher(user, options);
    return geo_near_users
        .filter(geo_user => {
            return user_helper.userInRole(geo_user, constants.USER_ROLES.LOCATION_GOD_USER);
        })
        .map(mapGodUser);
}

function mapGodUser(god_user) {
    god_user.god_user = true;
    return god_user;
}

exports.matchers = [
    exports.geoMatcher, 
    exports.godMatcher,
    exports.locationGodMatcher
]

exports.matchUsersToUser = function* matchUsersToUser(given_user) {
    // concurrently retrieve matching waitlist users for the given user
    const matched_user_arrays = yield exports
                                        .matchers
                                        .map(matcher => matcher(given_user, {}));
    return _(matched_user_arrays)
                .flatMap()
                .uniqBy('_id')
                .value();
}