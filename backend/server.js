import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/authroutes.js";
import dotenv from "dotenv";
import cors from "cors";



dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", // your frontend URL
  credentials: true,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true

})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Use your auth routes under /api/auth
app.use("/api/auth", authRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));