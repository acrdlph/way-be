const constants = require('../utils/constants');
const datetime_util = require('../utils/datetime');
const role_model = require('../models/role');
const user_repository = require('./user');

/**
 * Temp function to migrate the db when first launching roles
 * TODO remove later
 */
exports.migrate = function* migrate() {
    const result = yield role_model.find({});
    if (!result.length) {
        const roles = yield Object.keys(constants.USER_ROLES).map((key) => {
            const role = constants.USER_ROLES[key];
            role_obj = new role_model(role);
            role_obj.created_at = datetime_util.serverCurrentDate();
            return role_obj.save();
        });
        const user_role = roles[5];
        const anon_user_role = roles[6];
        const all_users = yield user_repository.find({});
        yield all_users.map(user => {
            if (user.username) {
                user.roles = [user_role._id];
            } else {
                user.roles = [anon_user_role._id];
            }
            return user.save();
        });
    }
}

exports.save = function* save(feedback) {
    const result = yield feedback.save();
    return result;
}