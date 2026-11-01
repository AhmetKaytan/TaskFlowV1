
const verifyTask = (req, res, next) => {

    // Request body doğrulaması
    if (!req.body) {
        const err = new Error('Request body is required.');
        err.status = 400;
        return next(err);
    }

    if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
        const err = new Error('Request body must be an object.');
        err.status = 400;
        return next(err);
    }

    if (Object.keys(req.body).length === 0) {
        const err = new Error('Request body cannot be empty.');
        err.status = 400;
        return next(err);
    }

    const errors = [];

    // Geçerli değerler ve alanlar
    const validStatuses = ['pending', 'in_progress', 'completed'];
    const validPriorities = ['low', 'medium', 'high'];
    const validFields = ['title', 'assignee', 'description', 'status', 'priority', 'dueDate'];

    // Beklenmeyen alanlar
    for (const field of Object.keys(req.body)) {
        if (!validFields.includes(field)) {
            errors.push({
                field,
                message: `Unexpected field '${field}' is not allowed.`
            });
        }
    }

    // Request body'den ayıklama
    const { title, assignee, description, status, priority, dueDate } = req.body;

    // Zorunlu alanlar
    const requiredFields = {
        title,
        assignee,
        description,
        status,
        priority,
        dueDate
    };

    for (const [field, value] of Object.entries(requiredFields)) {
        if (value === undefined || value === null || value === '') {
            errors.push({
                field,
                message: `${field} is required.`
            });
        }
    }

    // Tür ve boş string doğrulaması
    const stringFields = {
        title,
        assignee,
        description,
        status,
        priority,
        dueDate
    };

    for (const [field, value] of Object.entries(stringFields)) {
        if (value !== undefined && value !== null) {
            if (typeof value !== 'string' || value.trim() === '') {
                errors.push({
                    field,
                    message: `${field} must be a non-empty string.`
                });
            }
        }
    }

    // Uzunluk doğrulaması
    const lengthLimits = {
        title: 100,
        assignee: 50,
        description: 500,
        dueDate: 10
    };

    for (const [field, limit] of Object.entries(lengthLimits)) {
        const value = requiredFields[field];

        if (typeof value === 'string' && value.length > limit) {
            errors.push({
                field,
                message: `${field} cannot exceed ${limit} characters.`
            });
        }
    }

    // Bitiş tarihi doğrulaması
    if (typeof dueDate === 'string' && dueDate.trim() !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (!dateRegex.test(dueDate)) {
            errors.push({
                field: 'dueDate',
                message: 'Due date must be in YYYY-MM-DD format.'
            });
        } else {
            const [year, month, day] = dueDate.split('-').map(Number);
            const dueDateObj = new Date(Date.UTC(year, month - 1, day));

            const isValidDate =
                dueDateObj.getUTCFullYear() === year &&
                dueDateObj.getUTCMonth() === month - 1 &&
                dueDateObj.getUTCDate() === day;

            if (!isValidDate) {
                errors.push({
                    field: 'dueDate',
                    message: 'Due date is not a valid calendar date.'
                });
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const requestedDate = new Date(year, month - 1, day);

                if (requestedDate < today) {
                    errors.push({
                        field: 'dueDate',
                        message: 'Due date cannot be in the past.'
                    });
                }
            }
        }
    }

    // Durum doğrulaması
    if (typeof status === 'string' && status.trim() !== '') {
        if (!validStatuses.includes(status.trim().toLowerCase())) {
            errors.push({
                field: 'status',
                message: 'Invalid status.'
            });
        }
    }

    // Öncelik doğrulaması
    if (typeof priority === 'string' && priority.trim() !== '') {
        if (!validPriorities.includes(priority.trim().toLowerCase())) {
            errors.push({
                field: 'priority',
                message: 'Invalid priority.'
            });
        }
    }

    // Doğrulama hatalarını merkezi hata işleyiciye ilet
    if (errors.length > 0) {
        const err = new Error('Task validation failed.');
        err.status = 400;
        err.errors = errors;

        return next(err);
    }

    next();
};

module.exports = verifyTask;
