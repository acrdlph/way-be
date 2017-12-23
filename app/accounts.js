const co = require('co');
const bcrypt = require('bcrypt');
const validator = require('validator');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const geo_user_model = require('./models/geo_user');
const util = require('./util');
const logger = require('./logger');

const PASSWORD_SALT_ROUNDS = 10;

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

exports.checkUsername = function* (req, res) {
    const username = req.params.username;
    const user = yield util.getUserForUsername(username);
    if (user) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
}

exports.signUp = function* (req, res) {
    const user_id = req.body.user_id || "";
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username || !validator.isEmail(email) || !password) {
        throw util.createError(400, "Username, Email(check format) and Password are required");
    }
    const existing_username = yield util.getUserForUsername(username);
    const existing_id_username = yield util.getUserForUsername(user_id);
    const existing_email = yield util.getUserForEmail(email);
    if (existing_username || existing_id_username || existing_email) {
        throw util.createError(400, "Username or email already exists");
    }
    const password_hash = yield getPasswordHash(password);
    let user = false;
    if (user_id) {
        user = yield util.getUserIfExists(user_id);
    }
    
    if (user) {
        const signed_up = util.serverCurrentDate();
        user.username = username;
        user.email = email;
        user.password = password_hash;
        user.sign_up = signed_up;
        yield user.save();
    } else {
        user = yield util.createNewRegisteredUser(username, email, password_hash);
    }
    const token = util.jwtSign(user.id);
    res.json(util.mapUserOutput(user, token));
}

exports.login = function* (req, res) {
    if (req.user) {
        const token = util.jwtSign(req.user.id);
        const user_output = util.mapUserOutput(req.user, token);
        res.json({ 
            ...user_output,
            auth: true
        });
    } else {
        throw new Error("Something is wrong");
    }
}

exports.logout = function* (req, res) {
    res.json({ 
        auth: false, 
        token: null 
    });
}

function* passportLoginCallBack(loginname, password, done) {
    const users = yield geo_user_model.find({
        $or: [
            {
                username: loginname
            },
            {
                email: loginname
            }
        ]
    });
    if (users.length == 1) {
        const user = users[0];
        const verified = yield verifyPassword(password, user.password);
        if (verified) {
            done(null, user);
        } else {
            done(null, false, { message: 'Incorrect username or password.' });
        }
    } else {
        done(null, false, { message: 'Incorrect username or password.' });
    }
}

function* verifyPassword(password, hash) {
    const correct_pass = yield new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, function(err, res) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
    return correct_pass;
}

function* getPasswordHash(password) {
    const password_hash = yield new Promise((resolve, reject) => {
        bcrypt.hash(password, PASSWORD_SALT_ROUNDS, function(err, hash) {
            if (err) {
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
    return password_hash;
}

/**
 * Verifies authentication based on JWT token
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.verifyAuthenticationMiddleWare = (req, res, next) => 
    co(verifyAuthentication(req, res, next))
    .catch(err => util.handleError(req, res, err, { auth: false }));

function* verifyAuthentication(req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) {
        throw util.createError(401, 'No token provided');
    }
    const decoded_user = yield util.verifyJwt(token);
    req.user = yield util.getUserIfExists(decoded_user.id);
    next();
}
