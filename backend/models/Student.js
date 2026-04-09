const mongoose = require('mongoose');

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

// Auto-generate student ID before saving
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `STU${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
