const express = require('express');
const mongoose = require('mongoose');
const co = require('co');
const moment = require('moment');
const body_parser = require('body-parser');
const passport = require('passport');

const config = require('./config');
const logger = require('./logger');
const user_controller = require('./users');
const accounts_controller = require('./accounts');
const interactions_controller = require('./interactions');
const partner_controller = require('./partners');
const message_controller = require('./messages');
const uploader = require('./upload');

// Set up default mongoose connection
const mongo_db = `mongodb://${config.get('database.user')}:${config.get('database.password')}@${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`;
mongoose.Promise = global.Promise;
mongoose.connect(mongo_db, {
    useMongoClient: true
});

// web socket connections
const ws_connections = {};

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
    // logger.logRequest(req);
    next();
});
app.use(body_parser.json()); // support json encoded bodies
app.use(body_parser.urlencoded({ extended: true })); // support encoded bodies
app.use(passport.initialize());

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

app.post('/users/:user_id/photo', uploader.user_upload.single('photo'), (req, res) =>
    co(user_controller.updatePhoto(req, res))
    .catch(err => handleError(req, res, err))
);

app.get('/partners', (req, res) =>
    co(partner_controller.getAllPartners(req, res))
    .catch(err => handleError(req, res, err))
);

app.get('/partners/search', (req, res) =>
co(partner_controller.savePartnersForGeoQuery(req, res))
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

app.get('/accounts/checkname/:username', (req, res) =>
    co(accounts_controller.checkUsername(req, res))
    .catch(err => handleError(req, res, err))
);

app.post('/accounts', (req, res) =>
    co(accounts_controller.signUp(req, res))
    .catch(err => handleError(req, res, err))
);

app.post('/accounts/login', passport.authenticate('local'), (req, res) => {
    co(accounts_controller.login(req, res))
    .catch(err => handleError(req, res, err))
});

app.post('/accounts/logout', (req, res) =>
    co(accounts_controller.logout(req, res))
    .catch(err => handleError(req, res, err))
);

// this is initiated by the FE after the new user creates a profile through a link or 
// existing user scans a QR code through the app
app.post('/interactions/:username/:confirmation_code', (req, res) =>
    co(interactions_controller.verifyInteraction(req, res))
    .catch(err => handleError(req, res, err))
);

app.listen(3001, () => logger.info('Waitlist API listening on port 3001!'));

function handleError(req, res, err) {
    logger.error(err);
    res.status(err.code || 500).json({message: err.message});
}