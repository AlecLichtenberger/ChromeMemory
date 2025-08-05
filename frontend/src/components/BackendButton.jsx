import React from "react";

export default function BackendButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  style = {},
}) {
    const backendButtonStyle = {
        marginTop: "10px",
        width: "10%",
        padding: "8px",
        backgroundColor: "#273469",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        marginBottom: "15px",
        marginLeft: "10px",
        marginRight: "10px",
        fontFamily: "'Work Sans', sans-serif",
    }

    return(
    <button onClick={onClick} disabled={disabled} style={backendButtonStyle}>
        {}
        {loading ? "Loading..." : children}
    </button>
    );

}