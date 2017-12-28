const user_repository = require('./user_repository');
const user_helper = require('./user_helper');
const constants = require('../utils/constants');

function* geoMatcher(user, options) {
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
function* godMatcher(user, options) {
    const users = yield user_repository.findByRole(constants.USER_ROLES.GOD_USER);
    return users
        .map(mapGodUser);
}

/**
 * can be made more efficient by querying for role and location in the db it self using one query
 * @param {*} user 
 * @param {*} options 
 */
function* locationGodMatcher(user, options) {
    const geo_near_users = yield geoMatcher(user, options);
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
    geoMatcher, 
    godMatcher,
    locationGodMatcher
]