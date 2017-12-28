require('mocha');
require('co-mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinon_chai = require('sinon-chai');
chai.use(sinon_chai);

const constants = require('../../../app/utils/constants');
let user_helper = require('../../../app/user/user_helper');

describe('User Helper', () => {
    describe('#userInRole', () => {        
        it('should return true if one of the users roles matches given role exactly', function* () {
            let result = user_helper.userInRole({
                roles: [
                        constants.USER_ROLES.LOCATION_GOD_USER,
                        constants.USER_ROLES.ADMIN
                ]
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(true);
        });

        it('should return false if one of the users roles does not match given role exactly', function* () {
            let result = user_helper.userInRole({
                roles: [
                        constants.USER_ROLES.FOUNDER,
                        constants.USER_ROLES.ADMIN
                ]
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(false);
        });

        it('should return false if user does not have any roles defined', function* () {
            let result = user_helper.userInRole({
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(false);
        });
    });

    describe('#userAllowedRole', () => {        
        it('should return true if one of the users roles matches given role exactly', function* () {
            let result = user_helper.userAllowedRole({
                roles: [
                        constants.USER_ROLES.LOCATION_GOD_USER,
                        constants.USER_ROLES.ADMIN
                ]
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(true);
        });

        it('should return true if one of the users roles has a rank higher than given role', function* () {
            let result = user_helper.userAllowedRole({
                roles: [
                        constants.USER_ROLES.ADMIN,
                        constants.USER_ROLES.ANON_USER
                ]
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(true);
        });

        it('should return false if none of the users roles has a higher rank than given role', function* () {
            let result = user_helper.userInRole({
                roles: [
                        constants.USER_ROLES.ANON_USER,
                        constants.USER_ROLES.USER
                ]
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(false);
        });

        it('should return false if user does not have any roles defined', function* () {
            let result = user_helper.userInRole({
            }, constants.USER_ROLES.LOCATION_GOD_USER)
            expect(result).to.equal(false);
        });
    });
});