
require('mocha');
require('co-mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinon_chai = require('sinon-chai');
chai.use(sinon_chai);
const mock_require = require('mock-require');

let constants;
let db_util;
let user_matchers;

describe('Users Matcher', () => {

    before(function* () {
        mock_require('../../../app/user/user_repository', { 
            findByRole: function* (role) {
                return [
                    {
                        id: 'user_id',
                        name: 'test_user',
                        roles: [
                            role
                        ]
                    }
                ];
            },
            nearByUsers: function* (geolocation) {
                return getLocationUsers(geolocation);
            }
        });
        constants = require('../../../app/utils/constants');
        db_util = require('../../../app/utils/db');
        user_matchers = mock_require.reRequire('../../../app/user/user_matchers');
    });

    after(function* () {
        mock_require.stopAll();
    });

    describe('#geoMatcher', () => {        
        it('should match location users correctly', function* () {
            const geolocation = db_util.constructPoint(1, 1)
            const result = yield user_matchers.geoMatcher({
                geolocation: geolocation
            }, {});
            expect(result).to.deep.equal(getLocationUsers(geolocation));
        });
        it('should return empty array if no geolocation is undefined', function* () {
            const result = yield user_matchers.geoMatcher({
            }, {});
            expect(result).to.deep.equal([]);
        });
    });

    describe('#godMatcher', () => {        
        it('should match god users correctly', function* () {
            const result = yield user_matchers.godMatcher({}, {});
            expect(result).to.deep.equal([
                {
                    id: 'user_id',
                    name: 'test_user',
                    roles: [
                        constants.USER_ROLES.GOD_USER
                    ],
                    god_user: true
                }
            ]);
        });
    });

    describe('#locationGodMatcher', () => {        
        it('should match location god users correctly', function* () {
            const geolocation = db_util.constructPoint(1, 1)
            const result = yield user_matchers.locationGodMatcher({
                geolocation: geolocation
            }, {});
            expect(result).to.deep.equal([
                {
                    id: 'user_id1',
                    name: 'test_user1',
                    geolocation: geolocation,
                    roles: [
                        constants.USER_ROLES.LOCATION_GOD_USER
                    ],
                    god_user: true
                }
            ]);
        });
    });
});

// TODO refactor these into test utils
function getLocationUsers(geolocation) {
    return [
        {
            id: 'user_id',
            name: 'test_user',
            geolocation: geolocation,
            roles: [
                constants.USER_ROLES.ANON_USER
            ]
        },
        {
            id: 'user_id1',
            name: 'test_user1',
            geolocation: geolocation,
            roles: [
                constants.USER_ROLES.LOCATION_GOD_USER
            ]
        },
        {
            id: 'user_id2',
            name: 'test_user2',
            geolocation: geolocation,
            roles: [
                constants.USER_ROLES.GOD_USER,
                constants.USER_ROLES.SUPER_ADMIN
            ]
        },
        {
            id: 'user_id3',
            name: 'test_user3',
            geolocation: geolocation,
            roles: []
        }
    ];
}