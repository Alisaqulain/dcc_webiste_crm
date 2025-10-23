import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 200
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  category: {
    type: String,
    required: true,
    enum: ['Digital Marketing', 'Web Development', 'Data Science', 'AI/ML', 'Cloud Computing', 'Cybersecurity', 'Other']
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  duration: {
    type: String,
    required: true // e.g., "4 weeks", "2 months"
  },
  language: {
    type: String,
    default: 'English',
    enum: ['English', 'Hindi', 'Tamil', 'Telugu', 'Other']
  },
  instructor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      trim: true
    },
    image: {
      type: String
    }
  },
  thumbnail: {
    type: String,
    required: true
  },
  videos: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    youtubeUrl: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(v);
        },
        message: 'Please provide a valid YouTube URL'
      }
    },
    duration: {
      type: String, // e.g., "15:30"
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    isPreview: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  whatYouWillLearn: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  hasCrmAccess: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: {
      type: Date
    }
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

// Update the updatedAt field before saving
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ createdAt: -1 });

// Virtual for discounted price
courseSchema.virtual('discountedPrice').get(function() {
  if (this.discount.percentage > 0 && 
      (!this.discount.validUntil || this.discount.validUntil > new Date())) {
    return this.price - (this.price * this.discount.percentage / 100);
  }
  return this.price;
});

// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
