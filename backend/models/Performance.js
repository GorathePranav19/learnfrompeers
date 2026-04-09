const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  typingSpeed: {
    type: Number,
    required: [true, 'Typing speed (WPM) is required'],
    min: 0
  },
  accuracy: {
    type: Number,
    required: [true, 'Accuracy is required'],
    min: 0,
    max: 100
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  notes: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Auto-calculate level based on typing speed
performanceSchema.pre('save', function(next) {
  if (this.typingSpeed < 20) this.level = 'beginner';
  else if (this.typingSpeed < 40) this.level = 'intermediate';
  else if (this.typingSpeed < 60) this.level = 'advanced';
  else this.level = 'expert';
  next();
});

module.exports = mongoose.model('Performance', performanceSchema);
