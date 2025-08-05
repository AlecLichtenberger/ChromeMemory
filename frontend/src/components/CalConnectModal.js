import React from "react";
import BackendButton from "./BackendButton";
// import "./CalendarModal.css"; // optional if you want to separate styles



const CalendarModal = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style = {styles.headerText}>Connect Your Google Calendar</h2>
        <p style = {styles.headerText}>We need access to show your calendar events here.</p>
        <BackendButton onClick={onConnect} >Connect Calendar</BackendButton>
        <BackendButton onClick={onClose} className="close-btn" >Maybe Later</BackendButton>
      </div>
    </div>
  );
};
const styles = {
  headerText: {
    color: "#FE7743",
    fontFamily: "'Work Sans', Sans-serif",
  }
}


export default CalendarModal;
