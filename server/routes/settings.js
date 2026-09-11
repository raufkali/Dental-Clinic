const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.route('/')
  .get(getSettings)
  .put(authorize('Admin'), updateSettings);

module.exports = router;
