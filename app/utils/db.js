const mongoose = require('mongoose');

exports.init_mongoose = (mongo_db_url) => {
    mongoose.Promise = global.Promise;
    mongoose.connect(mongo_db_url, {
        useMongoClient: true
    });

    //Get the default connection
    const db = mongoose.connection;

    //Bind connection to error event (to get notification of connection errors)
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
}

exports.constructPoint = function constructPoint(longitude, latitude) {
    return {
        type: 'Point',
        coordinates: [ longitude, latitude ]
    };
}