// backend/src/controllers/reaction.controller.js - ENHANCED WITH CONSISTENT GROUP ROOM HANDLING
import MessageReaction from "../models/MessageReaction.js";
import Message from "../models/Message.js";
import GroupMessage from "../models/GroupMessage.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ENHANCED addReaction with consistent group room handling
export const addReaction = async (req, res) => {
  try {
    const { messageId, emoji, messageType } = req.body;
    const userId = req.user._id;

    if (!messageId || !emoji || !messageType) {
      return res.status(400).json({ message: "Message ID, emoji, and message type are required" });
    }

    // Validate emoji format
    if (emoji.length > 10) {
      return res.status(400).json({ message: "Invalid emoji" });
    }

    // Check if message exists based on type and user has access
    let message;
    let groupId;

    if (messageType === "private") {
      message = await Message.findOne({
        _id: messageId,
        $or: [{ senderId: userId }, { receiverId: userId }]
      });
    } else if (messageType === "group") {
      message = await GroupMessage.findById(messageId)
        .populate("groupId");
      
      if (message && message.groupId) {
        const isMember = message.groupId.members.some(
          member => member.user.toString() === userId.toString()
        );
        if (!isMember) {
          return res.status(403).json({ message: "You are not a member of this group" });
        }
        groupId = message.groupId._id;
      }
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    if (!message) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Check if user has already reacted with this emoji
    const existingReaction = await MessageReaction.findOne({
      $or: [
        { messageId, messageType: "private" },
        { groupMessageId: messageId, messageType: "group" }
      ],
      userId,
      emoji
    });

    if (existingReaction) {
      return res.status(400).json({ message: "You have already reacted with this emoji" });
    }

    // Create reaction with proper fields
    const reactionData = {
      userId,
      emoji,
      messageType,
    };

    if (messageType === "private") {
      reactionData.messageId = messageId;
    } else {
      reactionData.groupMessageId = messageId;
    }

    const reaction = new MessageReaction(reactionData);
    await reaction.save();

    // Populate reaction with user details
    const populatedReaction = await MessageReaction.findById(reaction._id)
      .populate("userId", "fullName profilePic");

    // ✅ FIXED: Enhanced socket emission with consistent room names
    if (messageType === "private") {
      // For private messages, notify both users
      const receiverId = message.senderId.toString() === userId.toString() 
        ? message.receiverId 
        : message.senderId;
      
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReactionAdded", {
          messageId,
          reaction: populatedReaction,
          messageType: "private"
        });
      }

      // Also notify the sender
      const senderSocketId = getReceiverSocketId(userId.toString());
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        io.to(senderSocketId).emit("messageReactionAdded", {
          messageId,
          reaction: populatedReaction,
          messageType: "private"
        });
      }
    } else if (messageType === "group") {
      // ✅ FIXED: Use consistent group room naming
      const roomName = `group_${groupId}`;
      
      // Emit to the entire group room
      io.to(roomName).emit("messageReactionAdded", {
        messageId: messageId,
        reaction: populatedReaction,
        messageType: "group"
      });
      
      console.log(`✅ Emitted reaction to group room: ${roomName}`);
    }

    res.status(201).json({
      success: true,
      reaction: populatedReaction,
    });
  } catch (error) {
    console.log("Error in addReaction controller:", error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reacted with this emoji" });
    }
    
    res.status(500).json({ message: "Internal server error" });
  }
};

