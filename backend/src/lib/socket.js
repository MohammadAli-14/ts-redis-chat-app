// backend/src/lib/socket.js - ENHANCED WITH BETTER GROUP ROOM MANAGEMENT
import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Group from "../models/Group.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

// Enhanced user socket management
const userSocketMap = {};

// Enhanced getReceiverSocketId with debugging
const getReceiverSocketId = (userId) => {
  const socketId = userSocketMap[userId];
  console.log(`🔍 Looking up socket for user ${userId}:`, socketId);
  return socketId || null;
};

const setUserSocketId = (userId, socketId) => {
  userSocketMap[userId] = socketId;
};

const removeUserSocketId = (userId) => {
  delete userSocketMap[userId];
};

const getOnlineUsers = () => {
  return Object.keys(userSocketMap);
};

// Apply authentication middleware
io.use(socketAuthMiddleware);

// Enhanced socket connection with better group room management
io.on("connection", (socket) => {
  try {
    const userId = socket.userId;
    if (!userId) {
      console.warn("❌ Connected socket missing userId — disconnecting");
      socket.disconnect(true);
      return;
    }

    console.log("✅ User connected:", socket.user?.fullName, "User ID:", userId, "Socket ID:", socket.id);

    // Save mapping
    setUserSocketId(userId, socket.id);

    // Join personal room
    socket.join(userId);
    console.log(`✅ User ${userId} joined personal room: ${userId}`);

    // Get online users and broadcast
    const updateOnlineUsers = () => {
      try {
        const onlineUsers = getOnlineUsers();
        io.emit("getOnlineUsers", onlineUsers);
        console.log("👥 Online users updated:", onlineUsers);
      } catch (error) {
        console.error('❌ Error updating online users:', error);
      }
    };

    updateOnlineUsers();

    // Enhanced message debugging
    socket.on("newPrivateMessage", (data) => {
      console.log("🔍 Raw socket message received from client:", data);
    });

    // ✅ FIXED: Enhanced group room joining with proper error handling
    socket.on("joinGroup", async (groupId) => {
      if (!groupId) return;
      
      try {
        const roomName = `group_${groupId}`;
        
        // Check if user is member of the group
        const group = await Group.findOne({
          _id: groupId,
          "members.user": userId,
          isActive: true,
        });

        if (!group) {
          console.log(`❌ User ${userId} tried to join group ${groupId} but is not a member`);
          return;
        }

        socket.join(roomName);
        console.log(`✅ User ${socket.user?.fullName} joined group room: ${roomName}`);
        
        // Debug: List rooms
        console.log(`🏠 Socket ${socket.id} is in rooms:`, Array.from(socket.rooms));
      } catch (error) {
        console.error('Error joining group room:', error);
      }
    });

    socket.on("leaveGroup", (groupId) => {
      if (!groupId) return;
      const roomName = `group_${groupId}`;
      socket.leave(roomName);
      console.log(`✅ User ${socket.user?.fullName} left group room: ${roomName}`);
    });

    // FIXED: Handle private message events properly
    socket.on("sendPrivateMessage", (data) => {
      console.log("🔐 Private message received via socket:", data);
      const { receiverId, message } = data;
      
      // Emit to the receiver's personal room
      socket.to(receiverId).emit("newPrivateMessage", message);
      console.log(`✉️ Message forwarded to user ${receiverId}`);
    });

    // Handle typing indicators for private chats
    socket.on("privateTyping", (data) => {
      const { receiverId, isTyping } = data;
      socket.to(receiverId).emit("userTyping", {
        userId,
        isTyping,
        fullName: socket.user?.fullName
      });
    });

    // Handle group message events
    socket.on("sendGroupMessage", (data) => {
      const { groupId, message } = data;
      socket.to(`group_${groupId}`).emit("newGroupMessage", message);
    });

    // ✅ FIXED: Enhanced reaction event forwarding
    socket.on("messageReactionAdded", (data) => {
      console.log("🔍 Reaction added via socket:", data);
      
      if (data.messageType === 'group' && data.reaction?.groupId) {
        const roomName = `group_${data.reaction.groupId}`;
        socket.to(roomName).emit("messageReactionAdded", data);
        console.log(`✅ Forwarded reaction to group room: ${roomName}`);
      }
    });

    socket.on("messageReactionRemoved", (data) => {
      console.log("🔍 Reaction removed via socket:", data);
      
      if (data.messageType === 'group' && data.groupId) {
        const roomName = `group_${data.groupId}`;
        socket.to(roomName).emit("messageReactionRemoved", data);
        console.log(`✅ Forwarded reaction removal to group room: ${roomName}`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 User disconnected:", socket.user?.fullName, "reason:", reason);
      removeUserSocketId(userId);
      updateOnlineUsers();
    });

  } catch (err) {
    console.error("❌ Error during socket connection handling:", err);
  }
});

export { io, app, server, getReceiverSocketId };