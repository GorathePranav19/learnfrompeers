const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  approveStudent,
  generateIdCard,
  getDocuments,
  uploadDocument,
  deleteDocument,
  updateStatus,
  getDropouts
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');
const { validateStudent, validateObjectId } = require('../middleware/validate');
const upload = require('../middleware/upload');

// Important: put /reports/dropout before /:id so it doesn't match as an ID
router.get('/reports/dropout', protect, authorize('admin', 'teacher'), getDropouts);

router.post('/', protect, authorize('admin', 'teacher'), validateStudent, createStudent);
router.get('/', protect, getStudents);
router.get('/:id', protect, validateObjectId('id'), getStudent);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), updateStudent);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteStudent);

router.put('/:id/approve', protect, authorize('admin'), validateObjectId('id'), approveStudent);
router.put('/:id/status', protect, authorize('admin'), validateObjectId('id'), updateStatus);

// ID Card
router.get('/:id/idcard', protect, validateObjectId('id'), generateIdCard);

// Documents
router.get('/:id/documents', protect, validateObjectId('id'), getDocuments);
router.post('/:id/documents', protect, authorize('admin', 'teacher'), validateObjectId('id'), upload.single('document'), uploadDocument);
router.delete('/:id/documents/:docId', protect, authorize('admin'), validateObjectId('id'), deleteDocument);

module.exports = router;
