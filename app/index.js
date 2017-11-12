const express = require('express');
const mongoose = require('mongoose');
const co = require('co');
const moment = require('moment');
const body_parser = require('body-parser');

const user_controller = require('./users');
const message_model = require('./models/message');
const message_controller = require('./messages');

// Set up default mongoose connection
let mongo_db = 'mongodb://waitlist:waitlist@ds257245.mlab.com:57245/waitlist';

let ws_connections = {};

mongoose.Promise = global.Promise;
mongoose.connect(mongo_db, {
    useMongoClient: true
});

//Get the default connection
let db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

let app = express();
const express_ws = require('express-ws')(app);

// this is required for websocket url params by expressWs
app.param('user_id', function (req, res, next, user_id) {
    req.user_id = user_id || 'user_id';
    return next();
});
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(body_parser.json()); // support json encoded bodies
app.use(body_parser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/users/:user_id/details', (req, res) => 
    co(user_controller.getUserDetails(req, res))
    .catch(err => handleError(req, res, err))
);

app.get('/users/:user_id', (req, res) =>
    co(user_controller.usersByUser(req, res))
    .catch(err => handleError(req, res, err))
);

app.post('/users', (req, res) =>
    co(user_controller.saveUser(req, res))
    .catch(err => handleError(req, res, err))
);

app.put('/users/:id', (req, res) =>
    co(user_controller.updateUser(req, res))
    .catch(err => handleError(req, res, err))
);

app.get('/messages', (req, res) =>
    co(message_controller.getMessagesBySenderAndReceiver(req, res))
    .catch(err => handleError(req, res, err))
);

app.ws('/messages/:user_id', (ws, req) =>
    co(message_controller.initWsConnection(ws, req))
    .catch(err => {console.info(err);})
);

app.listen(3001, () => console.log('Waitlist API listening on port 3001!'));

function handleError(req, res, err) {
    console.error(err.stack)
    res.status(err.code || 500).json({message: err.message});
}