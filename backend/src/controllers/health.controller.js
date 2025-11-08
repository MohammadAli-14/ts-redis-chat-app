import GroupMessage from "../models/GroupMessage.js";
import Group from "../models/Group.js";
import mongoose from "mongoose";

export const checkDatabaseHealth = async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    // Check GroupMessage collection stats
    const messageStats = await GroupMessage.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          groupsWithMessages: { $addToSet: "$groupId" },
          latestMessage: { $max: "$createdAt" }
        }
      }
    ]);

    // Check Group collection stats
    const groupStats = await Group.aggregate([
      {
        $group: {
          _id: null,
          totalGroups: { $sum: 1 },
          activeGroups: { 
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } 
          }
        }
      }
    ]);

    res.status(200).json({
      database: {
        status: dbStates[dbState],
        readyState: dbState
      },
      groupMessages: messageStats[0] || { totalMessages: 0, groupsWithMessages: [] },
      groups: groupStats[0] || { totalGroups: 0, activeGroups: 0 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      error: "Health check failed",
      details: error.message 
    });
  }
};

export const checkGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const messages = await GroupMessage.find({ groupId })
      .select('_id senderId text messageType createdAt')
      .populate('senderId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const messageCount = await GroupMessage.countDocuments({ groupId });

    res.status(200).json({
      groupId,
      totalMessages: messageCount,
      recentMessages: messages,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Group messages check error:', error);
    res.status(500).json({ 
      error: "Failed to check group messages",
      details: error.message 
    });
  }
};