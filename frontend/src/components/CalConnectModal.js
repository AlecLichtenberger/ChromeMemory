import React from "react";
import BackendButton from "./BackendButton";
// import "./CalendarModal.css"; // optional if you want to separate styles



const CalendarModal = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <BackendButton onClick={onConnect} >Connect Calendar</BackendButton>
        
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
