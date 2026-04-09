const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getDailyAttendance,
  getStudentAttendance,
  getAttendanceSummary
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'teacher'), markAttendance);
router.get('/summary', protect, getAttendanceSummary);
router.get('/daily/:date', protect, getDailyAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);

module.exports = router;
