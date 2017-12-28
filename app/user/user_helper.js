const _ = require('lodash');

exports.userInRole = function userInRole(user, role) {
    const user_role_names = user.roles.map((user_role) => {
        return user_role.name;
    });
    return _.includes(user_role_names, role.name);
}

exports.userAllowedRole = function userAllowedRole(user, role) {
    const user_roles = user.roles.filter((user_role) => {
        return user_role.rank <= role.rank;
    });
    return user_roles.length > 0;
}