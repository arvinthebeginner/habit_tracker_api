const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { summary } = require('../controllers/stats.controller');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', summary);

module.exports = router;
