
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const verifyUser = require('../src/middlewares/verifyUser');
const verifyToken = require('../src/middlewares/verifyTokenMiddleware');
const errorHandler = require('../src/middlewares/errorHandlerMiddleware');

const { readRevokedTokens } = require('../src/utils/fileOperations');

jest.mock('../src/utils/fileOperations', () => ({
    readTasks: jest.fn(),
    writeTasks: jest.fn(),
    readUsers: jest.fn(),
    writeUsers: jest.fn(),
    readRevokedTokens: jest.fn(),
    writeRevokedTokens: jest.fn()
}));

const app = express();
app.use(express.json());

app.post('/register', verifyUser, (req, res) => {
    res.status(200).json({ message: 'Validation successful' });
});

app.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Access granted',
        user: req.user
    });
});

app.use(errorHandler);

beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';

    readRevokedTokens.mockReturnValue({
        revokedTokens: []
    });
});

describe('verifyUser middleware', () => {
    test('should allow valid user data', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Validation successful');
    });

    test('should reject missing username', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                password: 'testpass123'
            });

        expect(response.status).toBe(400);
    });

    test('should reject missing password', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser'
            });

        expect(response.status).toBe(400);
    });

    test('should reject short passwords', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: '123'
            });

        expect(response.status).toBe(400);
    });

    test('should reject usernames shorter than 3 characters', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'ab',
                password: 'testpass123'
            });

        expect(response.status).toBe(400);
    });

    test('should reject usernames longer than 30 characters', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'a'.repeat(31),
                password: 'testpass123'
            });

        expect(response.status).toBe(400);
    });

    test('should reject unexpected fields', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpass123',
                role: 'admin'
            });

        expect(response.status).toBe(400);
    });

    test('should reject invalid email formats', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpass123',
                email: 'invalid-email'
            });

        expect(response.status).toBe(400);
    });

    test('should allow valid email addresses', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                username: 'testuser',
                password: 'testpass123',
                email: 'test@example.com'
            });

        expect(response.status).toBe(200);
    });
});

describe('verifyToken middleware', () => {
    let token;

    beforeEach(() => {
        token = jwt.sign(
            { id: 1, username: 'testuser' },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h',
                jwtid: 'test-jti'
            }
        );
    });

    test('should allow a valid token', async () => {
        const response = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Access granted');
        expect(response.body.user.username).toBe('testuser');
    });

    test('should reject requests without authorization header', async () => {
        const response = await request(app)
            .get('/protected');

        expect(response.status).toBe(401);
    });

    test('should reject an invalid token', async () => {
        const response = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(403);
    });

    test('should reject an expired token', async () => {
        const expiredToken = jwt.sign(
            { id: 1, username: 'testuser' },
            process.env.JWT_SECRET,
            {
                expiresIn: -1,
                jwtid: 'expired-jti'
            }
        );

        const response = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(403);
    });

    test('should reject non-Bearer authorization schemes', async () => {
        const response = await request(app)
            .get('/protected')
            .set('Authorization', `Basic ${token}`);

        expect(response.status).toBe(401);
    });

    test('should reject revoked tokens', async () => {
        readRevokedTokens.mockReturnValue({
            revokedTokens: [
                {
                    jti: 'test-jti',
                    expiresAt: Math.floor(Date.now() / 1000) + 3600
                }
            ]
        });

        const response = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        console.log('Response body:', response.body);
        expect(response.status).toBe(403);
        expect(response.body.errors[0].message).toBe('Token has been revoked.');
    });

    test('should return 500 if revoked tokens cannot be read', async () => {
        readRevokedTokens.mockImplementation(() => {
            throw new Error('File read error');
        });

        const response = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        console.log('Response body:', response.body);
        expect(response.status).toBe(500);
        expect(response.body.errors[0].message).toBe('Error reading revoked tokens.');
    });
});
