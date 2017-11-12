const express = require('express');
const mongoose = require('mongoose');
const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const co = require('co');
const moment = require('moment');
const bodyParser = require('body-parser');

//Set up default mongoose connection
let mongoDB = 'mongodb://waitlist:waitlist@ds257245.mlab.com:57245/waitlist';

let ws_connections = {};

mongoose.connect(mongoDB, {
  useMongoClient: true
});

//Get the default connection
let db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();
const expressWs = require('express-ws')(app);
app.param('user_id', function (req, res, next, user_id) {
  req.user_id = user_id || 'user_id';
  return next();
});
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/users/:user_id/details', (req, res) => co(function *() {
        const userId = req.params.user_id;
        const user = yield UserModel.findOne({_id: userId});
        res.json(user);
    })
    .catch(err => {
        console.info(err);
        res.send({error: err});
    })
);
       
app.get('/users/:user_id', (req, res) => co(function *() {
       let users = yield UserModel.find({});
       let messages = yield MessageModel.find({receiver_id: req.param.user_id});
       let message_counts =
       users = users.map((user) => {
                   return {
                       id: user._id,
                       name: user.name,
                       interests: user.interests,
                       location: user.location,
                       time_left: moment(user.created_at)
                                   .add(user.waiting_time, 'm')
                                   .diff(new Date(), 'minutes'),
                       count: messages.filter(
                                                message => message.sender_id == user._id &&
                                                message.receiver_id == req.param.user_id).length
                   }
              }).filter(user => user.time_left > 0);
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
       if (!location || !waiting_time) throw new Error("Can not save user");
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
        // console.log("user : ", user);
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

app.get('/messages', (req, res) => co(function *() {
       let messages = yield MessageModel.find(
            {
                sender_id: req.query.sender_id,
                receiver_id: req.query.receiver_id
            }
       );
       messages = messages.map((message) => {
                          return {
                              id: message._id,
                              sender_id: message.sender_id,
                              receiver_id: message.receiver_id,
                              created_at: message.created_at
                          }
                     });
       res.json(messages);
    })
    .catch(err => {
        console.info(err);
        res.send({error: err});
    })
);


app.ws('/messages/:user_id', function(ws, req) {
    console.log("user id ", req.user_id);
    ws_connections[req.user_id] = ws;
    ws.on('message', (msg) => co(function *() {
        msg = JSON.parse(msg);
        //let sender = yield UserModel.findOne({_id: msg.sender_id});
        //let receiver = yield UserModel.findOne({_id: msg.receiver_id});
        msg.created_at = new Date();
        console.log("Message received ", msg);
        if (msg.receiver_id in ws_connections) {
            ws_connections[msg.receiver_id].send(JSON.stringify({
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                created_at: msg.created_at
            }));
            msg.delivered = true;
        } else {
            msg.delivered = false;
        }
        let new_message = new MessageModel(msg);
        yield new_message.save();
    }).catch(err => {
            console.info(err);
    }))
});

app.listen(3001, () => console.log('Example app listening on port 3001!'));

function handleError(err) {
    console.log("Error happened", err);
    throw err;
}