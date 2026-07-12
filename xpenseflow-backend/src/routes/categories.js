const express = require('express');
const router  = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/categoriesController');

router.get   ('/',     requireAuth, ctrl.list);
router.post  ('/',     requireAuth, ctrl.create);
router.post  ('/bulk', requireAuth, ctrl.bulk);
router.delete('/',     requireAuth, ctrl.remove);   // body: { type, name }

module.exports = router;
