const express = require('express');
const mongoose = require('mongoose');
const co = require('co');
const body_parser = require('body-parser');
const passport = require('passport');

const config = require('./config');
const logger = require('./logger');
const controller = require('./utils/controller');
const user_controller = require('./users');
const accounts_controller = require('./accounts');
const interactions_controller = require('./interactions');
const partner_controller = require('./partners');
const message_controller = require('./messages');
const feedback_controller = require('./feedback');
const uploader = require('./upload');

// Set up default mongoose connection
const mongo_user_string = config.get('database.user') ? `${config.get('database.user')}:${config.get('database.password')}@` : '';
const mongo_db = `mongodb://${mongo_user_string}${config.get('database.host')}:${config.get('database.port')}/${config.get('database.name')}`;
mongoose.Promise = global.Promise;
mongoose.connect(mongo_db, {
    useMongoClient: true
});

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

app.use((req, res, next) => {
    // specifying Access-Control-Allow-Origin=* this way since
    // socket.io sends credentials=init
    res.header("Access-Control-Allow-Origin", req.header('origin') 
    || req.header('x-forwarded-host') || req.header('referer') || req.header('host'));
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // logger.logRequest(req);
    next();
});
app.use(body_parser.json()); // support json encoded bodies
app.use(body_parser.urlencoded({ extended: true })); // support encoded bodies
app.use(passport.initialize());

app.get('/', (req, res) => res.send('Hello World!'));

app.get('/users/:user_id/details', accounts_controller.verifyAuthenticationMiddleWare, (req, res) => 
    controller.mainControlller(user_controller.getUserDetails, req, res)
);

app.get('/users/:user_id', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
    controller.mainControlller(user_controller.usersByUser, req, res)
);

app.post('/users', (req, res) =>
    controller.mainControlller(user_controller.saveUser, req, res)
);

app.put('/users/:id', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
    controller.mainControlller(user_controller.updateUser, req, res)
);

app.post('/users/:user_id/photo', 
    accounts_controller.verifyAuthenticationMiddleWare, 
    uploader.user_upload.single('photo'), 
    (req, res) =>
        controller.mainControlller(user_controller.updatePhoto, req, res)
);

app.get('/partners', (req, res) =>
    controller.mainControlller(partner_controller.getAllPartners, req, res)
);

app.get('/partners/search', (req, res) =>
    controller.mainControlller(partner_controller.savePartnersForGeoQuery, req, res)
);

app.post('/partners', (req, res) =>
    controller.mainControlller(partner_controller.savePartner, req, res)
);

app.get('/messages', accounts_controller.verifyAuthenticationMiddleWare, (req, res) =>
    controller.mainControlller(message_controller.getMessagesBySenderAndReceiver, req, res)
);

app.get('/accounts/checkname/:username', (req, res) =>
    controller.mainControlller(accounts_controller.checkUsername, req, res)
);

app.post('/accounts', (req, res) =>
    controller.mainControlller(accounts_controller.signUp, req, res)
);

app.post('/accounts/login', passport.authenticate('local'), (req, res) => 
    controller.mainControlller(accounts_controller.login, req, res)
);

app.post('/accounts/logout', (req, res) =>
    controller.mainControlller(accounts_controller.logout, req, res)
);

app.post('/feedback', (req, res) =>
    controller.mainControlller(feedback_controller.save, req, res)
);

// this is initiated by the FE after the new user creates a profile through a link or
// existing user scans a QR code through the app
app.post('/interactions/:username/:confirmation_code', (req, res) =>
    controller.mainControlller(interactions_controller.verifyInteraction, req, res)
);

const server = app.listen(3001, () => logger.info('Waitlist API listening on port 3001!'));
const socketio_options = {
    pingTimeout: 3000,
    pingInterval: 3000
};
const io = require('socket.io')(server, socketio_options)
    .of('/messaging')
    .on('connection', (socket) => 
        co(message_controller.initSocketConnection(socket))
        .catch(err => logger.error(err))
    );
