const express = require('express');
const mongoose = require('mongoose');
const co = require('co');
const moment = require('moment');
const body_parser = require('body-parser');

const config = require('./config');
const logger = require('./logger');
const user_controller = require('./users');
const partner_controller = require('./partners');
const message_controller = require('./messages');

// Set up default mongoose connection
const mongo_db = `mongodb://${config.get('database.user')}:${config.get('database.password')}@${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`;

const ws_connections = {};

mongoose.Promise = global.Promise;
mongoose.connect(mongo_db, {
    useMongoClient: true
});

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();
const express_ws = require('express-ws')(app);

// this is required for websocket url params by expressWs
app.param('user_id', function (req, res, next, user_id) {
    req.user_id = user_id || 'user_id';
    return next();
});
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.logRequest(req);
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

app.get('/partners', (req, res) =>
    co(partner_controller.getAllPartners(req, res))
    .catch(err => handleError(req, res, err))
);

app.get('/partners/search', (req, res) =>
co(partner_controller.searchPartners(req, res))
.catch(err => handleError(req, res, err))
);

app.post('/partners', (req, res) =>
    co(partner_controller.savePartner(req, res))
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

app.listen(3001, () => logger.info('Waitlist API listening on port 3001!'));

function handleError(req, res, err) {
    logger.error(err.stack);
    res.status(err.code || 500).json({message: err.message});
}