const bunyan = require('bunyan');

const logger = bunyan.createLogger({
    name: 'waitlist'
});

logger.logRequest = (req) => {
    logger.info('request received for %s %s with ', req.method, req.path, {query: req.query, params: req.params});
}

module.exports = logger;