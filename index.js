const express = require('express');
const mongoose = require('mongoose');
const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const co = require('co');
const moment = require('moment');
const bodyParser = require('body-parser');

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
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/users', (req, res) => co(function *() {
       let users = yield UserModel.find({});
       users = users.map((user) => {
                   return {
                       id: user._id,
                       name: user.name,
                       interests: user.interests,
                       location: user.location,
                       time_left: moment(user.created_at)
                                   .add(user.waiting_time, 'm')
                                   .diff(new Date(), 'minutes')
                   }
              });
       res.json(users);
    })
    .catch(err => {
        console.info(err);
        res.send({error: err});
    })
);

app.post('/users/new', (req, res) => co(function *() {
       let location = req.body.location;
       let waiting_time = req.body.waiting_time;
       let new_user = new UserModel(
           {
                waiting_time: waiting_time,
                location: location,
                created_at: new Date()
           });
       yield new_user.save();
       res.send({
            id: new_user.id,
            waiting_time: new_user.waiting_time,
            location: new_user.location,
            created_at: new_user.created_at
       });
    })
    .catch(err => {
        console.info(err);
        res.send({error: err});
    })
);

app.post('/users/update', (req, res) => co(function *() {
       let location = req.body.location;
       res.send(location);
    })
    .catch(err => {
        console.info(err);
        res.send({error: err});
    })
);

app.get('/users/create', (req, res) => {
// TODO special endpoint to create users
    let awesome_instance = new UserModel(
    { name: 'awesome',
    interests: 'nothing',
    waiting_time: 60,
    location: "Amsterdam",
      created_at: new Date()});

    // Save the new model instance, passing a callback
    awesome_instance.save(function (err) {
      if (err) return handleError(err);
      // saved!
    });
});

app.listen(3001, () => console.log('Example app listening on port 3001!'));

function handleError(err) {
    console.log("Error happened", err);
    throw err;
}