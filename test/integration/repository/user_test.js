require('mocha');
require('co-mocha');
const expect = require('chai').expect;
const sinon = require('sinon');
const test_db = require('../../test_db');
const user_model = require('../../../app/models/geo_user');
const user_repository = require('../../../app/repository/user');
const db_util = require('../../../app/utils/db');

let mockgoose;

describe('User Repository Integration', () => {

    before(function* () {
        // --timeout 120000
        this.timeout(120000);
        mockgoose = yield test_db.start_db();
    });

    beforeEach(function* () {
        yield mockgoose.helper.reset();
    });

    describe('#createNewUser', () => {   

        it('should create user correctly', function* () {
            this.timeout(120000);
            const new_user = yield user_repository.createNewUser(
                'name', 54, 'ffewwe', db_util.constructPoint(11.1, 11));

            let created_user = yield user_repository.find({name: 'name'});
            expect(created_user[0].name).to.equal('name');
        });
    });
});