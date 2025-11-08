import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set");
    
    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 100, // Increased from 50
      minPoolSize: 20,  // Increased from 10
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
      // Add retry logic
      retryWrites: true,
      retryReads: true,
    });

    console.log("MONGODB CONNECTED:", conn.connection.host);
    
    // Monitor connection health
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error("Error connecting to MONGODB:", error);
    process.exit(1);
  }
};