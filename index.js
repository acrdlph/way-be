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

app.post('/users', (req, res) => co(function *() {
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

app.put('/users/:id', (req, res) => co(function *() {
        let id = req.params.id;
        let user = yield UserModel.findOne({_id: id});
        console.log("user : ", user);
        if (user) {
            user.location = req.body.location || user.location;
            user.waiting_time = req.body.waiting_time || user.waiting_time;
            user.name = req.body.name || user.name;
            user.interests = req.body.interests || user.interests;
            yield user.save();
            res.send({
               id: user.id,
               name: user.name,
               interests: user.interests,
               waiting_time: user.waiting_time,
               location: user.location,
               created_at: user.created_at
            });
        } else {
            res.status(404);
            res.json({});
        }
    })
    .catch(err => {
        console.info(err);
        res.send({error: err});
    })
);

app.listen(3001, () => console.log('Example app listening on port 3001!'));

function handleError(err) {
    console.log("Error happened", err);
    throw err;
}