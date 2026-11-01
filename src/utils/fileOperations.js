const fs = require('fs');
const path = require('path');

const tasksFilePath = path.join(__dirname, '../data/tasks.json');
const usersFilePath = path.join(__dirname, '../data/users.json');
const revokedTokensFilePath = path.join(__dirname, '../data/revokedTokens.json');

const readTasks = () => {
    try {
        const data = fs.readFileSync(tasksFilePath, 'utf-8');
        const parsedFile = JSON.parse(data)
        const tasks = parsedFile.tasks;
        const nextId = parsedFile.nextId;
        return { tasks, nextId };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Tasks file not found:', error);
            throw new Error('Tasks file not found');
        } else {
            console.error('Error reading tasks:', error);
            throw new Error('Error reading tasks');
        }

    }
};

const writeTasks = (data) => {
    try {
        fs.writeFileSync(tasksFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing tasks:', error);
        throw new Error('Error writing tasks');
    }
};

const readUsers = () => {
    try {
        const data = fs.readFileSync(usersFilePath, 'utf-8');
        const parsedFile = JSON.parse(data);
        const users = parsedFile.users;
        const nextId = parsedFile.nextId;
        return { users, nextId };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Users file not found:', error);
            throw new Error('Users file not found');
        } else {
            console.error('Error reading users:', error);
            throw new Error('Error reading users');
        }
    }
};

const writeUsers = (data) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing users:', error);
        throw new Error('Error writing users');
    }
};

const readRevokedTokens = () => {
    try {
        const data = fs.readFileSync(revokedTokensFilePath, 'utf-8');
        const parsedFile = JSON.parse(data);
        const revokedTokens = parsedFile.revokedTokens;
        if (!Array.isArray(revokedTokens)) {
            throw new Error('Invalid revoked tokens data');
        }
        return { revokedTokens };
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Revoked tokens file not found:', error);
            throw new Error('Revoked tokens file not found');
        } else {
            console.error('Error reading revoked tokens:', error);
            throw new Error('Syntax error: file could not be parsed');
        }
    }
};

const writeRevokedTokens = (data) => {
    try {
        fs.writeFileSync(revokedTokensFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing revoked tokens:', error);
        throw new Error('Error writing revoked tokens');
    }
};

function cleanRevokedTokens() {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(revokedTokensFilePath, 'utf-8'));
        
    } catch (error) {
        console.error('Failed to read revoked tokens file:', error);
        return;
    }
    if (!Array.isArray(data.revokedTokens) || data.revokedTokens.length === 0) {
        return;
    }
    const now = Math.floor(Date.now() / 1000);

    const originalLength = data.revokedTokens.length;
    data.revokedTokens = data.revokedTokens.filter(rt => rt.expiresAt > now);
    // Eğer hiçbir token'ın süresi dolmamışsa, tüm dosyayı tekrar yazmaya gerek yok
    if (data.revokedTokens.length === originalLength) {
        return;
    }
    try {
        fs.writeFileSync(revokedTokensFilePath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Failed to write revoked tokens file:', error);
    }
}


module.exports = {
    readTasks,
    writeTasks,
    readUsers,
    writeUsers,
    readRevokedTokens,
    writeRevokedTokens,
    cleanRevokedTokens
};