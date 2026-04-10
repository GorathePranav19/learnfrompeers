const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getDailyAttendance,
  getStudentAttendance,
  getAttendanceSummary
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { validateAttendance, validateObjectId } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'teacher'), validateAttendance, markAttendance);
router.get('/summary', protect, getAttendanceSummary);
router.get('/daily/:date', protect, getDailyAttendance);
router.get('/student/:studentId', protect, validateObjectId('studentId'), getStudentAttendance);

module.exports = router;
