const log = require('../utils/logger');

const loggerMiddleware = (req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
};

module.exports = loggerMiddleware;