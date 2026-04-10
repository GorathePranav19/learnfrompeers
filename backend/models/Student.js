const mongoose = require('mongoose');
const Counter = require('./Counter');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  parentName: {
    type: String,
    required: [true, 'Parent name is required'],
    trim: true
  },
  parentPhone: {
    type: String,
    required: [true, 'Parent phone is required'],
    trim: true
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  photo: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Auto-generate student ID using atomic counter (no race condition)
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const seq = await Counter.getNextSequence('studentId');
    this.studentId = `STU${String(seq).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
