const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');

// GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const approvedStudents = await Student.countDocuments({ status: 'approved' });
    const pendingAdmissions = await Student.countDocuments({ status: 'pending' });

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lte: endToday }
    });
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;

    // This week attendance rate
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAttendance = await Attendance.find({ date: { $gte: weekAgo } });
    const weekPresent = weekAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const weekAttendanceRate = weekAttendance.length > 0
      ? ((weekPresent / weekAttendance.length) * 100).toFixed(1)
      : 0;

    // Average typing speed across all students (latest records)
    const allPerfs = await Performance.aggregate([
      { $sort: { date: -1 } },
      { $group: { _id: '$studentId', latestSpeed: { $first: '$typingSpeed' }, latestAccuracy: { $first: '$accuracy' } } }
    ]);
    const avgSpeed = allPerfs.length > 0
      ? (allPerfs.reduce((sum, p) => sum + p.latestSpeed, 0) / allPerfs.length).toFixed(1)
      : 0;
    const avgAccuracy = allPerfs.length > 0
      ? (allPerfs.reduce((sum, p) => sum + p.latestAccuracy, 0) / allPerfs.length).toFixed(1)
      : 0;

    // Course distribution
    const courseDistribution = await Student.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent admissions (last 5)
    const recentAdmissions = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name studentId course status createdAt');

    // Monthly attendance trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Attendance.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      overview: {
        totalStudents,
        approvedStudents,
        pendingAdmissions,
        presentToday,
        absentToday,
        weekAttendanceRate: parseFloat(weekAttendanceRate),
        avgTypingSpeed: parseFloat(avgSpeed),
        avgAccuracy: parseFloat(avgAccuracy)
      },
      courseDistribution,
      recentAdmissions,
      monthlyTrend
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
