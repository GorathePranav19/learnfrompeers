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
const { validateStudent, validateObjectId } = require('../middleware/validate');

router.post('/', protect, authorize('admin', 'teacher'), validateStudent, createStudent);
router.get('/', protect, getStudents);
router.get('/:id', protect, validateObjectId('id'), getStudent);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), updateStudent);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteStudent);
router.put('/:id/approve', protect, authorize('admin'), validateObjectId('id'), approveStudent);

module.exports = router;
