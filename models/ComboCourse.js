import mongoose from 'mongoose';

const comboCourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  shortDescription: { type: String, trim: true, maxlength: 300 },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  thumbnail: { type: String, trim: true },
  banner: { type: String, trim: true },
  viewMore: { type: String, trim: true },
  courseIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
  ],
  hasCrmAccess: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  enrollmentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

comboCourseSchema.pre('save', function saveCombo(next) {
  this.updatedAt = Date.now();
  if (!this.courseIds || this.courseIds.length < 2) {
    return next(new Error('A combo must include at least 2 courses'));
  }
  next();
});

comboCourseSchema.index({ isPublished: 1, createdAt: -1 });

const ComboCourse =
  mongoose.models.ComboCourse || mongoose.model('ComboCourse', comboCourseSchema);

export default ComboCourse;
