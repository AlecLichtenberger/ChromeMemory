import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/home.js"; // example
import AuthForm from "./components/AuthForm"; // adjust path as needed

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthForm />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;