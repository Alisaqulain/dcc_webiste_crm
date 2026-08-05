import mongoose from 'mongoose';
import { slugify } from '@/lib/slugify';

const sectionSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  content: { type: String, trim: true },
  image: { type: String, trim: true },
  bullets: [{ type: String, trim: true }],
});

const featureSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
});

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  shortDescription: { type: String, trim: true },
  heroTitle: { type: String, trim: true },
  heroSubtitle: { type: String, trim: true },
  image: { type: String, trim: true },
  phone: { type: String, trim: true },
  sections: [sectionSchema],
  features: [featureSchema],
  isPublished: { type: Boolean, default: true },
  showInHeader: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

serviceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

serviceSchema.index({ isPublished: 1, showInHeader: 1, order: 1 });

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;
