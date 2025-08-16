import React, { useState } from "react";
import "./BackendButton.css";

export default function BackendButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  style = {},
  className = "",
  pressDurationMs = 200, // how long the "pressed" state lasts after click
}) {
  const [pressed, setPressed] = useState(false);

  const handleClick = async (e) => {
    if (disabled || loading) return;
    setPressed(true);
    try {
      await onClick?.(e);
    } finally {
      // keep the "pressed" visual briefly after click to make it feel responsive
      setTimeout(() => setPressed(false), pressDurationMs);
    }
  };

  const backendButtonStyle = {
    marginTop: "10px",
    width: "10%",
    padding: "8px",
    backgroundColor: pressed ? "#1e2954" : "#273469", // pressed color
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    marginBottom: "15px",
    marginLeft: "10px",
    marginRight: "10px",
    fontFamily: "'Work Sans', sans-serif",
    placeItems: "center",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: pressed
      ? "0 1px 4px rgba(0, 0, 0, 0.2)"
      : "0 2px 8px rgba(0, 0, 0, 0.15)",
    borderLeft: "1px solid #FE7743",
    borderBottom: "1px solid #FE7743",
    transform: pressed ? "scale(0.97)" : "scale(1)",
    transition: "transform 0.12s ease, background-color 0.2s ease, box-shadow 0.2s ease",
    ...style,
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`backend-button ${className}`}
      style={backendButtonStyle}
      aria-busy={loading ? "true" : undefined}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}