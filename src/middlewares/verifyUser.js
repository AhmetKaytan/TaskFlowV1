
const verifyUser = (req, res, next) => {

    // Request body doğrulaması
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        const err = new Error('Invalid request body.');
        err.status = 400;
        return next(err);
    }

    if (Object.keys(req.body).length === 0) {
        const err = new Error('Request body cannot be empty.');
        err.status = 400;
        return next(err);
    }

    const errors = [];

    // İzin verilen alanlar
    const allowedFields = ['username', 'password', 'email'];

    for (const field of Object.keys(req.body)) {
        if (!allowedFields.includes(field)) {
            errors.push({
                field,
                message: `Unexpected field '${field}' is not allowed.`
            });
        }
    }

    // Kullanıcı verilerini ayıkla
    const { username, password, email = null } = req.body;

    // Zorunlu alanlar
    if (username === undefined || username === null || username === '') {
        errors.push({
            field: 'username',
            message: 'Username is required.'
        });
    }

    if (password === undefined || password === null || password === '') {
        errors.push({
            field: 'password',
            message: 'Password is required.'
        });
    }

    // Tür doğrulaması
    if (username !== undefined && username !== null && typeof username !== 'string') {
        errors.push({
            field: 'username',
            message: 'Username must be a string.'
        });
    }

    if (password !== undefined && password !== null && typeof password !== 'string') {
        errors.push({
            field: 'password',
            message: 'Password must be a string.'
        });
    }

    if (email !== null && typeof email !== 'string') {
        errors.push({
            field: 'email',
            message: 'Email must be a string.'
        });
    }

    // Boş string doğrulaması
    if (typeof username === 'string' && username.trim() === '') {
        errors.push({
            field: 'username',
            message: 'Username cannot be empty.'
        });
    }

    if (typeof password === 'string' && password.trim() === '') {
        errors.push({
            field: 'password',
            message: 'Password cannot be empty.'
        });
    }

    // Uzunluk doğrulaması
    if (typeof username === 'string' && username.trim() !== '') {
        if (username.trim().length < 3 || username.trim().length > 30) {
            errors.push({
                field: 'username',
                message: 'Username must be between 3 and 30 characters long.'
            });
        }
    }

    if (typeof password === 'string' && password.length > 0 && password.length < 8) {
        errors.push({
            field: 'password',
            message: 'Password must be at least 8 characters long.'
        });
    }

    // Email format doğrulaması
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (typeof email === 'string' && email.trim() !== '') {
        if (!emailRegex.test(email)) {
            errors.push({
                field: 'email',
                message: 'Invalid email format.'
            });
        }
    }

    // Doğrulama hatalarını merkezi hata işleyiciye ilet
    if (errors.length > 0) {
        const err = new Error('User validation failed.');
        err.status = 400;
        err.errors = errors;

        return next(err);
    }

    next();
};

module.exports = verifyUser;
