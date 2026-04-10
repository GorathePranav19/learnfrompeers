const express = require('express');
const router = express.Router();
const {
  addPerformance,
  getStudentPerformance,
  addBulkPerformance
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');
const { validatePerformance, validateBulkPerformance, validateObjectId } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'teacher'), validatePerformance, addPerformance);
router.post('/bulk', protect, authorize('admin', 'teacher'), validateBulkPerformance, addBulkPerformance);
router.get('/:studentId', protect, validateObjectId('studentId'), getStudentPerformance);

module.exports = router;
