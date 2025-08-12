// calendar.js
import React, { useEffect, useState } from "react";
import BackendButton from "./BackendButton";
import "./calendar.css";

const CalendarWidget = ({ hasCalendarAccess, calConnected, onConnect }) => {
  const [eventsData, setEvents] = useState([]);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (calConnected) fetchEvents();
  }, [calConnected]);

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    if (!token) return console.error("No token found");

    try {
      const resp = await fetch("http://localhost:5000/api/auth/event-fetch", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // 🔧 this was broken before: needs backticks to interpolate
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) throw new Error("Failed to fetch events");
      const data = await resp.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  return (
    <div className="calendar">
      {/* Button row centered */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          margin: "20px 0",
        }}
      >
        <BackendButton onClick={fetchEvents}>Load Events</BackendButton>
        {/* 🔧 Call the real connect handler directly (no modal) */}
        <BackendButton onClick={onConnect}>Connect Calendar</BackendButton>
      </div>

      <div className="calendar-container" style={styles.calendarContainer}>
        {days.map((day, index) => {
          const matchingDay = eventsData.find((entry) => {
            const ev = new Date(entry.date);
            return (
              ev.getFullYear() === day.getFullYear() &&
              ev.getMonth() === day.getMonth() &&
              ev.getDate() === day.getDate()
            );
          });

          return (
            <div key={index} className="day-column" style={styles.dayColumn}>
              <div className="dates" style={styles.dayHeader}>
                {day.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>

              {matchingDay && matchingDay.events.length > 0 ? (
                <ul>
                  {matchingDay.events.map((event, i) => (
                    <li key={i} className="calendar-event">
                      <strong className="event-title">{event.summary}</strong>
                      {event.start?.dateTime && (
                        <div className="event-time">
                          {new Date(event.start.dateTime).toLocaleTimeString()}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: "0.9em", color: "#FE7743" }}>No events</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  calendarContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    height: "500px",
  },
  dayColumn: {
    flex: 1,
    borderLeft: "1px solid #FE7743",
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  dayHeader: {
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center",
  },
};

export default CalendarWidget;


