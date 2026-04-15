import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let conn = null;

async function getConnection() {
  if (conn && mongoose.connection.readyState === 1) return conn;
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  conn = await mongoose.connect(uri);
  return conn;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'parent', 'student'], default: 'student' }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  phone: { type: String },
  parentName: { type: String },
  parentPhone: { type: String },
  parentEmail: { type: String, default: '' },
  course: { type: String },
  address: { type: String, default: '' },
  batch: { type: String, enum: ['Morning', 'Evening', 'Weekend'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'dropped', 'transferred'], default: 'pending' },
  admissionDate: { type: Date, default: Date.now }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' }
}, { timestamps: true });
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const performanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, default: Date.now },
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const protect = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Not authorized' });
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return null;
    }
    return user;
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    return null;
  }
};

export default async function handler(req, res) {
  const path = req.url.replace('/api', '');
  const method = req.method.toUpperCase();
  const { body } = req;

  if (path === '/health' && method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  await getConnection();

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
  const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
  const Performance = mongoose.models.Performance || mongoose.model('Performance', performanceSchema);

  if (path === '/auth/login' && method === 'POST') {
    try {
      const { email, password } = body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({ 
        token, 
        user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path === '/auth/register' && method === 'POST') {
    try {
      const { name, email, password, role } = body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, password required' });
      }
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword, role: role || 'student' });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ 
        token, 
        user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path === '/auth/me' && method === 'GET') {
    try {
      const user = await protect(req, res);
      if (!user) return;
      return res.status(200).json(user);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path === '/students' && method === 'GET') {
    try {
      const user = await protect(req, res);
      if (!user) return;
      const students = await Student.find();
      return res.status(200).json({ students, total: students.length });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path === '/students' && method === 'POST') {
    try {
      const user = await protect(req, res);
      if (!user) return;
      if (!['admin', 'teacher'].includes(user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const student = await Student.create(body);
      return res.status(201).json(student);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path.match(/^\/students\/[^/]+$/) && method === 'GET') {
    try {
      const user = await protect(req, res);
      if (!user) return;
      const id = path.split('/')[2];
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      return res.status(200).json(student);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path === '/analytics' && method === 'GET') {
    try {
      const user = await protect(req, res);
      if (!user) return;
      if (!['admin', 'teacher'].includes(user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const totalStudents = await Student.countDocuments();
      const activeStudents = await Student.countDocuments({ status: 'active' });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayAttendance = await Attendance.find({ date: { $gte: today, $lt: tomorrow } });
      const recentPerformances = await Performance.find().sort({ date: -1 }).limit(50);
      const avgWpm = recentPerformances.length ? recentPerformances.reduce((a, p) => a + p.wpm, 0) / recentPerformances.length : 0;
      const avgAccuracy = recentPerformances.length ? recentPerformances.reduce((a, p) => a + p.accuracy, 0) / recentPerformances.length : 0;
      return res.status(200).json({ 
        totalStudents, 
        activeStudents, 
        presentToday: todayAttendance.filter(a => a.status === 'present').length, 
        avgWpm: Math.round(avgWpm), 
        avgAccuracy: Math.round(avgAccuracy * 100) / 100 
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (path === '/rankings' && method === 'GET') {
    try {
      const user = await protect(req, res);
      if (!user) return;
      const students = await Student.find({ status: 'active' });
      const rankings = await Promise.all(students.map(async (student) => {
        const performances = await Performance.find({ studentId: student._id }).sort({ date: -1 }).limit(10);
        const avgWpm = performances.length ? performances.reduce((a, p) => a + p.wpm, 0) / performances.length : 0;
        const avgAccuracy = performances.length ? performances.reduce((a, p) => a + p.accuracy, 0) / performances.length : 0;
        const attendance = await Attendance.find({ studentId: student._id });
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const score = (avgWpm * 0.4) + (avgAccuracy * 0.4) + (presentDays > 0 ? (presentDays / Math.max(attendance.length, 1)) * 20 : 0);
        return { 
          student, 
          avgWpm: Math.round(avgWpm), 
          avgAccuracy: Math.round(avgAccuracy * 100) / 100, 
          attendanceRate: Math.round((presentDays / Math.max(attendance.length, 1)) * 100), 
          score: Math.round(score * 100) / 100 
        };
      }));
      rankings.sort((a, b) => b.score - a.score);
      return res.status(200).json(rankings);
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(404).json({ message: 'Not found' });
}
