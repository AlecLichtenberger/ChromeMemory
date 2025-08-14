// controllers/authController.js
import User from "../models/User.js";
import admin from "../firebaseAdmin.js";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:5000/api/auth/calendar-store-token";

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  REDIRECT_URI
);

// ---------- helpers ----------
function toRFC3339WithOffset(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = new Date(date); // don't mutate caller
  d.setHours(0, 0, 0, 0);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hh = pad(Math.floor(abs / 60));
  const mm = pad(abs % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T00:00:00${sign}${hh}:${mm}`;
}

// local YYYY-MM-DD (prevents timezone drift when serialized)
function fmtYMDLocal(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------- auth flows ----------
export const firebaseLogin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ message: "No auth token provided" });

    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decoded;

    let user = await User.findOne({ uid });
    const googleAccessToken = req.body.googleAccessToken;

    if (!user) {
      user = new User({
        uid,
        email,
        name,
        ...(googleAccessToken ? { calendarAccessToken: googleAccessToken } : {}),
      });
    } else if (googleAccessToken) {
      user.calendarAccessToken = googleAccessToken;
    }

    await user.save();
    const hasCalendarAccess = Boolean(
      user.calendarAccessToken || user.calendarRefreshToken
    );
    res
      .status(200)
      .json({ message: "logged in successfully", CalAccess: hasCalendarAccess });
  } catch (error) {
    console.error("Firebase login error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const emailLogin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(400).json({ message: "Token missing" });

    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email } = decoded;

    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({ uid, email });
    }
    await user.save();

    const hasCalendarAccess = Boolean(
      user.calendarAccessToken || user.calendarRefreshToken
    );
    res
      .status(200)
      .json({ message: "logged in successfully", CalAccess: hasCalendarAccess });
  } catch (err) {
    console.error("Email login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Store an access token from a client-initiated flow (optional path)
export const storeCalToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ message: "Missing ID token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const googleAccessToken = req.body.googleAccessToken;
    if (!googleAccessToken)
      return res.status(400).json({ message: "googleAccessToken missing" });

    await User.updateOne(
      { uid },
      { $set: { calendarAccessToken: googleAccessToken } },
      { upsert: true }
    );

    res.status(200).json({ message: "Token stored successfully" });
  } catch (error) {
    console.error("Error storing calendar token:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ---------- OAuth screens ----------
export const calConScreen = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).send("Missing userId");
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline", // needed for refresh_token
      prompt: "consent", // ensure refresh_token on first grant
      scope: ["https://www.googleapis.com/auth/calendar.readonly"],
      state: userId,
    });
    res.redirect(url);
  } catch (e) {
    console.error(e);
    res.status(500).send("Auth init failed");
  }
};

export const calStoreToken = async (req, res) => {
  try {
    const code = req.query.code;
    const userId = req.query.state;
    if (!code || !userId) return res.status(400).send("Missing code or userId");

    const { tokens } = await oauth2Client.getToken(code);
    // tokens => { access_token, refresh_token?, expiry_date, scope, token_type }
    oauth2Client.setCredentials(tokens);

    const update = {
      calendarAccessToken: tokens.access_token,
    };
    // Only set refresh token if present (Google may omit it on later consents)
    if (tokens.refresh_token) {
      update.calendarRefreshToken = tokens.refresh_token;
    }

    await User.findOneAndUpdate({ uid: userId }, { $set: update }, { new: true, upsert: true });

    // return to the app and close popup
    res.send(`
      <script>
        window.opener.postMessage('calendar-connected', 'http://localhost:3000/home');
        window.close();
      </script>
    `);
  } catch (e) {
    console.error("calStoreToken error:", e);
    res.status(500).send("Failed to store tokens");
  }
};

// ---------- Calendar events (auto refresh using refresh_token) ----------
export const getEvents = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ message: "Missing ID token" });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const user = await User.findOne({ uid });
    if (!user || !user.calendarRefreshToken) {
      return res
        .status(404)
        .json({ message: "User not found or calendar access not granted" });
    }

    // Build a new client with the stored refresh token
    const client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      REDIRECT_URI
    );
    client.setCredentials({ refresh_token: user.calendarRefreshToken });

    // (Optional) get a fresh access token and persist it
    const { token: freshAccessToken } = await client.getAccessToken();
    if (freshAccessToken && freshAccessToken !== user.calendarAccessToken) {
      await User.updateOne(
        { uid },
        { $set: { calendarAccessToken: freshAccessToken } }
      );
    }

    const calendar = google.calendar({ version: "v3", auth: client });

    const day1 = new Date();
    const day7 = new Date(day1);
    day7.setDate(day1.getDate() + 6);

    const timeMin = toRFC3339WithOffset(day1);
    const timeMax = toRFC3339WithOffset(day7);

    const { data } = await calendar.events.list({
      calendarId: "primary",
      singleEvents: true,
      orderBy: "startTime",
      timeMin,
      timeMax,
    });

    const items = data.items || [];
    if (!items.length) {
      return res.status(200).json({
        message: "No events found for the next 7 days",
        events: [],
      });
    }

    // Group by day (send date as local YYYY-MM-DD)
    const result = [];
    let d = new Date(day1);

    for (let i = 0; i < 7; i++) {
      const dayYmd = fmtYMDLocal(d);

      // Match by start day (simple approach).
      // If you want to expand multi-day/all-day across all covered days,
      // do it here by iterating from start..(end-1) and including each day.
      const dayEvents = items.filter((ev) => {
        const startRaw = ev.start?.dateTime || ev.start?.date;
        if (!startRaw) return false;
        const start = new Date(startRaw);
        return fmtYMDLocal(start) === dayYmd;
      });

      result.push({
        date: dayYmd, // <<<<<<<<<<<<<<<<<<<<<< key change (string, not Date)
        events: dayEvents.map((ev) => {
          const start = ev.start?.dateTime || ev.start?.date || null;
          const end = ev.end?.dateTime || ev.end?.date || null;
          return {
            id: ev.id,
            link: ev.htmlLink,
            summary: ev.summary,
            start, // keep as string; parse on client if needed
            end,   // keep as string
            timezone: ev.start?.timeZone || ev.end?.timeZone || null,
            allDay: Boolean(ev.start?.date && !ev.start?.dateTime),
          };
        }),
      });

      // advance one day
      const nd = new Date(d);
      nd.setDate(d.getDate() + 1);
      d = nd;
    }

    res
      .status(200)
      .json({ message: "Events fetched successfully", events: result });
  } catch (error) {
    console.error("Error fetching events:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

