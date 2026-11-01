const express = require('express');
const app = express();

//Body parser middleware
app.use(express.json());

// Logger middleware
app.use(require('./middlewares/loggerMiddleware'));

//Rotalara yönlendirme
app.use('/tasks', require('./routes/taskRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/auth', require('./routes/authRoutes'));

// Merkezi hata yakalama middleware'i
app.use(require('./middlewares/errorHandlerMiddleware'));

module.exports = app;