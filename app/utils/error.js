const logger = require('../logger');

/**
 * create an error object with a http error code
 * @param {*} code
 * @param {*} message
 */
exports.createError = (code, message) => {
    const e = new Error();
    e.code = code;
    e.message = message;
    return e;
}

/**
 * Handle error with proper http response
 * @param {*} req
 * @param {*} res
 * @param {*} err
 */
exports.handleError = (req, res, err, details) => {
    logger.error(err);
    res.status(err.code || 500).json({
        ...details,
        message: err.message
    });
}