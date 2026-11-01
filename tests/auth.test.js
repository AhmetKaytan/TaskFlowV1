
const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
    readUsers,
    writeUsers,
    readRevokedTokens,
    writeRevokedTokens
} = require('../src/utils/fileOperations');

jest.mock('../src/utils/fileOperations', () => ({
    readTasks: jest.fn(),
    writeTasks: jest.fn(),
    readUsers: jest.fn(),
    writeUsers: jest.fn(),
    readRevokedTokens: jest.fn(),
    writeRevokedTokens: jest.fn()
}));

let hashedPassword;
let token;

beforeEach(async () => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    hashedPassword = await bcrypt.hash('testpass123', 10);

    readUsers.mockReturnValue({
        users: [
            {
                id: 1,
                username: 'testuser',
                password: hashedPassword,
                email: null
            }
        ],
        nextId: 2
    });

    readRevokedTokens.mockReturnValue({
        revokedTokens: []
    });

    token = jwt.sign(
        { id: 1, username: 'testuser' },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h',
            jwtid: 'test-jti'
        }
    );
});

//register testleri
describe('POST /auth/register', () => {
    //Kullanıcı başarılı kayıt testi
    test('should register a new user', async () => {
        readUsers.mockReturnValue({
            users: [],
            nextId: 1
        });

        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'newuser',
                password: 'newpass123'
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User registered successfully');
        expect(writeUsers).toHaveBeenCalledTimes(1);

        const savedData = writeUsers.mock.calls[0][0];

        expect(savedData.users).toHaveLength(1);
        expect(savedData.users[0].username).toBe('newuser');
        expect(savedData.users[0].password).not.toBe('newpass123');
        expect(savedData.nextId).toBe(2);
    });
    //Kullanıcı mevcutsa kayıt reddedilir testi
    test('should reject an existing username', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'testuser',
                password: 'newpass123'
            });

        expect(response.status).toBe(400);
        expect(writeUsers).not.toHaveBeenCalled();
    });

    //Geçersiz kayıt verisi reddedilir testi
    test('should reject invalid registration data', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                username: 'ab',
                password: '123'
            });

        expect(response.status).toBe(400);
        expect(writeUsers).not.toHaveBeenCalled();
    });
});

//login testleri
describe('POST /auth/login', () => {
    //Geçerli bilgilerle giriş testi
    test('should login with valid credentials', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeDefined();
        expect(response.body.user).toEqual({
            id: 1,
            username: 'testuser'
        });
    });

    //Hatalı şifre ile giriş reddedilir testi
    test('should reject an incorrect password', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                username: 'testuser',
                password: 'wrongpass123'
            });

        expect(response.status).toBe(401);
    });

    //Mevcut olmayan kullanıcı ile giriş reddedilir testi
    test('should reject a non-existing user', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                username: 'unknownuser',
                password: 'testpass123'
            });

        expect(response.status).toBe(401);
    });
});


//logout testleri
describe('POST /auth/logout', () => {
    //Geçerli token ile çıkış testi
    test('should logout with a valid token', async () => {
        const response = await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Logout successful');
        expect(writeRevokedTokens).toHaveBeenCalledTimes(1);

        const savedData = writeRevokedTokens.mock.calls[0][0];

        expect(savedData.revokedTokens).toHaveLength(1);
        expect(savedData.revokedTokens[0].jti).toBe('test-jti');
    });

    //Token olmadan çıkış reddedilir testi
    test('should reject logout without a token', async () => {
        const response = await request(app)
            .post('/auth/logout');

        expect(response.status).toBe(401);
        expect(writeRevokedTokens).not.toHaveBeenCalled();
    });

    //Zaten iptal edilmiş token ile çıkış reddedilir testi
    test('should reject an already revoked token', async () => {
        readRevokedTokens.mockReturnValue({
            revokedTokens: [
                {
                    jti: 'test-jti',
                    expiresAt: Math.floor(Date.now() / 1000) + 3600
                }
            ]
        });

        const response = await request(app)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
        expect(writeRevokedTokens).not.toHaveBeenCalled();
    });
});


