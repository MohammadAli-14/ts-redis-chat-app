// backend/src/models/GroupMessage.js - UPDATED SCHEMA
import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    // ADD FILE FIELD FOR DOCUMENTS
    file: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
    },
    // UPDATE MESSAGE TYPE ENUM
    messageType: {
      type: String,
      enum: ["text", "image", "system", "file", "video"], // ADD "file" and "video"
      default: "text",
    },
    systemMessage: {
      type: String,
      trim: true,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for better query performance
groupMessageSchema.index({ groupId: 1, createdAt: -1 });
groupMessageSchema.index({ senderId: 1 });
groupMessageSchema.index({ "readBy.userId": 1 });
// New compound index for better performance
groupMessageSchema.index({ groupId: 1, messageType: 1, createdAt: -1 });

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;