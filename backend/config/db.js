const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    // Use in-memory MongoDB (no external MongoDB installation needed)
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB In-Memory Connected: ${conn.connection.host}`);
    
    // Auto-seed after connection
    await seedInitialData();
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const seedInitialData = async () => {
  const User = require('../models/User');
  const Student = require('../models/Student');
  const Attendance = require('../models/Attendance');
  const Performance = require('../models/Performance');

  // Only seed if empty
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  console.log('🌱 Seeding initial data...');

  // Create users
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@lfp.com',
    password: 'admin123',
    role: 'admin'
  });

  const teacher = await User.create({
    name: 'Teacher One',
    email: 'teacher@lfp.com',
    password: 'teacher123',
    role: 'teacher'
  });

  // Create sample students
  const studentsData = [
    { name: 'Rahul Sharma', dob: '2012-05-15', gender: 'male', phone: '9876543210', parentName: 'Suresh Sharma', parentPhone: '9876543211', parentEmail: 'suresh@email.com', course: 'Typing', status: 'approved' },
    { name: 'Priya Gupta', dob: '2013-03-22', gender: 'female', phone: '9876543212', parentName: 'Ramesh Gupta', parentPhone: '9876543213', parentEmail: 'ramesh@email.com', course: 'Typing', status: 'approved' },
    { name: 'Amit Kumar', dob: '2011-08-10', gender: 'male', phone: '9876543214', parentName: 'Vijay Kumar', parentPhone: '9876543215', parentEmail: 'vijay@email.com', course: 'Computer Basics', status: 'approved' },
    { name: 'Sneha Patel', dob: '2012-11-30', gender: 'female', phone: '9876543216', parentName: 'Rakesh Patel', parentPhone: '9876543217', parentEmail: 'rakesh@email.com', course: 'Typing', status: 'approved' },
    { name: 'Vikram Singh', dob: '2013-07-04', gender: 'male', phone: '9876543218', parentName: 'Arun Singh', parentPhone: '9876543219', parentEmail: 'arun@email.com', course: 'Computer Basics', status: 'approved' },
    { name: 'Anjali Verma', dob: '2014-01-25', gender: 'female', phone: '9876543220', parentName: 'Deepak Verma', parentPhone: '9876543221', parentEmail: '', course: 'Typing', status: 'pending' },
  ];

  const students = [];
  for (const data of studentsData) {
    const student = await Student.create(data);
    students.push(student);
  }

  // Create parent user linked to first student
  await User.create({
    name: 'Suresh Sharma (Parent)',
    email: 'parent@lfp.com',
    password: 'parent123',
    role: 'parent',
    linkedStudentId: students[0]._id
  });

  // Create attendance records for last 10 weekdays
  const approvedStudents = students.filter(s => s.status === 'approved');
  let daysAdded = 0;
  for (let i = 0; daysAdded < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    daysAdded++;

    for (const student of approvedStudents) {
      const random = Math.random();
      let status = 'present';
      if (random > 0.9) status = 'absent';
      else if (random > 0.8) status = 'late';

      await Attendance.create({
        studentId: student._id,
        date,
        status,
        markedBy: teacher._id
      });
    }
  }

  // Create performance records
  for (const student of approvedStudents) {
    const baseSpeed = 15 + Math.floor(Math.random() * 25);
    const baseAccuracy = 60 + Math.floor(Math.random() * 20);

    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 3));

      await Performance.create({
        studentId: student._id,
        date,
        typingSpeed: Math.max(5, baseSpeed + Math.floor(Math.random() * 10) + (8 - i) * 2),
        accuracy: Math.min(100, baseAccuracy + Math.floor(Math.random() * 10) + (8 - i) * 1.5),
        recordedBy: teacher._id
      });
    }
  }

  console.log('✅ Seed complete!');
  console.log('   Admin:   admin@lfp.com / admin123');
  console.log('   Teacher: teacher@lfp.com / teacher123');
  console.log('   Parent:  parent@lfp.com / parent123');
};

module.exports = connectDB;
