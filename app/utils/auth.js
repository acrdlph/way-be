const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

/**
 *
 * @param {*} user_id
 * @param {*} expires_in_secs
 */
exports.jwtSign = function jwtSign(user_id, private_key, expires_in_secs) {
  return jwt.sign({ id: user_id }, private_key, {
    expiresIn: expires_in_secs
  });
};

/**
 *
 * @param {*} token
 */
exports.verifyJwt = function verifyJwt(token, private_key) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, private_key, (err, decoded) => {
      if (err) {
        reject(err);
      }
      resolve(decoded);
    });
  });
};

/**
 *
 * @param {*} password
 * @param {*} hash
 */
exports.verifyPassword = function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
};

/**
 *
 * @param {*} password
 * @param {*} salt_rounds
 */
exports.getPasswordHash = function* getPasswordHash(password, salt_rounds) {
  return bcrypt.hash(password, salt_rounds);
};
