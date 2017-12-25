
require('mocha');
require('co-mocha');
const expect = require('chai').expect;
const sinon = require('sinon');

const test_helper = require('../../test_helper');

let auth_util = require('../../../app/utils/auth');
let constants = require('../../../app/utils/constants');

const TEST_PRIVATE_KEY = 'vimukthi';
const TEST_USER_ID = '12345';
const TEST_PASSWORD = 'password';

describe('Authentication Util', () => {
    describe('#jwtSign and #verifyJwt', () => {        
        it('should sign provided user id with the provided private key', function* () {
            const token = auth_util.jwtSign(TEST_USER_ID, TEST_PRIVATE_KEY, 5);
            expect(token).to.not.equal(TEST_USER_ID);
            expect(token).to.not.equal(TEST_PRIVATE_KEY);
            const decoded = yield test_helper.tryWithSuccess(auth_util.verifyJwt(token, TEST_PRIVATE_KEY));
            expect(decoded.id).to.equal(TEST_USER_ID);
        });

        it('should fail verification when provided with wrong token', function* () {
            const token = auth_util.jwtSign(TEST_USER_ID, TEST_PRIVATE_KEY, 5);
            yield test_helper.tryWithFailure(auth_util.verifyJwt("sometoken", TEST_PRIVATE_KEY), 'JsonWebTokenError');
        });

        it('should fail verification when provided with wrong private key', function* () {
            const token = auth_util.jwtSign(TEST_USER_ID, TEST_PRIVATE_KEY, 5);
            yield test_helper.tryWithFailure(auth_util.verifyJwt(token, 'somekey'), 'JsonWebTokenError');
        });

        it('should create a token that expires correctly', function* () {
            const token = auth_util.jwtSign(TEST_USER_ID, TEST_PRIVATE_KEY, 1); // expire in 1 second
            const decoded = yield test_helper.tryWithSuccess(auth_util.verifyJwt(token, TEST_PRIVATE_KEY));
            expect(decoded.id).to.equal(TEST_USER_ID);
            yield test_helper.delay(1000); // wait for expire
            yield test_helper.tryWithFailure(auth_util.verifyJwt(token, TEST_PRIVATE_KEY), "TokenExpiredError");
        });
    });

    describe('#getPasswordHash and #verifyPassword', () => {  

        it('should generate a unpredictable but verifyable password hash', function* () {
            this.timeout(10000); 
            const hash = yield auth_util.getPasswordHash(TEST_PASSWORD, constants.PASSWORD_SALT_ROUNDS);
            expect(hash).to.not.equal(TEST_PASSWORD);
            const verified = yield test_helper.tryWithSuccess(auth_util.verifyPassword(TEST_PASSWORD, hash));
            expect(verified).to.equal(true);
        });

        it('should fail when provided with incorrect password', function* () {
            this.timeout(10000); 
            const hash = yield auth_util.getPasswordHash(TEST_PASSWORD, constants.PASSWORD_SALT_ROUNDS);
            expect(hash).to.not.equal(TEST_PASSWORD);
            let verified = yield test_helper.tryWithSuccess(auth_util.verifyPassword(TEST_PASSWORD, hash));
            expect(verified).to.equal(true);
            verified = yield test_helper.tryWithSuccess(auth_util.verifyPassword('randompassword', hash));
            expect(verified).to.equal(false);
        });

        it('should fail when provided with incorrect hash', function* () {
            this.timeout(10000); 
            const hash = yield auth_util.getPasswordHash(TEST_PASSWORD, constants.PASSWORD_SALT_ROUNDS);
            expect(hash).to.not.equal(TEST_PASSWORD);
            let verified = yield test_helper.tryWithSuccess(auth_util.verifyPassword(TEST_PASSWORD, hash));
            expect(verified).to.equal(true);
            verified = yield test_helper.tryWithSuccess(auth_util.verifyPassword(TEST_PASSWORD, 'somehash'));
            expect(verified).to.equal(false);
        });
    });
});