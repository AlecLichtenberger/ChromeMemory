import React, { useState, useEffect } from "react";
import CalendarModal from "./CalConnectModal";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useLocation } from "react-router-dom";
import { auth } from "../firebase";

const Home = () => {

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasCalendarAccess = localStorage.getItem("hasCalendarAccess") === "true";
    console.log("Has Calendar Access:", hasCalendarAccess);
    setShowModal(!hasCalendarAccess);
  }, []);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
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
      <h1>Welcome to Your Dashboard</h1>
      <CalendarModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default Home;