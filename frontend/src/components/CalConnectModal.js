import React from "react";
// import "./CalendarModal.css"; // optional if you want to separate styles

const CalendarModal = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Connect Your Google Calendar</h2>
        <p>We need access to show your calendar events here.</p>
        <button onClick={onConnect}>Connect Calendar</button>
        <button onClick={onClose} className="close-btn">Maybe Later</button>
      </div>
    </div>
  );
};

export default CalendarModal;
