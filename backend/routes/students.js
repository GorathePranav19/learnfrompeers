const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  approveStudent
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin', 'teacher'), createStudent);
router.get('/', protect, getStudents);
router.get('/:id', protect, getStudent);
router.put('/:id', protect, authorize('admin'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);
router.put('/:id/approve', protect, authorize('admin'), approveStudent);

module.exports = router;
