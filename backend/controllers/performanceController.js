const Performance = require('../models/Performance');

// POST /api/performance
exports.addPerformance = async (req, res) => {
  try {
    const { studentId, typingSpeed, accuracy, date, notes } = req.body;

    const performance = await Performance.create({
      studentId,
      typingSpeed,
      accuracy,
      date: date || new Date(),
      notes: notes || '',
      recordedBy: req.user._id
    });

    res.status(201).json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/performance/:studentId
exports.getStudentPerformance = async (req, res) => {
  try {
    const records = await Performance.find({ studentId: req.params.studentId })
      .sort({ date: -1 })
      .limit(50);

    // Calculate stats
    if (records.length === 0) {
      return res.json({ records: [], stats: null });
    }

    const latestSpeed = records[0].typingSpeed;
    const latestAccuracy = records[0].accuracy;
    const avgSpeed = records.reduce((sum, r) => sum + r.typingSpeed, 0) / records.length;
    const avgAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0) / records.length;
    const bestSpeed = Math.max(...records.map(r => r.typingSpeed));
    const bestAccuracy = Math.max(...records.map(r => r.accuracy));

    // Calculate improvement (compare latest vs first)
    const firstRecord = records[records.length - 1];
    const speedImprovement = latestSpeed - firstRecord.typingSpeed;
    const accuracyImprovement = latestAccuracy - firstRecord.accuracy;

    res.json({
      records,
      stats: {
        latestSpeed,
        latestAccuracy,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        avgAccuracy: Math.round(avgAccuracy * 10) / 10,
        bestSpeed,
        bestAccuracy,
        speedImprovement,
        accuracyImprovement,
        level: records[0].level,
        totalRecords: records.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/performance/bulk
exports.addBulkPerformance = async (req, res) => {
  try {
    const { records } = req.body;
    // records: [{ studentId, typingSpeed, accuracy, date, notes }]
    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const performance = await Performance.create({
          ...record,
          recordedBy: req.user._id
        });
        results.push(performance);
      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    res.status(201).json({ saved: results.length, errors, results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
