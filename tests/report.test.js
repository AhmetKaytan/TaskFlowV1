// aynı verifyToken middleware'ini kullandıkları için negatif testler yalnızca özet rapor için yapılmıştır!!!!!!

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const { readTasks, readRevokedTokens } = require('../src/utils/fileOperations');

//dosya işlemleri için mocklama yapılıyor
jest.mock('../src/utils/fileOperations', () => ({
    readTasks: jest.fn(),
    readRevokedTokens: jest.fn()
}));

//mocklanacak görev verileri
const mockTasks = [
    { id: 1, title: 'Task 1', status: 'completed' },
    { id: 2, title: 'Task 2', status: 'pending' },
    { id: 3, title: 'Task 3', status: 'completed' }
];

let token;
// her testten önce token ve mock verileri ayarlanıyor
beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = 'test-secret';

    token = jwt.sign(
        { id: 1, username: 'testuser' },
        process.env.JWT_SECRET,
        {
            jwtid: 'test-jti',
            expiresIn: '1h'
        }
    );

    readTasks.mockReturnValue({ tasks: mockTasks });
    readRevokedTokens.mockReturnValue({ revokedTokens: [] });
});

// completed görevler için rapor testleri
describe('GET /reports/completed', () => {

    // tammalanmış görevler için pozitif test
    test('should return only completed tasks', async () => {
        const response = await request(app)
            .get('/reports/completed')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.tasks).toHaveLength(2);

        expect(
            response.body.tasks.every(task => task.status === 'completed')
        ).toBe(true);
    });
});


// pending görevler için rapor testleri
describe('GET /reports/pending', () => {

    // bekleyen görevler için pozitif test
    test('should return only pending tasks', async () => {
        const response = await request(app)
            .get('/reports/pending')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.tasks).toHaveLength(1);

        expect(
            response.body.tasks.every(task => task.status === 'pending')
        ).toBe(true);
    });
});

// görevlerin özet raporu için testler
describe('GET /reports/summary', () => {

    // özet raporu için pozitif test
    test('should return summary of tasks', async () => {
        const response = await request(app)
            .get('/reports/summary')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.summary).toEqual({
            totalTasks: 3,
            completedTasks: 2,
            pendingTasks: 1
        });
    });


    // yetkilendirme tokenı olmadan yapılan istek için negatif test
    test('should reject request without authorization token', async () => {
    const response = await request(app)
        .get('/reports/summary');

        expect(response.status).toBe(401);
    });

    // geçersiz token ile yapılan istek için negatif test
    test('should reject request with invalid token', async () => {
        const response = await request(app)
            .get('/reports/summary')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(403);
    });


    // iptal edilmiş token ile yapılan istek için negatif test
    test('should reject request with revoked token', async () => {
        readRevokedTokens.mockReturnValue({
            revokedTokens: [
                { jti: 'test-jti', expiresAt: Math.floor(Date.now() / 1000) + 3600 }
            ]
        });

        const response = await request(app)
            .get('/reports/summary')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(403);
    });
});