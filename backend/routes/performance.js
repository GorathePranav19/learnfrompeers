const express = require('express');
const router = express.Router();
const {
  addPerformance,
  getStudentPerformance,
  addBulkPerformance
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'teacher'), addPerformance);
router.post('/bulk', protect, authorize('admin', 'teacher'), addBulkPerformance);
router.get('/:studentId', protect, getStudentPerformance);

module.exports = router;
