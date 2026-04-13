const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');
const { escapeRegex } = require('../middleware/validate');

// Whitelist of allowed fields for create/update
const ALLOWED_FIELDS = [
  'name', 'dob', 'gender', 'phone', 'parentName',
  'parentPhone', 'parentEmail', 'course', 'batch', 'address', 'status', 'photo'
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
    const { search, status, course, batch, page = 1, limit = 20 } = req.query;
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
    if (batch) query.batch = batch;

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

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// GET /api/students/:id/idcard
exports.generateIdCard = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const doc = new PDFDocument({ size: 'A6', layout: 'landscape', margin: 20 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=idcard-${student.studentId}.pdf`);
    
    doc.pipe(res);
    
    // Draw ID Card background/border
    doc.rect(10, 10, doc.page.width - 20, doc.page.height - 20).stroke('#333');
    
    // Header
    doc.fontSize(16).fillColor('#4f46e5').text('LearnFlow Pod Computer Classes', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text('Student Identity Card', { align: 'center' });
    doc.moveDown(1);
    
    // Add photo placeholder or actual photo if available locally
    // If student.photo exists and is a local file, we might draw it, else placeholder
    doc.rect(20, doc.y, 60, 80).stroke('#ccc');
    doc.fontSize(8).fillColor('#999').text('PHOTO', 33, doc.y + 35);
    
    // Student Info
    const startX = 100;
    const currentY = doc.y;
    
    doc.fontSize(12).fillColor('#111');
    doc.text(`Name: ${student.name}`, startX, currentY);
    doc.moveDown(0.5);
    doc.text(`ID: ${student.studentId}`, startX);
    doc.moveDown(0.5);
    doc.text(`Course: ${student.course}`, startX);
    doc.moveDown(0.5);
    doc.text(`Batch: ${student.batch || 'N/A'}`, startX);
    doc.moveDown(0.5);
    doc.text(`Phone: ${student.phone}`, startX);
    
    // Footer
    doc.fontSize(8).fillColor('#666').text('Valid only for registered course duration.', 20, doc.page.height - 30);
    
    doc.end();

  } catch (error) {
    console.error('ID Card generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/students/:id/documents
exports.getDocuments = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('documents');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ documents: student.documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/students/:id/documents
exports.uploadDocument = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { label } = req.body;

    // The file is uploaded to /uploads/docs/
    const filePath = `/uploads/docs/${req.file.filename}`;

    student.documents.push({
      path: filePath,
      label: label || 'Document'
    });

    await student.save();
    res.json(student);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/students/:id/documents/:docId
exports.deleteDocument = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const docIndex = student.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = student.documents[docIndex];
    // Remove the file from disk if necessary
    const fullPath = path.join(__dirname, '..', doc.path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    student.documents.splice(docIndex, 1);
    await student.save();
    res.json(student);
  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/students/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'dropped', 'transferred'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Only log history if status actually changed
    if (student.status !== status) {
      student.statusHistory.push({
        status,
        reason: reason || 'No reason provided',
        changedBy: req.user._id
      });
      student.status = status;
    }

    await student.save();
    res.json(student);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/students/reports/dropout
exports.getDropouts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { status: 'dropped' };

    if (startDate || endDate) {
      match['statusHistory'] = {
        $elemMatch: {
          status: 'dropped',
          ...(startDate || endDate ? {
            date: {
              ...(startDate ? { $gte: new Date(startDate) } : {}),
              ...(endDate ? { $lte: new Date(endDate) } : {})
            }
          } : {})
        }
      };
    }

    const students = await Student.find(match)
      .populate('statusHistory.changedBy', 'name')
      .sort({ updatedAt: -1 });

    res.json({ dropouts: students });
  } catch (error) {
    console.error('Get dropouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
