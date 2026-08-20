const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { create, list } = require('../controllers/habit.controller');

const router = express.Router();
router.use(requireAuth);
router.post('/', create);
router.get('/', list);

module.exports = router;
