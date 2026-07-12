const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/budgetsController');

router.get   ('/',     requireAuth, ctrl.list);
router.post  ('/',     requireAuth, ctrl.create);
router.post  ('/bulk', requireAuth, ctrl.bulk);
router.patch ('/:id',  requireAuth, ctrl.update);
router.delete('/:id',  requireAuth, ctrl.remove);

module.exports = router;
