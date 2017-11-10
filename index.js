const express = require('express');
const mongoose = require('mongoose');
const UserModel = require('./models/user');
const MessageModel = require('./models/message');


//Set up default mongoose connection
let mongoDB = 'mongodb://waitlist:waitlist@ds257245.mlab.com:57245/waitlist';

mongoose.connect(mongoDB, {
  useMongoClient: true
});

//Get the default connection
let db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/users', (req, res) => {
    UserModel.find({}, function (err, users) {
        if (err) {
            handleError(err);
        }
        return res.json(users);
    });
});

app.post('/users/create', (req, res) => {
// TODO special endpoint to create users
//    let awesome_instance = new UserModel({ name: 'awesome' });
//
//    // Save the new model instance, passing a callback
//    awesome_instance.save(function (err) {
//      if (err) return handleError(err);
//      // saved!
//    });
});

app.listen(3001, () => console.log('Example app listening on port 3001!'));

function handleError(err) {
    console.log("Error happened", err);
    throw err;
}