
require('mocha');
require('co-mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinon_chai = require('sinon-chai');
chai.use(sinon_chai);
const mock_require = require('mock-require');
const test_helper = require('../../test_helper');

let users;

describe('User Controller', () => {

    before(function* () {
        mock_require('../../../app/user/user_repository', { 
            getUserForUsername: function* (user_id) {
                return {
                    id: user_id,
                    name: 'test_user'
                };
            }
        });
        users = mock_require.reRequire('../../../app/user/user_controller');
    });

    after(function* () {
        mock_require.stopAll();
    });

    describe('#getUserDetails', () => {        
        it('should send user json correctly', function* () {
            const req = {
                params: {
                  user_id: 'userId'
                },
                query: {

                }
            }
            const res = {
                json: sinon.spy()
            }
            try {
                yield users.getUserDetails(req, res);
            } catch(err) {
                test_helper.fail();
            }
            
            expect(res.json).to.be.calledWith({
                created_at: undefined,
                default_name: undefined,
                geolocation: { latitude: undefined, longitude: undefined },
                id: "userId",
                interaction_url: undefined,
                interests: undefined,
                location: undefined,
                name: "test_user",
                photo: undefined,
                signed_up: undefined,
                token: undefined,
                username: undefined,
                waiting_started_at: undefined,
                waiting_time: undefined
            });
        });
    });
});