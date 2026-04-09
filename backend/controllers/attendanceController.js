const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// POST /api/attendance
exports.markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;
    // records: [{ studentId, status, notes }]
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const existing = await Attendance.findOne({
          studentId: record.studentId,
          date: attendanceDate
        });

        if (existing) {
          existing.status = record.status;
          existing.notes = record.notes || '';
          existing.markedBy = req.user._id;
          await existing.save();
          results.push(existing);
        } else {
          const attendance = await Attendance.create({
            studentId: record.studentId,
            date: attendanceDate,
            status: record.status,
            notes: record.notes || '',
            markedBy: req.user._id
          });
          results.push(attendance);
        }
      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    res.status(201).json({ saved: results.length, errors, results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/attendance/daily/:date
exports.getDailyAttendance = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: { $gte: date, $lte: endDate }
    }).populate('studentId', 'name studentId course');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/attendance/student/:studentId
exports.getStudentAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { studentId: req.params.studentId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    // Calculate summary
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const rate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    res.json({
      attendance,
      summary: { total, present, absent, late, rate: parseFloat(rate) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/attendance/summary
exports.getAttendanceSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(today);
    endToday.setHours(23, 59, 59, 999);

    const totalStudents = await Student.countDocuments({ status: 'approved' });
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lte: endToday }
    });

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;

    res.json({
      totalStudents,
      presentToday,
      absentToday,
      notMarked: totalStudents - todayAttendance.length,
      attendanceRate: totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(1) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
