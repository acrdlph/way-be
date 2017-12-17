const co = require('co');

const geo_user_model = require('./models/geo_user');
const util = require('./util');
const logger = require('./logger');
const validator = require('validator');;
const passport = require('passport')
, LocalStrategy = require('passport-local').Strategy;

/**
 * passport with our own db
 */
passport.use(new LocalStrategy({
    usernameField: 'loginname',
    passwordField: 'password',
    session: false
  }, (loginname, password, done) => {
    co(function* () {
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
            const verified = yield util.verifyPassword(password, user.password);
            if (verified) {
                done(null, user);
            } else {
                done(null, false, { message: 'Incorrect username or password.' });
            }
        } else {
            done(null, false, { message: 'Incorrect username or password.' });
        }
    }).catch(err => {
        done(err);
    });
}));

// TODO redo these
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
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

    // After registration, the user should be logged in.
    // So the response has to contain the token as well.
    const responseBody = util.mapUserOutput(user);
    responseBody.token = createToken(user.id);
    res.json(responseBody);
}

exports.login = function* (req, res) {
    if (req.user) {
        res.json({token: createToken(req.user.id)});
    } else {
        throw new Error("Something is wrong");
    }
}

exports.logout = function* (req, res) {

}

function createToken(userId) {
  return userId; // TODO: create the real token here!
}
