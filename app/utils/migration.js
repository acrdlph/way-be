const co = require('co');
const role_repository = require('../user/role_repository');

exports.runMigrations = function runMigrations() {
    co(role_repository.migrate).catch(e => {
        throw new Error('Role migration failed')
    });
}