import mongoose from 'mongoose';

const offlineCenterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  phone: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

offlineCenterSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const OfflineCenter =
  mongoose.models.OfflineCenter || mongoose.model('OfflineCenter', offlineCenterSchema);

export default OfflineCenter;
