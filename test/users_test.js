
require('mocha');
require('co-mocha');
const expect = require('chai').expect;
const sinon = require('sinon');
const {mockReq, mockRes} = require('sinon-express-mock');
const mock_require = require('mock-require');
mock_require('../app/util', { 
    getUserForUsername: function* (user_id) {
        return {
            id: user_id,
            name: 'test_user'
        }
    }
});
let users = require('../app/users');

describe('Users Controller', () => {
    describe('#getUserDetails', () => {        
        it('should send user json correctly', function* () {
            const request = {
                params: {
                  user_id: 'userId'
                }
            }
            const req = mockReq(request)
            const res = mockRes()
            yield users.getUserDetails(req, res);
            expect(res.json).to.be.calledWith({
                id: user_id,
                name: 'test_user'
            });
        });
    });
});