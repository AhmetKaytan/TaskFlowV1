const errorHandler = (err, req, res, next) => {
    
    if (process.env.NODE_ENV !== 'test') {
        console.error(err);
    }

    // Hatalı JSON gövdesi kontrolü
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        err.status = 400;
        err.errors = [
            {
                field: 'body',
                message: 'Invalid JSON format.'
            }
        ];
    }

    const errors = err.errors || [
        {
            field: err.field || null,
            message: err.message || 'Internal Server Error.'
        }
    ];

    res.status(err.status || 500).json({
        status: 'error',
        errors
    });
};

module.exports = errorHandler;