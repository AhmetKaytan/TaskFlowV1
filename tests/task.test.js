
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const {
    readTasks,
    writeTasks,
    readRevokedTokens
} = require('../src/utils/fileOperations');

jest.mock('../src/utils/fileOperations', () => ({
    readTasks: jest.fn(),
    writeTasks: jest.fn(),
    readUsers: jest.fn(),
    writeUsers: jest.fn(),
    readRevokedTokens: jest.fn(),
    writeRevokedTokens: jest.fn()
}));

let token;
let mockTasks;

const getFutureDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
};

const validTask = {
    title: 'Test task',
    assignee: 'Test User',
    description: 'This is a test task',
    status: 'pending',
    priority: 'medium',
    dueDate: getFutureDate()
};

const sampleTasks = () => [
    {
        id: 1,
        title: 'Backend Development',
        description: 'Create a REST API',
        status: 'completed',
        priority: 'high',
        assignee: 'Ahmet',
        dueDate: getFutureDate(),
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z'
    },
    {
        id: 2,
        title: 'Frontend Development',
        description: 'Create a React interface',
        status: 'pending',
        priority: 'medium',
        assignee: 'Mehmet',
        dueDate: getFutureDate(),
        createdAt: '2026-01-02T10:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z'
    },
    {
        id: 3,
        title: 'Database Design',
        description: 'Design PostgreSQL database',
        status: 'in_progress',
        priority: 'high',
        assignee: 'Ahmet',
        dueDate: getFutureDate(),
        createdAt: '2026-01-03T10:00:00.000Z',
        updatedAt: '2026-01-03T10:00:00.000Z'
    }
];

beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = 'test-secret';

    token = jwt.sign(
        { id: 1, username: 'testuser' },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h',
            jwtid: 'test-jti'
        }
    );

    mockTasks = sampleTasks();

    readTasks.mockReturnValue({
        tasks: mockTasks,
        nextId: 4
    });

    readRevokedTokens.mockReturnValue({
        revokedTokens: []
    });
});

const authRequest = (method, endpoint) => {
    return request(app)[method](endpoint)
        .set('Authorization', `Bearer ${token}`);
};

describe('GET /tasks', () => {
    test('should return all tasks', async () => {
        const response = await authRequest('get', '/tasks');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.tasks).toHaveLength(3);
    });

    test('should return an empty array when no tasks exist', async () => {
        readTasks.mockReturnValue({
            tasks: [],
            nextId: 1
        });

        const response = await authRequest('get', '/tasks');

        expect(response.status).toBe(200);
        expect(response.body.tasks).toEqual([]);
    });

    test('should filter tasks by status', async () => {
        const response = await authRequest('get', '/tasks?status=completed');

        expect(response.status).toBe(200);
        expect(response.body.tasks).toHaveLength(1);
        expect(response.body.tasks[0].status).toBe('completed');
    });

    test('should filter tasks by multiple query parameters', async () => {
        const response = await authRequest(
            'get',
            '/tasks?status=in_progress&priority=high&assignee=ahmet'
        );

        expect(response.status).toBe(200);
        expect(response.body.tasks).toHaveLength(1);
        expect(response.body.tasks[0].id).toBe(3);
    });

    test('should reject invalid status values', async () => {
        const response = await authRequest('get', '/tasks?status=invalid');

        expect(response.status).toBe(400);
    });
});

describe('GET /tasks/:id', () => {
    test('should return a task by ID', async () => {
        const response = await authRequest('get', '/tasks/1');

        expect(response.status).toBe(200);
        expect(response.body.task.id).toBe(1);
        expect(response.body.task.title).toBe('Backend Development');
    });

    test('should return 404 when task does not exist', async () => {
        const response = await authRequest('get', '/tasks/99');

        expect(response.status).toBe(404);
    });

    test('should reject invalid task IDs', async () => {
        const response = await authRequest('get', '/tasks/abc');

        expect(response.status).toBe(400);
    });
});

describe('POST /tasks', () => {
    test('should create a new task', async () => {
        const response = await authRequest('post', '/tasks')
            .send(validTask);

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
        expect(response.body.task.id).toBe(4);
        expect(response.body.task.title).toBe(validTask.title);
        expect(writeTasks).toHaveBeenCalledTimes(1);

        const savedData = writeTasks.mock.calls[0][0];

        expect(savedData.tasks).toHaveLength(4);
        expect(savedData.nextId).toBe(5);
    });

    test('should reject invalid task data', async () => {
        const response = await authRequest('post', '/tasks')
            .send({
                ...validTask,
                title: ''
            });

        expect(response.status).toBe(400);
        expect(writeTasks).not.toHaveBeenCalled();
    });
});

describe('PUT /tasks/:id', () => {
    test('should update an existing task', async () => {
        const updatedData = {
            ...validTask,
            title: 'Updated task',
            status: 'completed',
            priority: 'high'
        };

        const response = await authRequest('put', '/tasks/1')
            .send(updatedData);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.task.title).toBe('Updated task');
        expect(response.body.task.status).toBe('completed');
        expect(writeTasks).toHaveBeenCalledTimes(1);
    });

    test('should return 404 when updating a non-existing task', async () => {
        const response = await authRequest('put', '/tasks/99')
            .send(validTask);

        expect(response.status).toBe(404);
        expect(writeTasks).not.toHaveBeenCalled();
    });

    test('should reject invalid task IDs', async () => {
        const response = await authRequest('put', '/tasks/abc')
            .send(validTask);

        expect(response.status).toBe(400);
        expect(writeTasks).not.toHaveBeenCalled();
    });
});

describe('DELETE /tasks/:id', () => {
    test('should delete an existing task', async () => {
        const response = await authRequest('delete', '/tasks/1');

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Task deleted successfully');
        expect(writeTasks).toHaveBeenCalledTimes(1);

        const savedData = writeTasks.mock.calls[0][0];

        expect(savedData.tasks).toHaveLength(2);
        expect(savedData.tasks.some(task => task.id === 1)).toBe(false);
    });

    test('should return 404 when deleting a non-existing task', async () => {
        const response = await authRequest('delete', '/tasks/99');

        expect(response.status).toBe(404);
        expect(writeTasks).not.toHaveBeenCalled();
    });

    test('should reject invalid task IDs', async () => {
        const response = await authRequest('delete', '/tasks/abc');

        expect(response.status).toBe(400);
        expect(writeTasks).not.toHaveBeenCalled();
    });
});

describe('GET /tasks/search', () => {
    test('should search tasks by keyword', async () => {
        const response = await authRequest(
            'get',
            '/tasks/search?keyword=backend'
        );

        expect(response.status).toBe(200);
        expect(response.body.tasks).toHaveLength(1);
        expect(response.body.tasks[0].title).toBe('Backend Development');
    });

    test('should reject an empty search keyword', async () => {
        const response = await authRequest(
            'get',
            '/tasks/search?keyword='
        );

        expect(response.status).toBe(400);
    });
});

describe('GET /tasks/assignee/:name', () => {
    test('should return tasks assigned to a specific user', async () => {
        const response = await authRequest(
            'get',
            '/tasks/assignee/Ahmet'
        );

        expect(response.status).toBe(200);
        expect(response.body.tasks).toHaveLength(2);
        expect(response.body.tasks.every(
            task => task.assignee === 'Ahmet'
        )).toBe(true);
    });

    test('should return an empty array when user has no tasks', async () => {
        const response = await authRequest(
            'get',
            '/tasks/assignee/Unknown'
        );

        expect(response.status).toBe(200);
        expect(response.body.tasks).toEqual([]);
    });
});
