
const { readTasks } = require('../utils/fileOperations');

const createError = (message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

// Görevleri oku ve doğrula
const loadTasks = () => {
    const data = readTasks();

    if (!data || !Array.isArray(data.tasks)) {
        throw createError('Invalid tasks data.', 500);
    }

    return data.tasks;
};

// Tamamlanan görevleri getir
const getCompletedTasksReport = (req, res, next) => {
    try {
        const tasks = loadTasks();

        const completedTasks = tasks.filter(
            task => task.status === 'completed'
        );

        return res.status(200).json({
            status: 'success',
            tasks: completedTasks
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to load tasks.', 500);
        }

        return next(error);
    }
};

// Bekleyen görevleri getir
const getPendingTasksReport = (req, res, next) => {
    try {
        const tasks = loadTasks();

        const pendingTasks = tasks.filter(
            task => task.status === 'pending'
        );

        return res.status(200).json({
            status: 'success',
            tasks: pendingTasks
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to load tasks.', 500);
        }

        return next(error);
    }
};

// Görevlerin özet raporunu getir
const getSummaryReport = (req, res, next) => {
    try {
        const tasks = loadTasks();

        const totalTasks = tasks.length;

        const completedTasks = tasks.filter(
            task => task.status === 'completed'
        ).length;

        const pendingTasks = tasks.filter(
            task => task.status === 'pending'
        ).length;

        return res.status(200).json({
            status: 'success',
            summary: {
                totalTasks,
                completedTasks,
                pendingTasks
            }
        });

    } catch (error) {
        if (!error.status) {
            error = createError('Failed to load tasks.', 500);
        }

        return next(error);
    }
};

module.exports = {
    getCompletedTasksReport,
    getPendingTasksReport,
    getSummaryReport
};
