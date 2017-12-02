const geo_user_model = require('./models/geo_user');
const util = require('./util');
const logger = require('./logger');
const passport = require('passport')
, LocalStrategy = require('passport-local').Strategy;

/**
 * passport with our own db
 */
passport.use(new LocalStrategy((username, password, done) => {
    co(function* () {

    }).catch(err => {

    });
    // User.findOne({ username: username }, (err, user) => {
    //     if (err) { 
    //         return done(err); 
    //     }
    //     if (!user) {
    //         return done(null, false, { message: 'Incorrect username.' });
    //     }
    //     if (!user.validPassword(password)) {
    //         return done(null, false, { message: 'Incorrect password.' });
    //     }
    //     return done(null, user);
    // });
}));

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

    if (!username || !email || !password) {
        throw util.createError(400, "Username, Email and Password are required");
    }
    const existing_username = yield util.getUserForUsername(username);
    const existing_id_username = yield util.getUserForUsername(user_id);
    if (existing_username || existing_id_username) {
        throw util.createError(400, "Username already exists");
    }
    const password_hash = yield util.getPasswordHash(password);
    let user = false;
    if (user_id) {
        user = yield util.getUserIfExists(user_id);
    }
    const signed_up = new Date();
    if (user) {
        user.username = username;
        user.email = email;
        user.password = password_hash;
        user.sign_up = signed_up;
    } else {
        user = new geo_user_model(
            {
                username: username,
                email: email,
                password: password_hash,
                signed_up: signed_up,
                created_at: signed_up
            }
        );
    }
    yield user.save();
    res.json(util.mapUserOutput(user));
}

exports.login = function* (req, res) {

}

exports.logout = function* (req, res) {
    
}
