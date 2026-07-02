import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  clientEmail: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true
  },
  service: { 
    type: String, 
    required: true,
    trim: true
  },
  country: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'paid', 'rejected'], 
    default: 'pending' 
  },
  amount: { 
    type: Number, 
    default: 100 // 100 rupees per approved lead
  },
  approvedAt: { 
    type: Date 
  },
  paidAt: { 
    type: Date 
  },
  notes: { 
    type: String 
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

leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified('status') && this.status === 'approved' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  if (this.isModified('status') && this.status === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  next();
});

// Index for faster queries
leadSchema.index({ user: 1, createdAt: -1 });
leadSchema.index({ status: 1 });
leadSchema.index({ date: 1 });

/** Auto-remove pending/rejected leads ~30 days after createdAt (approved/paid are kept). */
leadSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000,
    partialFilterExpression: { status: { $in: ['pending', 'rejected'] } },
  }
);

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema);

