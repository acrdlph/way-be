const co = require('co');
const role_repository = require('../repository/role');

exports.runMigrations = function runMigrations() {
    co(role_repository.migrate).catch(e => {
        throw new Error('Role migration failed')
    });
}