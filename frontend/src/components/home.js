import React, { useState } from "react";
import CalendarModal from "./CalConnectModal";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useLocation } from "react-router-dom";
import { auth } from "../firebase";

const Home = () => {
  
  const location = useLocation();
  const calendarConnected = location.state?.calendarConnected ?? false;
  const [showModal, setShowModal] = useState(!calendarConnected);


  const handleConnect = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      // Send token to backend to store
      const idToken = await result.user.getIdToken();
      await fetch("http://localhost:5000/api/auth/store-calendar-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ googleAccessToken: accessToken }),
      });

      alert("Calendar connected!");
      setShowModal(false);
    } catch (error) {
      alert("Failed to connect: " + error.message);
    }
  };

  return (
    <div>
      <h1>Welcome to Your Dashboard</h1>
      <CalendarModal
        isOpen={showModal}
        // onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default Home;