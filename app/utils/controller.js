const co = require('co');
const error_util = require('./error');


/**
 * Main controller which calls other controllers and handles errors
 * @param {*} controllerFunc
 * @param {*} req
 * @param {*} res
 */
exports.mainControlller = (controllerFunc, req, res) =>
    co(controllerFunc(req, res))
    .catch(err => error_util.handleError(req, res, err))