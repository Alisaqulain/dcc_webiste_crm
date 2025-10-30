import mongoose from 'mongoose';

const SectionTextSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, default: '' }
}, { _id: false });

const SlideSchema = new mongoose.Schema({
  id: Number,
  image: String,
  alt: String
}, { _id: false });

const PackageSchema = new mongoose.Schema({
  title: String,
  courses: String,
  hours: String,
  enrollments: String,
  price: String,
  oldPrice: String,
  features: [String],
  image: String,
  link: String
}, { _id: false });

const InstructorSchema = new mongoose.Schema({
  name: String,
  role: String,
  img: String
}, { _id: false });

const TestimonialSchema = new mongoose.Schema({
  id: Number,
  text: String,
  author: String,
  role: String,
  rating: Number,
  image: String
}, { _id: false });

const HomepageSchema = new mongoose.Schema({
  // Single document collection; use a fixed slug for lookup
  slug: { type: String, required: true, unique: true, default: 'default' },

  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    url: { type: String, default: '' }
  },

  heroSlides: [SlideSchema],
  packages: [PackageSchema],
  instructors: [InstructorSchema],
  testimonials: [TestimonialSchema],

  // Arbitrary labeled texts for headings/paragraphs used on homepage
  texts: [SectionTextSchema],

  updatedAt: { type: Date, default: Date.now }
});

HomepageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Homepage || mongoose.model('Homepage', HomepageSchema);


