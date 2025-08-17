import React, { useState } from "react";
import CalendarWidget from "./calendar";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import "./calendar.css";

const Home = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleConnect = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const popup = window.open(
      `http://localhost:5000/api/auth/calendar-consent?userId=${userId}`,
      "_blank",
      "width=500,height=600"
    );

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        setIsConnecting(true);
      }
    }, 500);
  };

  const handleConnectCalendar = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      const idToken = await result.user.getIdToken();
      const response = await fetch("http://localhost:5000/api/auth/store-calendar-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ googleAccessToken: accessToken }),
      });

      if (!response.ok) throw new Error("Failed to store calendar token");

      
      localStorage.setItem("hasCalendarAccess", "true");
    } catch (error) {
      console.log("Error connecting to Google Calendar:", error);
      alert("Failed to connect: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // 🔑 Sign out handler
  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (_) {
      // ignore
    }
    // Clear any local tokens/flags your app uses
    localStorage.removeItem("token");
    localStorage.removeItem("hasCalendarAccess");
    // Go to login/home or just reload
    window.location.href = "/"; // or window.location.reload();
  };

  return (
    <div>
      {/* Top banner with title + settings */}
      <div className="top-banner" style={styles.banner}>
        <h1 style={{ margin: 0 }}>ChroMemory</h1>

        <div style={{ position: "relative" }}>
          {/* Settings (gear) button — using inline SVG (no extra package) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={styles.iconBtn}
            aria-label="Open settings"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 2.7l.06.06A1.65 1.65 0 0 0 8.92 3a1.65 1.65 0 0 0 1-1.51V1a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 21.3 7.04l-.06.06c-.46.46-.6 1.14-.33 1.82.2.51.77.84 1.39.84H23a2 2 0 1 1 0 4h-.09c-.62 0-1.19.33-1.51 1z"></path>
            </svg>
          </button>

          {menuOpen && (
            <div style={styles.menu}>
              <button style={styles.menuItem} onClick={handleSignOut}>
                Sign out
              </button>
              {/* Add more items here e.g. Profile, Settings page, etc. */}
            </div>
          )}
        </div>
      </div>

      <h1 style={styles.headerText}>Welcome to Your Dashboard</h1>

      <CalendarWidget
        hasCalendarAccess={localStorage.getItem("hasCalendarAccess") === "true"}
        calConnected={isConnecting}
        onConnect={handleConnect}
      />
    </div>
  );
};

const styles = {
  banner: {
    backgroundColor: "#273469",
    color: "white",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    background: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer",
  padding: 6,
  borderRadius: 6,
  marginRight: "25px", // ⬅ moves gear left
  },
  menu: {
    position: "absolute",
    top: "100%",
    right: "-100px",
    background: "white",
    color: "#273469",
    borderRadius: 6,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    minWidth: 140,
    zIndex: 1000,
    overflow: "hidden",
    marginRight: "50px",
  },
  menuItem: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "'Work Sans', sans-serif",
  },
  headerText: {
    color: "#FE7743",
    fontFamily: "'Work Sans', Sans-serif",
    display: "flex",
    height: "200px",
    placeItems: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "50px",
    marginBottom: "-75px",
  },
};

export default Home;
