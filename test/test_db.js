const mongoose = require('mongoose');
const Mockgoose = require('mockgoose-fix').Mockgoose; // TODO change this later to just mockgoose
const mockgoose = new Mockgoose(mongoose);

mongoose.Promise = global.Promise;

exports.start_db = function* start_db() {
    yield mockgoose.prepareStorage();
    yield mongoose.connect('mongodb://example.com/TestingDB', {
        useMongoClient: true
    });
    return mockgoose;
}