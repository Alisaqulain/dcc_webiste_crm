import mongoose from 'mongoose';

const serviceInquirySchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  serviceTitle: { type: String, trim: true },
  serviceSlug: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  websiteUrl: { type: String, trim: true },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new',
  },
  createdAt: { type: Date, default: Date.now },
});

serviceInquirySchema.index({ createdAt: -1 });
serviceInquirySchema.index({ serviceId: 1 });

const ServiceInquiry =
  mongoose.models.ServiceInquiry || mongoose.model('ServiceInquiry', serviceInquirySchema);
export default ServiceInquiry;
