import User from "../models/User.js";
import admin from "../firebaseAdmin.js";

export const firebaseLogin = async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  const { googleAccessToken } = req.body;

  if (!token) return res.status(401).json({ message: "No auth token provided" });

  try {
    // 1. Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decoded;


    // 2. Check if user exists in MongoDB
    let user = await User.findOne({ uid });
    if (!user) {
      // 3. If not, create a new user
      user = new User({
        uid,
        email,
        name,
        calendarAccessToken: googleAccessToken, // Store Google access token if provided
      });
    }
    else {
        // 4. If user exists, update calendar access token if provided
        if (googleAccessToken) {
            user.calendarAccessToken = googleAccessToken;
        }
    }

    await user.save();
    res.status(200).json({ message: "Login successful", user });

  }
  catch (error) {
    console.error("Firebase login error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }



  // Extract token, verify with Firebase Admin

  // Check/create user in MongoDB
  // Send response to client
};
// POST /api/auth/store-calendar-token (for email/password users)
export const emailLogin = async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid } = decoded;

    let user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.save();

    res.status(200).json({ message: "Calendar token stored successfully" }, user);
  } catch (err) {
    console.error("Token storage error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
