const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const { escapeRegex } = require('../middleware/validate');

// Whitelist of allowed fields for create/update
const ALLOWED_FIELDS = [
  'name', 'dob', 'gender', 'phone', 'parentName',
  'parentPhone', 'parentEmail', 'course', 'address', 'status', 'photo'
];

const pickFields = (body) => {
  const obj = {};
  ALLOWED_FIELDS.forEach(field => {
    if (body[field] !== undefined) obj[field] = body[field];
  });
  return obj;
};

// POST /api/students
exports.createStudent = async (req, res) => {
  try {
    const data = pickFields(req.body);
    const student = await Student.create(data);
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry found' });
    }
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/students
exports.getStudents = async (req, res) => {
  try {
    const { search, status, course, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { studentId: { $regex: escaped, $options: 'i' } },
        { phone: { $regex: escaped, $options: 'i' } },
        { parentName: { $regex: escaped, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (course) query.course = course;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      students,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const data = pickFields(req.body);
    const student = await Student.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/students/:id — cascades to attendance & performance
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Cascade delete related records
    await Attendance.deleteMany({ studentId: req.params.id });
    await Performance.deleteMany({ studentId: req.params.id });

    res.json({ message: 'Student and related records deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/students/:id/approve
exports.approveStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Approve student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
