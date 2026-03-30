import mongoose from "mongoose";

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function connectDB(): Promise<void> {
  // Check if already connected
  if (connection.isConnected) {
    console.log("✅ Already connected to database");
    return;
  }

  try {
    // Connect to MongoDB
    const db = await mongoose.connect(process.env.MONGODB_URI || "", {
      dbName: "trip-yojana",
    });

    connection.isConnected = db.connections[0].readyState;

    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

export default connectDB;
