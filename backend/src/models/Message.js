import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    // Optimize for faster queries
    conversationId: {
      type: String,
      index: true
    }
  },
  { 
    timestamps: true,
    // Enable query optimizations
    minimize: false
  }
);

// Compound indexes for optimized query performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 });
// Conversation-based index for faster chat loading
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Pre-save middleware to generate conversationId
messageSchema.pre('save', function(next) {
  // Create consistent conversation ID regardless of sender/receiver order
  const participants = [this.senderId.toString(), this.receiverId.toString()].sort();
  this.conversationId = participants.join('_');
  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;