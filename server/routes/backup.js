const express = require('express');
const router = express.Router();
const { createBackup, listBackups, restoreBackup } = require('../controllers/backupController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);
router.use(authorize('Admin'));

router.post('/create', createBackup);
router.get('/list', listBackups);
router.post('/restore', restoreBackup);

module.exports = router;
