const { validationResult, body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware that checks express-validator results and returns 400 on failure.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

/**
 * Validate that a route param is a valid MongoDB ObjectId.
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom(value => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];

/**
 * Escape special regex characters from user input to prevent ReDoS.
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ── Login validation ──
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ── Register validation ──
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'teacher', 'parent', 'student']).withMessage('Invalid role'),
  handleValidationErrors
];

// ── Student validation ──
const validateStudent = [
  body('name').trim().notEmpty().withMessage('Student name is required'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('parentName').trim().notEmpty().withMessage('Parent name is required'),
  body('parentPhone').trim().notEmpty().withMessage('Parent phone is required'),
  body('course').trim().notEmpty().withMessage('Course is required'),
  body('batch').isIn(['Morning', 'Evening', 'Weekend']).withMessage('Batch must be Morning, Evening, or Weekend'),
  body('parentEmail').optional({ values: 'falsy' }).isEmail().withMessage('Invalid parent email'),
  body('address').optional().trim(),
  handleValidationErrors
];

// ── Attendance validation ──
const validateAttendance = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('At least one attendance record is required'),
  body('records.*.studentId').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Invalid student ID'),
  body('records.*.status').isIn(['present', 'absent', 'late']).withMessage('Status must be present, absent, or late'),
  handleValidationErrors
];

// ── Performance validation ──
const validatePerformance = [
  body('studentId').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Invalid student ID'),
  body('typingSpeed').isInt({ min: 0, max: 300 }).withMessage('Typing speed must be 0-300'),
  body('accuracy').isFloat({ min: 0, max: 100 }).withMessage('Accuracy must be 0-100'),
  body('notes').optional().trim(),
  handleValidationErrors
];

// ── Bulk performance validation ──
const validateBulkPerformance = [
  body('records').isArray({ min: 1 }).withMessage('At least one record is required'),
  body('records.*.studentId').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Invalid student ID'),
  body('records.*.typingSpeed').isInt({ min: 0, max: 300 }).withMessage('Typing speed must be 0-300'),
  body('records.*.accuracy').isFloat({ min: 0, max: 100 }).withMessage('Accuracy must be 0-100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateObjectId,
  escapeRegex,
  validateLogin,
  validateRegister,
  validateStudent,
  validateAttendance,
  validatePerformance,
  validateBulkPerformance
};
