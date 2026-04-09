const Performance = require('../models/Performance');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// GET /api/rankings
exports.getRankings = async (req, res) => {
  try {
    const students = await Student.find({ status: 'approved' });
    const rankings = [];

    for (const student of students) {
      // Get latest performance
      const latestPerf = await Performance.findOne({ studentId: student._id })
        .sort({ date: -1 });

      // Get average performance
      const allPerfs = await Performance.find({ studentId: student._id });
      const avgSpeed = allPerfs.length > 0
        ? allPerfs.reduce((sum, p) => sum + p.typingSpeed, 0) / allPerfs.length
        : 0;
      const avgAccuracy = allPerfs.length > 0
        ? allPerfs.reduce((sum, p) => sum + p.accuracy, 0) / allPerfs.length
        : 0;

      // Get attendance rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const attendanceRecords = await Attendance.find({
        studentId: student._id,
        date: { $gte: thirtyDaysAgo }
      });
      const attendanceRate = attendanceRecords.length > 0
        ? (attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length / attendanceRecords.length) * 100
        : 0;

      // Composite score: 50% typing speed + 30% accuracy + 20% attendance
      const score = (avgSpeed * 0.5) + (avgAccuracy * 0.3) + (attendanceRate * 0.2);

      rankings.push({
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          course: student.course
        },
        latestSpeed: latestPerf ? latestPerf.typingSpeed : 0,
        latestAccuracy: latestPerf ? latestPerf.accuracy : 0,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        level: latestPerf ? latestPerf.level : 'beginner',
        score: Math.round(score * 10) / 10
      });
    }

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    // Add rank numbers
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json({
      rankings,
      topPerformers: rankings.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
