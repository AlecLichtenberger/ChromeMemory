// src/components/AuthForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  auth,
  provider,
  signInWithPopup
} from "../firebase";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const AuthForm = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


  
  const handleEmailAuth = async (e) => {
    e.preventDefault();

    try {
      const userCredential = isSignup
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);



      const response = await fetch("http://localhost:5000/api/auth/email-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({  }),
      });
      const data = await response.json();
      alert("Success!");
      if (response.status === 200 && data.CalAccess === true) {
        localStorage.setItem("hasCalendarAccess", "true");
      } else {
        localStorage.setItem("hasCalendarAccess", "false");
      }
      navigate("/home");

    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    const provider = new GoogleAuthProvider();

  // ✅ Add the Google Calendar scope
    provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleAccessToken = credential.accessToken;
      localStorage.setItem("token", token);
      const response = await fetch("http://localhost:5000/api/auth/firebase-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({googleAccessToken}),
      });
      const data = await response.json();
      alert("Google Sign-in success!");
      if (response.status === 200 && data.CalAccess === true) {
        localStorage.setItem("hasCalendarAccess", "true");
        console.log(localStorage["hasCalendarAccess"]);
      } else {
        localStorage.setItem("hasCalendarAccess", "false");
      }
      navigate("/home");

    } catch (err) {
      alert(err.message);
    }
  };

  return (

    <div style={styles.container}>

      <h2 style = {styles.signInText}>{isSignup ? "Sign Up" : "Login"}</h2>
      <form onSubmit={handleEmailAuth} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      <p style = {styles.text}>
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => setIsSignup(!isSignup)}
          style={styles.toggle}
        >
          {isSignup ? "Login" : "Sign Up"}
        </button>
      </p>

      <hr style={{ width: "100%", margin: "20px 0" }} />

      <button onClick={handleGoogleLogin} style={styles.googleButton}>
        Sign in with Google
      </button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "2rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.75rem",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #aaa",
    color:"#FE7743",
  },
  button: {
    padding: "0.75rem",
    fontSize: "1rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    
  },
  googleButton: {
    padding: "0.75rem",
    fontSize: "1rem",
    backgroundColor: "#DB4437",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%",
    
  },
  toggle: {
    background: "none",
    border: "none",
    color: "#007bff",
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "1rem",
  },
  signInText: {
    color:"#FE7743",
    fontFamily: "'Work Sans', Sans-serif",
    
  },
  text:{
    color:"#FE7743",
    fontFamily: "'Work Sans', Sans-serif",
  }


};

export default AuthForm;
