const { readUsers, writeUsers, readRevokedTokens, writeRevokedTokens } = require('../utils/fileOperations');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');

// Hata oluşturma yardımcı fonksiyonu
const createError = (message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

const login = async (req, res, next) => {
    try {
        // Kullanıcı verilerini oku
        const data = readUsers();
        const users = data.users;

        if (!Array.isArray(users)) {
            throw createError('Invalid users data.', 500);
        }

        // İstek gövdesini doğrula
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            throw createError('Invalid request body.', 400);
        }

        const { username, password } = req.body;

        if (typeof username !== 'string' || typeof password !== 'string') {
            throw createError('Invalid input types.', 400);
        }

        if (username.trim() === '' || password.trim() === '') {
            throw createError('Username and password cannot be empty.', 400);
        }

        // Kullanıcıyı bul
        const user = users.find(user =>
            typeof user.username === 'string' &&
            user.username.trim().toLowerCase() === username.trim().toLowerCase()
        );

        if (!user) {
            throw createError('Invalid username or password.', 401);
        }

        // Parolayı doğrula
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw createError('Invalid username or password.', 401);
        }

        // JWT oluştur
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN,
                jwtid: randomUUID()
            }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (err) {
        if (!err.status) {
            err.status = 500;
            err.message = 'Failed to login.';
        }

        return next(err);
    }
};

const register = async (req, res, next) => {
    try {
        // Kullanıcı verilerini oku
        const data = readUsers();
        const { users, nextId } = data;

        if (
            !Array.isArray(users) ||
            !Number.isInteger(nextId) ||
            nextId <= 0
        ) {
            throw createError('Invalid users data.', 500);
        }

        // Kullanıcı verilerini ayıkla
        const { username, password, email = null } = req.body;

        // Mevcut kullanıcıyı kontrol et
        const existingUser = users.find(user => {
            const usernameMatches =
                typeof user.username === 'string' &&
                user.username.trim().toLowerCase() === username.trim().toLowerCase();

            const emailMatches =
                email !== null &&
                typeof user.email === 'string' &&
                user.email.trim().toLowerCase() === email.trim().toLowerCase();

            return usernameMatches || emailMatches;
        });

        if (existingUser) {
            throw createError('This user already exists.', 400);
        }

        // Parolayı hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Yeni kullanıcı oluştur
        const now = new Date().toISOString();

        const newUser = {
            id: nextId,
            username: username.trim(),
            password: hashedPassword,
            email: email ? email.trim().toLowerCase() : null,
            createdAt: now
        };

        users.push(newUser);

        // Kullanıcı verilerini kaydet
        writeUsers({
            users,
            nextId: nextId + 1
        });

        return res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (err) {
        if (!err.status) {
            err.status = 500;
            err.message = 'Failed to register user.';
        }

        return next(err);
    }
};

const logout = (req, res, next) => {
    try {
        // Token bilgilerini ayıkla
        const { jti, exp: expiresAt } = req.user || {};

        if (typeof jti !== 'string' || jti.trim() === '') {
            throw createError('Invalid token.', 400);
        }

        if (
            typeof expiresAt !== 'number' ||
            !Number.isFinite(expiresAt) ||
            expiresAt <= 0
        ) {
            throw createError('Invalid token.', 400);
        }

        if (expiresAt <= Math.floor(Date.now() / 1000)) {
            throw createError('Token has already expired.', 400);
        }

        // İptal edilmiş tokenları oku
        const data = readRevokedTokens();
        const revokedTokens = data.revokedTokens;

        if (!Array.isArray(revokedTokens)) {
            throw createError('Invalid revoked tokens data.', 500);
        }

        // Tokenın zaten iptal edilip edilmediğini kontrol et
        if (revokedTokens.some(rt => rt.jti === jti)) {
            throw createError('Token has already been revoked.', 400);
        }

        // Tokenı iptal et
        revokedTokens.push({ jti, expiresAt });
        writeRevokedTokens({ revokedTokens });

        return res.status(200).json({
            message: 'Logout successful'
        });

    } catch (err) {
        if (!err.status) {
            err.status = 500;
            err.message = 'Failed to logout.';
        }

        return next(err);
    }
};

module.exports = {
    login,
    register,
    logout
};
