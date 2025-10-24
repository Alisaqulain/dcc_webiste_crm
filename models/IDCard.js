import mongoose from 'mongoose';

const idCardSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    default: null
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
idCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
idCardSchema.index({ rollNumber: 1 });
idCardSchema.index({ studentName: 1 });
idCardSchema.index({ courseName: 1 });
idCardSchema.index({ createdAt: -1 });

const IDCard = mongoose.models.IDCard || mongoose.model('IDCard', idCardSchema);

export default IDCard;
