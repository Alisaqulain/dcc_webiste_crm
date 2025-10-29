import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  relation: {
    type: String,
    required: true,
    enum: ['s/o', 'd/o'],
    default: 's/o'
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  photo: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
certificateSchema.index({ rollNumber: 1 });
certificateSchema.index({ studentName: 1 });
certificateSchema.index({ courseName: 1 });
certificateSchema.index({ createdAt: -1 });

const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

export default Certificate;
