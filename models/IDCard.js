import mongoose from 'mongoose';

const idCardSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  courseName: {
    type: String,
    required: false,
    trim: true,
    default: ''
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

// Use 'validate' hook to ensure fields are set BEFORE Mongoose validation runs
idCardSchema.pre('validate', function(next) {
  // Ensure optional fields have default values if not set (runs before validation)
  if (this.studentName === undefined || this.studentName === null) {
    this.studentName = '';
  }
  if (this.courseName === undefined || this.courseName === null) {
    this.courseName = '';
  }
  next();
});

// Update the updatedAt field before saving
idCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Double check before save
  if (this.studentName === undefined || this.studentName === null) {
    this.studentName = '';
  }
  if (this.courseName === undefined || this.courseName === null) {
    this.courseName = '';
  }
  
  next();
});

// Create indexes
idCardSchema.index({ rollNumber: 1 });
idCardSchema.index({ studentName: 1 });
idCardSchema.index({ courseName: 1 });
idCardSchema.index({ createdAt: -1 });

// Delete the cached model if it exists to ensure schema changes take effect
if (mongoose.models.IDCard) {
  delete mongoose.models.IDCard;
}

const IDCard = mongoose.model('IDCard', idCardSchema);

export default IDCard;
