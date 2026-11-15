const cors = require('cors');
const express = require('express');
const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    process.env.CLIENT_URL
].filter(Boolean);


app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));



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