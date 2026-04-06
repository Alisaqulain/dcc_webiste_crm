import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['flat', 'percent'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    /** 0 = unlimited uses */
    usageLimit: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** null = never expires */
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

couponSchema.index({ courseId: 1, createdBy: 1 });
couponSchema.index({ ownerId: 1, courseId: 1 });

couponSchema.pre('save', function normalizeCode(next) {
  if (this.code) {
    this.code = String(this.code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  next();
});

export default mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
