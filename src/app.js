const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const habitRoutes = require('./routes/habit.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
