const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    expertId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ExpertProfile", 
      required: true, 
      index: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    requestId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Request", 
      required: true, 
      unique: true // One review per session
    },
    
    // Core ratings
    comment: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 10
    },
    
    // G(Old) Specific Trust Signals
    whatILearned: { 
      type: String, 
      trim: true, 
      default: "" 
    },
    expertStyle: { 
      type: String, 
      trim: true, 
      default: "" 
    },
    wouldRecommend: { 
      type: Boolean, 
      required: true,
      default: true
    },
    sessionType: { 
      type: String, 
      trim: true, 
      default: "" 
    }
  },
  { timestamps: true, versionKey: false }
);

// Prevent a user from reviewing the same expert multiple times without a new session (handled by requestId unique constraint above, but we also index them together for queries)
reviewSchema.index({ expertId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
