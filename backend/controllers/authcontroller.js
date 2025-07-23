import User from "../models/User.js";
import admin from "../firebaseAdmin.js";

export const firebaseLogin = async (req, res) => {
  console.log("Firebase login request received");
  const token = req.headers.authorization?.split("Bearer ")[1];
  const { googleAccessToken } = req.body;
  console.log("Google Access Token:", googleAccessToken);
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
    var hasCalendarAccess = false;
    if (user.calendarAccessToken) {
      hasCalendarAccess = true;
    }
    res.status(200).json({ message: "logged in successfully",CalAccess: hasCalendarAccess,});

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
  console.log("Email login request received");
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(400).json({ message: "Token missing" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid } = decoded;

    let user = await User.findOne({ uid });
    if (!user){
      console.log("User not found");
      user = new User({ uid, email: decoded.email });
      // await user.save();
      // return res.status(404).json({ message: "User not found" });
    }

    await user.save();
    // console.log("User found:", user);
    var hasCalendarAccess = false;
    if (user.calendarAccessToken) {
      hasCalendarAccess = true;
    }
    console.log(hasCalendarAccess);
    res.status(200).json({ message: "logged in successfully", CalAccess: hasCalendarAccess,});
  } catch (err) {
    console.error("Token storage error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const storeCalToken = async (req, res) => {
  console.log("Store calendar token request received");
  const token = req.headers.authorization?.split("Bearer ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Missing ID token" });
  }

  try {
    // ✅ Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    const googleAccessToken = req.body.googleAccessToken;
    console.log("Access Token received:", req.body.googleAccessToken);
    const result = await User.updateOne(
      { uid },
      { $set: { calendarAccessToken: googleAccessToken } },
      { upsert: true }
    );

    console.log("MongoDB update result:", result);

    res.status(200).json({ message: "Token stored successfully"});
  } catch (error) {
    console.log("Error storing calendar token:", error);
    console.error("Error storing calendar token:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }

}
