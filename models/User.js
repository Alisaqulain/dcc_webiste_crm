import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  profile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    mobile: { type: String, trim: true },
    state: { type: String, trim: true },
    avatar: { type: String }
  },
  auth: {
    googleId: { type: String, unique: true, sparse: true },
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false }
  },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  referralCode: { 
    type: String, 
    unique: true, 
    sparse: true,
    uppercase: true
  },
  referredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  referralEarnings: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 },
  courses: [{
    courseId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Course' 
    },
    purchasedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'completed', 'expired'], 
      default: 'active' 
    },
    progress: { type: Number, default: 0, min: 0, max: 100 }
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  crmFiles: [{
    filename: { type: String },
    originalName: { type: String },
    url: { type: String },
    uploadedAt: { type: Date },
    size: { type: Number },
    type: { type: String },
    downloaded: { type: Boolean, default: false },
    downloadedAt: { type: Date },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }
  }],
  // Keep crmFile for backward compatibility (will be deprecated)
  crmFile: {
    filename: { type: String },
    originalName: { type: String },
    url: { type: String },
    uploadedAt: { type: Date },
    size: { type: Number },
    type: { type: String }
  },
  crmFileDownloaded: { 
    type: Boolean, 
    default: false 
  },
  crmFileDownloadedAt: { 
    type: Date 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate referral code before saving
userSchema.pre('save', function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = 'DCC' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

// Update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema);


