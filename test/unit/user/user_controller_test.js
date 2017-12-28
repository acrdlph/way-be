
require('mocha');
require('co-mocha');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinon_chai = require('sinon-chai');
chai.use(sinon_chai);
const mock_require = require('mock-require');
mock_require('../../../app/user/user_repository', { 
    getUserForUsername: function* (user_id) {
        return {
            id: user_id,
            name: 'test_user'
        }
    }
});
let users = require('../../../app/user/user_controller');

describe('Users Controller', () => {
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
            yield users.getUserDetails(req, res);
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