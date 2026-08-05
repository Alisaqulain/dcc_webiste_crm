import mongoose from 'mongoose';

const appSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  shortDescription: { type: String, trim: true, maxlength: 300 },
  thumbnail: { type: String, required: true, trim: true },
  price: { type: Number, default: 0, min: 0 },
  originalPrice: { type: Number, min: 0 },
  category: {
    type: String,
    default: 'Other',
    enum: ['Productivity', 'Education', 'Business', 'Utility', 'Other'],
  },
  platform: {
    type: String,
    default: 'Android',
    enum: ['Android', 'iOS', 'Web', 'Desktop', 'Other'],
  },
  appUrl: { type: String, trim: true },
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

appSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

appSchema.index({ isPublished: 1, order: 1 });

const App = mongoose.models.App || mongoose.model('App', appSchema);
export default App;
