const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
