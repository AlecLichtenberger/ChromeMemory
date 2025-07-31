import User from "../models/User.js";
import admin from "../firebaseAdmin.js";
import dotenv from "dotenv";
import { google } from "googleapis";
import { isAsyncFunction } from "util/types";
import { time } from "console";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'http://localhost:5000/api/auth/calendar-store-token' // Redirect URL
);

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

};
function toRFC3339WithOffset(date) {
  const pad = n => String(n).padStart(2, '0');

  // Set to midnight (start of day)
  date.setHours(0, 0, 0, 0);

  // Timezone offset in minutes (e.g., -420 for PDT)
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = pad(Math.floor(absOffset / 60));
  const minutes = pad(absOffset % 60);

  // Format: 2025-07-30T00:00:00-07:00
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00${sign}${hours}:${minutes}`;
}

export const getEvents = async (req, res) => {
  console.log("Get events request received");
  const token = req.headers.authorization?.split("Bearer ")[1];

  
  if (!token) {
    return res.status(401).json({ message: "Missing ID token" });
  }

  try {

    // ✅ Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("1")
    // Fetch user from MongoDB
    const user = await User.findOne({ uid });
    if (!user || !user.calendarAccessToken) {
      return res.status(404).json({ message: "User not found or calendar access not granted" });
    }
    console.log("user found")

    // Here you would typically call Google Calendar API to fetch events using user.calendarAccessToken
    const day1 = new Date();

    const day7 = new Date();
    day7.setDate(day1.getDate() + 6); // Get the date 7 days from now
    const start = toRFC3339WithOffset(day1);
    const end = toRFC3339WithOffset(day7);
    console.log("day1:", day1.getDate());
    console.log("day7:", day7.getDate());
    const eventlists = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${start}&timeMax=${end}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${user.calendarAccessToken}`,
        "Content-Type": "application/json"
      }
    });
    console.log("res:", eventlists);

    // if (!resp.ok) {
    //   console.error("Failed to fetch events:", res.statusText);
    //   return res.status(500).json({ message: "Failed to fetch events from Google Calendar" });
    // }
    const data = await eventlists.json()
    const events = data.items;
    console.log("Events fetched:", events);
    var result = [];
    if (!events || events.length === 0) {
      console.log("No events found for the next 7 days");
      return res.status(200).json({ message: "No events found for the next 7 days", events: [] });
    }
    else if(events.length > 0){
      var i = 0
      var days = [];
      var j = 0;
      var d = new Date();
      d.setDate(day1.getDate());
      while(i<7 ) {
        if (j >= events.length) {
          console.log("Pushing dayss:", d);
          result.push({
            date: d,
            events: days,
          });
          console.log(i);
          i++;
          const newDate = new Date();
          newDate.setDate(d.getDate() + 1); // Move to the next day
          d = newDate;
          days = [];

          continue;
        }
        const event = events[j];
        const save = new Date(event.start.dateTime );
        
        console.log("Current day:", d);
        console.log("Save date:", save.getDate());
        console.log("Day date:", d.getDate());
        if (j<events.length && save.getDate()===d.getDate()) {
          const end = event.end.dateTime;
          days.push({
            id: event.id,
            link: event.htmlLink,
            summary: event.summary,
            start: save,
            end: new Date(end),
            timezone: event.start.timeZone,
          });
          j++;
          
        }
        else{
          console.log("Pushing day:", d);
          result.push({
            date: d,
            events: days,
          });
          console.log(i);
          i++;
          const newDate = new Date();
          newDate.setDate(d.getDate() + 1); // Move to the next day
          d = newDate;
          days = [];
        }
      }
      
    }
    console.log("Events grouped by day:", result);
    

    // For now, we will just return a placeholder response
    res.status(200).json({ message: "Events fetched successfully", events: result });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
export const calConScreen = async (req, res) => {
  console.log("TEST");
  const userId = req.query.userId;
  console.log("User ID for calendar consent:");
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
    state: userId,
  });
  console.log("TEST1");
  res.redirect(url);
  console.log("TEST2");

};

export const calStoreToken = async (req, res) => {
  console.log("TEST3");
  const code = req.query.code;
  const userId = req.query.state;

  if (!code || !userId) {
    return res.status(400).send("Missing code or userId");
  }

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  console.log("Tokens received:", tokens);
  console.log("User ID for storing calendar token:", userId);
  const result  = await User.findOneAndUpdate(
    { uid: userId }, 
    {
      calendarAccessToken: tokens.access_token,
      calendarRefreshToken: tokens.refresh_token,
    }
  );
  // const test  = await User.findOneAndUpdate(
  //   { uid: userId }, 
  //     { $set: { calendarAccessToken: googleAccessToken } },
  //     { upsert: true }
  //   );
  console.log("Saved:", result);




  // Save access & refresh token to DB here

  res.send(`
    <script>
      window.opener.postMessage('calendar-connected', 'http://localhost:3000/home');
      window.close();
    </script>
  `);
}