// ENHANCED removeReaction with consistent group room handling
export const removeReaction = async (req, res) => {
  try {
    const { reactionId } = req.params;
    const userId = req.user._id;

    const reaction = await MessageReaction.findOne({
      _id: reactionId,
      userId,
    }).populate("userId", "fullName profilePic");

    if (!reaction) {
      return res.status(404).json({ message: "Reaction not found" });
    }

    const { messageId, groupMessageId, messageType, emoji } = reaction;
    const actualMessageId = messageType === "private" ? messageId : groupMessageId;

    await MessageReaction.deleteOne({ _id: reactionId });

    // ✅ FIXED: Enhanced socket emission
    if (messageType === "private") {
      const message = await Message.findById(actualMessageId);
      if (message) {
        const receiverId = message.senderId.toString() === userId.toString() 
          ? message.receiverId 
          : message.senderId;
        
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageReactionRemoved", {
            messageId: actualMessageId,
            userId: userId.toString(),
            emoji,
            messageType: "private"
          });
        }

        const senderSocketId = getReceiverSocketId(userId.toString());
        if (senderSocketId && senderSocketId !== receiverSocketId) {
          io.to(senderSocketId).emit("messageReactionRemoved", {
            messageId: actualMessageId,
            userId: userId.toString(),
            emoji,
            messageType: "private"
          });
        }
      }
    } else if (messageType === "group") {
      const groupMessage = await GroupMessage.findById(actualMessageId).populate("groupId");
      if (groupMessage && groupMessage.groupId) {
        // ✅ FIXED: Use consistent group room naming
        const roomName = `group_${groupMessage.groupId._id}`;
        io.to(roomName).emit("messageReactionRemoved", {
          messageId: actualMessageId,
          userId: userId.toString(),
          emoji,
          messageType: "group"
        });
        console.log(`✅ Emitted reaction removal to group room: ${roomName}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
    });
  } catch (error) {
    console.log("Error in removeReaction controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessageReactions = async (req, res) => {
  try {
    const { messageId, messageType } = req.params;

    let query;
    if (messageType === "private") {
      query = { messageId, messageType: "private" };
    } else if (messageType === "group") {
      query = { groupMessageId: messageId, messageType: "group" };
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    const reactions = await MessageReaction.find(query)
      .populate("userId", "fullName profilePic");

    // Group reactions by emoji
    const reactionsByEmoji = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction.userId);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      reactions: reactionsByEmoji,
    });
  } catch (error) {
    console.log("Error in getMessageReactions controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeReactionByMessageAndEmoji = async (req, res) => {
  try {
    const { messageId, emoji, messageType } = req.body;
    const userId = req.user._id;

    if (!messageId || !emoji || !messageType) {
      return res.status(400).json({ message: "Message ID, emoji, and message type are required" });
    }

    // Build query based on message type
    let query;
    if (messageType === "private") {
      query = { messageId, userId, emoji, messageType: "private" };
    } else if (messageType === "group") {
      query = { groupMessageId: messageId, userId, emoji, messageType: "group" };
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    // Find and delete the reaction
    const reaction = await MessageReaction.findOne(query);

    if (!reaction) {
      return res.status(404).json({ message: "Reaction not found" });
    }

    await MessageReaction.deleteOne({ _id: reaction._id });

    // Emit socket event (same as in removeReaction)
    const actualMessageId = messageType === "private" ? messageId : reaction.groupMessageId;

    if (messageType === "private") {
      const message = await Message.findById(actualMessageId);
      if (message) {
        const receiverId = message.senderId.toString() === userId.toString() 
          ? message.receiverId 
          : message.senderId;
        
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageReactionRemoved", {
            messageId: actualMessageId,
            userId: userId.toString(),
            emoji,
            messageType: "private"
          });
        }

        // Also notify the sender
        const senderSocketId = getReceiverSocketId(userId.toString());
        if (senderSocketId && senderSocketId !== receiverSocketId) {
          io.to(senderSocketId).emit("messageReactionRemoved", {
            messageId: actualMessageId,
            userId: userId.toString(),
            emoji,
            messageType: "private"
          });
        }
      }
    } else if (messageType === "group") {
      const groupMessage = await GroupMessage.findById(actualMessageId).populate("groupId");
      if (groupMessage && groupMessage.groupId) {
        const roomName = `group_${groupMessage.groupId._id}`;
        io.to(roomName).emit("messageReactionRemoved", {
          messageId: actualMessageId,
          userId: userId.toString(),
          emoji,
          messageType: messageType
        });
        console.log(`Emitted reaction removal to room: ${roomName}`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
    });
  } catch (error) {
    console.log("Error in removeReactionByMessageAndEmoji controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Bulk reactions endpoint
export const getBulkReactions = async (req, res) => {
  try {
    const { messageIds, messageType } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || !messageType) {
      return res.status(400).json({ 
        message: "Message IDs array and message type are required" 
      });
    }

    // Filter out any invalid message IDs and optimistic IDs
    const validMessageIds = messageIds.filter(id => 
      id && typeof id === 'string' && !id.startsWith('temp-') && id.length > 10
    );

    console.log(`Fetching bulk reactions for ${validMessageIds.length} messages`);

    if (validMessageIds.length === 0) {
      return res.status(200).json({ 
        success: true, 
        reactions: {} 
      });
    }

    const reactions = {};
    
    // Build query based on message type
    let query;
    if (messageType === "private") {
      query = { 
        messageId: { $in: validMessageIds }, 
        messageType: "private" 
      };
    } else if (messageType === "group") {
      query = { 
        groupMessageId: { $in: validMessageIds }, 
        messageType: "group" 
      };
    } else {
      return res.status(400).json({ message: "Invalid message type" });
    }

    // Fetch all reactions for the given message IDs
    const allReactions = await MessageReaction.find(query)
      .populate("userId", "fullName profilePic");

    console.log(`Found ${allReactions.length} total reactions`);

    // Group reactions by message ID and then by emoji
    allReactions.forEach(reaction => {
      const messageId = messageType === "private" 
        ? reaction.messageId.toString() 
        : reaction.groupMessageId.toString();

      if (!reactions[messageId]) {
        reactions[messageId] = {};
      }

      if (!reactions[messageId][reaction.emoji]) {
        reactions[messageId][reaction.emoji] = [];
      }

      // Check if user already exists to avoid duplicates
      const userExists = reactions[messageId][reaction.emoji].some(
        user => user._id.toString() === reaction.userId._id.toString()
      );

      if (!userExists) {
        reactions[messageId][reaction.emoji].push({
          _id: reaction.userId._id,
          fullName: reaction.userId.fullName,
          profilePic: reaction.userId.profilePic
        });
      }
    });

    // Ensure all requested message IDs are in the response, even if empty
    validMessageIds.forEach(messageId => {
      if (!reactions[messageId]) {
        reactions[messageId] = {};
      }
    });
    
    console.log(`Returning reactions for ${Object.keys(reactions).length} messages`);
    
    res.status(200).json({ 
      success: true, 
      reactions 
    });
  } catch (error) {
    console.log("Error in getBulkReactions controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};