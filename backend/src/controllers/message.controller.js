import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { 
  advancedCache
} from "../lib/advancedCache.js";
import { redisCache } from "../lib/redis.js"; // ADD THIS IMPORT

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Try to get cached contacts first
    const cacheKey = `contacts:${loggedInUserId}`;
    const cachedContacts = await redisCache.get(cacheKey); // FIXED: Use redisCache directly
    
    if (cachedContacts) {
      return res.status(200).json(cachedContacts);
    }

    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // Cache the contacts
    await redisCache.set(cacheKey, filteredUsers, 1800); // FIXED: Use redisCache directly

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Enhanced getMessages with consistent population
export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    // Generate conversation ID for consistent caching
    const conversationId = [myId, userToChatId].sort().join('_');
    
    // Try cache first
    if (page === 1) {
      const cached = await advancedCache.getCachedMessages(conversationId);
      if (cached && cached.messages) {
        return res.status(200).json({
          messages: cached.messages,
          hasMore: cached.messages.length === limit,
          totalCount: cached.count,
          cached: true
        });
      }
    }

    // ✅ FIXED: Enhanced query with proper population
    const [messages, totalCount] = await Promise.all([
      Message.find({
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      })
      .populate("senderId", "fullName profilePic email") // Always populate sender
      .populate("receiverId", "fullName profilePic email") // Always populate receiver
      .select('_id senderId receiverId text image createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      
      Message.countDocuments({
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      })
    ]);

    const result = {
      messages: messages.reverse(),
      hasMore: totalCount > (skip + limit),
      totalCount
    };

    // Cache only first page for fast access
    if (page === 1) {
      await advancedCache.cacheMessages(conversationId, result.messages);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Enhanced sendMessage with consistent population
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    
    // Fast user existence check
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        quality: 'auto',
        fetch_format: 'auto',
        width: 800,
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // ✅ FIXED: Enhanced population to ensure consistent structure
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic email")
      .populate("receiverId", "fullName profilePic email")
      .lean();

    console.log("🔍 Backend - Populated message:", {
      messageId: populatedMessage._id,
      senderId: populatedMessage.senderId,
      receiverId: populatedMessage.receiverId
    });

    // Emit ONLY to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newPrivateMessage", populatedMessage);
      console.log("✅ Message emitted to receiver via socket");
    } else {
      console.log("❌ Receiver not connected via socket");
    }

    // Invalidate cache
    const conversationId = [senderId.toString(), receiverId.toString()].sort().join('_');
    await advancedCache.invalidateConversationCache(conversationId);

    // Return the populated message
    res.status(201).json(populatedMessage);
    
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Try cached chat partners first
    const cacheKey = `chat_partners:${loggedInUserId}`;
    const cachedPartners = await redisCache.get(cacheKey); // FIXED: Use redisCache directly
    
    if (cachedPartners) {
      return res.status(200).json(cachedPartners);
    }

    // find all the messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    // Cache the chat partners
    await redisCache.set(cacheKey, chatPartners, 1800); // FIXED: Use redisCache directly

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New: Bulk messages endpoint for initial load
export const getBulkMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { conversationIds } = req.body;

    if (!conversationIds || !Array.isArray(conversationIds)) {
      return res.status(400).json({ message: "Conversation IDs array required" });
    }

    const conversations = {};

    // Process in parallel with limit
    const batchSize = 5;
    for (let i = 0; i < conversationIds.length; i += batchSize) {
      const batch = conversationIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (conversationId) => {
        const [userId1, userId2] = conversationId.split('_');
        
        // Check cache first
        const cached = await advancedCache.getCachedMessages(conversationId);
        if (cached) {
          return { conversationId, messages: cached.messages };
        }

        // Database fallback
        const messages = await Message.find({
          $or: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 },
          ],
        })
        .populate("senderId", "fullName profilePic email") // Added population
        .populate("receiverId", "fullName profilePic email") // Added population
        .select('_id senderId receiverId text image createdAt')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

        // Cache the result
        await advancedCache.cacheMessages(conversationId, messages);

        return { conversationId, messages };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ conversationId, messages }) => {
        conversations[conversationId] = messages;
      });
    }

    res.status(200).json({ conversations });
  } catch (error) {
    console.error("Error in getBulkMessages: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};