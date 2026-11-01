
const { readRevokedTokens } = require('../utils/fileOperations');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {

    // Authorization header kontrolü
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        const err = new Error('Authorization header is required.');
        err.status = 401;
        return next(err);
    }

    // Authorization header'ı ayır
    const tokenList = authorizationHeader.split(' ');

    if (tokenList.length !== 2 || tokenList[0] !== 'Bearer' || !tokenList[1]) {
        const err = new Error('Invalid Authorization header format.');
        err.status = 401;
        return next(err);
    }

    const token = tokenList[1];

    // JWT doğrulama
    let verifiedToken;

    try {
        verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        const err = new Error('Invalid or expired token.');
        err.status = 403;
        return next(err);
    }

    // Token payload doğrulama
    if (
        !verifiedToken ||
        typeof verifiedToken !== 'object' ||
        typeof verifiedToken.jti !== 'string' ||
        verifiedToken.jti.trim() === ''
    ) {
        const err = new Error('Invalid token payload.');
        err.status = 403;
        return next(err);
    }

    // İptal edilmiş tokenları kontrol et
    let revokedTokens;

    try {
        const revokedTokensData = readRevokedTokens();
        revokedTokens = revokedTokensData.revokedTokens;

        if (!Array.isArray(revokedTokens)) {
            throw new Error('Invalid revoked tokens data.');
        }
    } catch (error) {
        const err = new Error('Error reading revoked tokens.');
        err.status = 500;
        return next(err);
    }

    // Tokenın iptal edilip edilmediğini kontrol et
    if (revokedTokens.some(rt => rt.jti === verifiedToken.jti)) {
        const err = new Error('Token has been revoked.');
        err.status = 403;
        return next(err);
    }

    // Doğrulanmış tokenı request objesine ekle
    req.user = verifiedToken;

    next();
};

module.exports = verifyToken;
