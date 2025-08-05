import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/home.js"; // example
import AuthForm from "./components/AuthForm"; // adjust path as needed
import Calendar from "./components/calendar"; // example


function App() {
  
  return (
    
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route path="/home" element={<Home />} />
      <Route path="/calendar" element={<Calendar />} />
    </Routes>
  );
}

export default App;