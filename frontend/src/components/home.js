import React, { useState, useEffect, use } from "react";
import CalendarModal from "./CalConnectModal";
import CalendarWidget from "./calendar";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useLocation } from "react-router-dom";
import { auth } from "../firebase";
import './calendar.css';

const Home = () => {

  const [showModal, setShowModal] = useState(true);

  // useEffect(() => {
  //   const hasCalendarAccess = localStorage.getItem("hasCalendarAccess") === "true";
  //   console.log("Has Calendar Access:", hasCalendarAccess);
  //   setShowModal(!hasCalendarAccess);
  // }, []);

  const [isConnecting, setIsConnecting] = useState(false);
  const handleConnect = () => {
    const userId = auth.currentUser.uid;
    
    
    const popup = window.open(
      `http://localhost:5000/api/auth/calendar-consent?userId=${userId}`,
      '_blank',
      'width=500,height=600'
    );

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        // Optionally trigger an event or refetch events
        console.log("Popup closed, maybe refresh calendar data now.");
        setIsConnecting(true);

      }
    }, 500);
    console.log(setIsConnecting);
  };

  const handleConnectCalendar = async () => {
    if (isConnecting) return; // Prevent multiple clicks
    setIsConnecting(true);
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      // Send token to backend to store
      const idToken = await result.user.getIdToken();
      const response  = await fetch("http://localhost:5000/api/auth/store-calendar-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ googleAccessToken: accessToken }),
      });

      if(!response.ok){
        console.log("Failed to store calendar token");
        throw new Error("Failed to store calendar token"); 
      }
      console.log("Successfully stored calendar token");
      alert("Calendar connected!");
      localStorage.setItem("hasCalendarAccess", "true");
      setShowModal(false);
    } catch (error) {
      console.log("Error connecting to Google Calendar:", error);
      setIsConnecting(false);
      alert("Failed to connect: " + error.message);
    } finally {
      setIsConnecting(false);
    }
    
  };

  return (
    
    <div>
      <div class = "top-banner">
        <h1>ChroMemory</h1>
      </div>
      <h1 style={styles.headerText}>Welcome to Your Dashboard</h1>
      <CalendarModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
      <div className="w-full overflow-x-auto mt-4 px-4">
        <CalendarWidget 
          hasCalendarAccess={localStorage.getItem("hasCalendarAccess") === "true"}
          calConnected={isConnecting}
        />
      </div>
    </div>
  );
};

const styles = {
  headerText: {
    color: "#FE7743",
    fontFamily: "'Work Sans', Sans-serif",
    display: "flex",
    placeItems: "center",
  /* Optional: Add width and height for better control */
    
    height: "200px",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "-50px",
    
  },

  
  
}

export default Home;