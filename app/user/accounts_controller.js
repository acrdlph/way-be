const co = require('co');
const validator = require('validator');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const config = require('../config');
const logger = require('../logger');
const user_repository = require('./user_repository');
const role_repository = require('./role_repository');
const error_util = require('../utils/error');
const auth_util = require('../utils/auth');
const datetime_util = require('../utils/datetime');
const mapper_util = require('../utils/mapper');
const constants = require('../utils/constants');

/**
 * passport with our own db
 */
passport.use(new LocalStrategy({
    usernameField: 'loginname',
    passwordField: 'password',
    session: false
}, (loginname, password, done) => {
    co(passportLoginCallBack(loginname, password, done))
        .catch(err => {
            done(err);
        });
}));

// TODO redo these
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, id);
});

exports.checkUsername = function*(req, res) {
    const username = req.params.username;
    const user = yield user_repository.getUserForUsername(username);
    if (user) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
}

exports.signUp = function*(req, res) {
    const user_id = req.body.user_id || "";
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username || !validator.isEmail(email) || !password) {
        throw error_util.createError(400, "Username, Email(check format) and Password are required");
    }
    const existing_username = yield user_repository.getUserForUsername(username);
    const existing_id_username = yield user_repository.getUserForUsername(user_id);
    const existing_email = yield user_repository.getUserForEmail(email);
    if (existing_username || existing_id_username || existing_email) {
        throw error_util.createError(400, "Username or email already exists");
    }
    const password_hash = yield auth_util.getPasswordHash(password, constants.PASSWORD_SALT_ROUNDS);
    let user = false;
    if (user_id) {
        user = yield user_repository.getUserIfExists(user_id);
    }

    if (user) {
        const user_role = yield role_repository.findByName(constants.USER_ROLES.USER.name);
        const signed_up = datetime_util.serverCurrentDate();
        user.username = username;
        user.email = email;
        user.password = password_hash;
        user.sign_up = signed_up;
        user.roles = [user_role._id];
        yield user_repository.save(user);
    } else {
        user = yield user_repository.createNewRegisteredUser(username, email, password_hash);
    }
    const token = auth_util.jwtSign(user.id, config.get('server.private_key'), constants.TWENTY_FOUR_HOURS);
    res.json(mapper_util.mapUserOutput(user, token));
}

exports.login = function*(req, res) {
    if (req.user) {
        const token = auth_util.jwtSign(req.user.id, config.get('server.private_key'), constants.TWENTY_FOUR_HOURS);
        const user_output = mapper_util.mapUserOutput(req.user, token);
        res.json({
            ...user_output,
            auth: true
        });
    } else {
        throw new Error("Something is wrong");
    }
}

exports.logout = function*(req, res) {
    res.json({
        auth: false,
        token: null
    });
}

function* passportLoginCallBack(loginname, password, done) {
    const users = yield user_repository.find({
        $or: [{
                username: loginname
            },
            {
                email: loginname
            }
        ]
    });
    if (users.length == 1) {
        const user = users[0];
        const verified = yield auth_util.verifyPassword(password, user.password);
        if (verified) {
            done(null, user);
        } else {
            done(null, false, { message: 'Incorrect username or password.' });
        }
    } else {
        done(null, false, { message: 'Incorrect username or password.' });
    }
}

/**
 * Verifies authentication based on JWT token
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.verifyAuthenticationMiddleWare = (req, res, next) =>
    co(verifyAuthentication(req, res, next))
    .catch(err => error_util.handleError(req, res, err, { auth: false }));

function* verifyAuthentication(req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) {
        throw error_util.createError(401, 'No token provided');
    }
    try {
        const decoded_user = yield auth_util.verifyJwt(token, config.get('server.private_key'));
        req.user = yield user_repository.getUserIfExists(decoded_user.id);
        next();
    } catch (err) {
        logger.debug(err);
        throw error_util.createError(401, "Failed to authenticate token");
    }
}