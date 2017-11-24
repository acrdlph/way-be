const config = require('config');

/**
 * wrap the config module
 * @param {*} key 
 */
exports.get = (key) => {
    return config.get(key);
}