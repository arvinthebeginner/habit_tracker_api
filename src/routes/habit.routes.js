const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateUuid } = require('../utils/validate.util');
const {
  create,
  list,
  getOne,
  update,
  remove,
  checkin,
  getCheckins,
  stats,
} = require('../controllers/habit.controller');

const router = express.Router();
router.use(requireAuth);

// Dipasang sekali di sini, berlaku untuk semua route yang memakai :id.
router.param('id', (req, res, next, id) => {
  try {
    validateUuid(id, 'habit id');
    next();
  } catch (err) {
    next(err);
  }
});

router.post('/', create);
router.get('/', list);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/checkin', checkin);
router.get('/:id/checkins', getCheckins);
router.get('/:id/stats', stats);

module.exports = router;
