// backend/src/controllers/groupMessage.controller.js - UPDATED WITH DUPLICATE PREVENTION
import GroupMessage from "../models/GroupMessage.js";
import Group from "../models/Group.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";
import { 
  cacheGroupMessages, 
  getCachedGroupMessages, 
  invalidateGroupMessageCache 
} from "../lib/cache.js";

/**
 * Send a message to a group - ENHANCED WITH DUPLICATE PREVENTION
 */
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image, file, fileName: customFileName, fileType, clientMessageId } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    console.log('=== GROUP MESSAGE REQUEST ===');
    console.log('Client Message ID:', clientMessageId);
    console.log('Group ID:', groupId);
    console.log('Sender ID:', senderId);

    // Enhanced validation
    if (!text && !image && !file) {
      return res.status(400).json({ message: "Text, image, or file is required for group messages." });
    }

    // Check if group exists and user is a member
    const group = await Group.findOne({
      _id: groupId,
      "members.user": senderId,
      isActive: true,
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found or you are not a member." });
    }

    let imageUrl;
    let fileUrl;
    let fileName;
    let fileSize;
    let uploadedFileType;

    // Upload image if provided
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: "image",
          quality: "auto",
          fetch_format: "auto",
        });
        imageUrl = uploadResponse.secure_url;
      } catch (err) {
        return res.status(500).json({ 
          message: `Failed to upload image: ${err.message}` 
        });
      }
    }

    // Upload file if provided
    if (file) {
      try {
        const base64Data = file.replace(/^data:.*?;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        let resourceType = "raw";
        const detectedFileType = fileType || customFileName || "";
        
        if (detectedFileType.includes('video') || detectedFileType.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
          resourceType = "video";
        } else if (detectedFileType.includes('image')) {
          resourceType = "image";
        }

        const dataUri = `data:application/octet-stream;base64,${base64Data}`;
        const uploadOptions = { resource_type: resourceType };

        if (resourceType === "raw") {
          uploadOptions.folder = "documents";
        } else if (resourceType === "video") {
          uploadOptions.folder = "videos";
          uploadOptions.chunk_size = 6000000;
        }

        const uploadResponse = await cloudinary.uploader.upload(dataUri, uploadOptions);
        
        fileUrl = uploadResponse.secure_url;
        fileName = customFileName || uploadResponse.original_filename;
        fileSize = uploadResponse.bytes;
        uploadedFileType = resourceType;
      } catch (err) {
        return res.status(500).json({ 
          message: `Failed to upload file: ${err.message}` 
        });
      }
    }

    // Determine message type
    let messageType = "text";
    if (imageUrl) {
      messageType = "image";
    } else if (fileUrl) {
      messageType = uploadedFileType === "video" ? "video" : "file";
    }

    // Create and save message
    const newMessage = new GroupMessage({
      groupId,
      senderId,
      text: text || "",
      image: imageUrl || undefined,
      file: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      fileType: uploadedFileType || undefined,
      messageType,
      clientMessageId, // Store client ID to prevent duplicates
    });

    await newMessage.save();

    // ✅ FIXED: Enhanced population with reactions
    const populatedMessage = await GroupMessage.findById(newMessage._id)
      .populate("senderId", "fullName profilePic email")
      .lean();

    // Add empty reactions object for consistency
    populatedMessage.reactions = {};

    // ✅ FIXED: Enhanced cache invalidation
    await invalidateGroupMessageCache(groupId);

    console.log('✅ Message saved and populated:', populatedMessage._id);

    // ✅ FIXED: Enhanced socket emission with proper room handling
    const roomName = `group_${groupId}`;
    
    // Emit to all group members EXCEPT the sender
    group.members.forEach((member) => {
      if (member.user.toString() !== senderId.toString()) {
        const socketId = getReceiverSocketId(member.user.toString());
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", populatedMessage);
        }
      }
    });

    // ✅ FIXED: Send response with clientMessageId for frontend matching
    res.status(201).json({
      ...populatedMessage,
      clientMessageId, // Include in response for frontend matching
    });

  } catch (error) {
    console.error("❌ Critical error in sendGroupMessage controller: ", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    console.log('🔍 Fetching group messages for:', { groupId, userId, page, limit });

    // Check cache first
    const cacheKey = `group_messages:${groupId}:page_${page}`;
    const cachedMessages = await getCachedGroupMessages(cacheKey);
    
    if (cachedMessages) {
      console.log('✅ Returning cached group messages');
      return res.status(200).json(cachedMessages);
    }

    // Check if user is a member of the group
    const group = await Group.findOne({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    }).select('_id name');

    if (!group) {
      console.log('❌ Group access denied for user:', userId);
      return res.status(404).json({ message: "Group not found or access denied." });
    }

    const skip = (page - 1) * limit;
    
    console.log('📂 Querying database for group messages...');
    
    // ✅ FIXED: Enhanced database query with better population
    const [messages, totalCount] = await Promise.all([
      GroupMessage.find({ groupId })
        .select('_id senderId text image file fileName fileType fileSize messageType systemMessage createdAt')
        .populate("senderId", "fullName profilePic email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      
      GroupMessage.countDocuments({ groupId })
    ]);

    console.log(`✅ Found ${messages.length} messages, total: ${totalCount}`);

    // ✅ FIXED: Ensure messages are properly formatted
    const formattedMessages = messages.map(msg => ({
      ...msg,
      text: msg.text || "", // Ensure text is never null
      reactions: msg.reactions || {}
    })).reverse();

    const result = {
      messages: formattedMessages,
      hasMore: totalCount > (skip + limit),
      totalCount
    };

    // Cache the result with error handling
    try {
      await cacheGroupMessages(cacheKey, result, 900); // 15 minutes
      console.log('✅ Group messages cached successfully');
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error in getGroupMessages controller: ", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

export const getGroupChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Try cached groups first
    const cacheKey = `user_groups:${loggedInUserId}`;
    const cachedGroups = await getCachedGroupMessages(cacheKey);
    
    if (cachedGroups) {
      return res.status(200).json(cachedGroups);
    }

    // Find all groups where user is a member
    const groups = await Group.find({
      "members.user": loggedInUserId,
      isActive: true,
    })
      .populate("admin", "fullName profilePic email")
      .populate("members.user", "fullName profilePic email")
      .sort({ updatedAt: -1 });

    // Cache the groups
    await cacheGroupMessages(cacheKey, groups, 1800); // 30 minutes

    return res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getGroupChatPartners: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessagesOptimized = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    // Cache key with user context for personalized caching
    const cacheKey = `group:${groupId}:user:${userId}:messages`;

    // Try cache first for page 1
    if (page === 1) {
      const cachedMessages = await getCachedGroupMessages(cacheKey);
      if (cachedMessages) {
        return res.status(200).json({
          ...cachedMessages,
          cached: true
        });
      }
    }

    // Fast membership check
    const isMember = await Group.exists({
      _id: groupId,
      "members.user": userId,
      isActive: true,
    });

    if (!isMember) {
      return res.status(404).json({ message: "Group not found or access denied." });
    }

    const skip = (page - 1) * limit;
    
    // Parallel execution with optimized queries
    const [messages, totalCount] = await Promise.all([
      GroupMessage.find({ groupId })
        .select('_id senderId text image file fileName fileType messageType systemMessage createdAt')
        .populate("senderId", "fullName profilePic email") // Keep population but limit fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // Crucial for performance
      
      GroupMessage.countDocuments({ groupId })
    ]);

    const result = {
      messages: messages.reverse(),
      hasMore: totalCount > (skip + limit),
      totalCount
    };

    // Cache only first page
    if (page === 1) {
      await cacheGroupMessages(cacheKey, result, 900); // 15 minutes
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getGroupMessagesOptimized: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};