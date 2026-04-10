const Performance = require('../models/Performance');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// GET /api/rankings — Optimized with aggregation (no more N+1 queries)
exports.getRankings = async (req, res) => {
  try {
    const students = await Student.find({ status: 'approved' }).lean();

    if (students.length === 0) {
      return res.json({ rankings: [], topPerformers: [] });
    }

    const studentIds = students.map(s => s._id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate all performance data in one query
    const perfAgg = await Performance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$studentId',
          latestSpeed: { $first: '$typingSpeed' },
          latestAccuracy: { $first: '$accuracy' },
          latestLevel: { $first: '$level' },
          avgSpeed: { $avg: '$typingSpeed' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    // Aggregate attendance in one query
    const attAgg = await Attendance.aggregate([
      { $match: { studentId: { $in: studentIds }, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: '$studentId',
          total: { $sum: 1 },
          attended: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          }
        }
      }
    ]);

    // Build lookup maps
    const perfMap = {};
    perfAgg.forEach(p => { perfMap[p._id.toString()] = p; });

    const attMap = {};
    attAgg.forEach(a => { attMap[a._id.toString()] = a; });

    // Build rankings
    const rankings = students.map(student => {
      const sid = student._id.toString();
      const perf = perfMap[sid] || {};
      const att = attMap[sid] || {};

      const avgSpeed = perf.avgSpeed ? Math.round(perf.avgSpeed * 10) / 10 : 0;
      const avgAccuracy = perf.avgAccuracy ? Math.round(perf.avgAccuracy * 10) / 10 : 0;
      const attendanceRate = att.total > 0
        ? Math.round((att.attended / att.total) * 1000) / 10
        : 0;

      // Composite score: 50% typing speed + 30% accuracy + 20% attendance
      const score = Math.round(((avgSpeed * 0.5) + (avgAccuracy * 0.3) + (attendanceRate * 0.2)) * 10) / 10;

      return {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          course: student.course
        },
        latestSpeed: perf.latestSpeed || 0,
        latestAccuracy: perf.latestAccuracy || 0,
        avgSpeed,
        avgAccuracy,
        attendanceRate,
        level: perf.latestLevel || 'beginner',
        score
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    // Add rank numbers
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json({
      rankings,
      topPerformers: rankings.slice(0, 3)
    });
  } catch (error) {
    console.error('Get rankings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
