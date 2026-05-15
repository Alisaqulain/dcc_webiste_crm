import mongoose from 'mongoose';

const feeRecordSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  amountDue: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  paidAt: { type: Date },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'card', 'bank', 'other', ''],
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  notes: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const offlineStudentSchema = new mongoose.Schema({
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfflineCenter',
    required: true,
  },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  guardianName: { type: String, trim: true },
  address: { type: String, trim: true },
  admissionDate: { type: Date, default: Date.now },
  courseLabel: { type: String, trim: true },
  monthlyFeeAmount: { type: Number, default: 0, min: 0 },
  feeRecords: [feeRecordSchema],
  notes: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

offlineStudentSchema.index({ centerId: 1, fullName: 1 });
offlineStudentSchema.index({ phone: 1 });

offlineStudentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const OfflineStudent =
  mongoose.models.OfflineStudent || mongoose.model('OfflineStudent', offlineStudentSchema);

export default OfflineStudent;
