import React, {use, useEffect, useState} from "react";
import BackendButton from "./BackendButton";
import './calendar.css';

const CalendarWidget = ({ hasCalendarAccess, calConnected }) => {
  const [eventsData, setEvents] = useState([]);
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });
  console.log("Days:", days);
  useEffect(() => {
    if (calConnected) {
        // Fetch events from the backend
        fetchEvents();
    }
  },[calConnected]);
  
 // This will hold the fetched events

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/event-fetch", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });


      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      const eventsData = data.events || [];
      console.log("Events data:", eventsData);
      setEvents(eventsData);
      // Process and display events as needed
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }
  return (
    <div className="calendar">
      
      <BackendButton onClick={fetchEvents}>Load Events</BackendButton>
      
      <div className="calendar-container" style ={styles.calendarContainer}>
        
        {days.map((day, index) => (
          <div key={index} className="day-column" style={styles.dayColumn}>
            <div className="dates" style={styles.dayHeader}>
              {day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </div>

              {(() => {
                const matchingDay = eventsData.find(eventEntry => {
                  const eventDate = new Date(eventEntry.date);

                  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                  const targetDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                  // console.log(
                  //   "Comparing calendar day:",
                  //   new Date(day).toISOString(),
                  //   "with event day:",
                  //   new Date(eventEntry.date).toISOString()
                  // );
                  if(eventDate.getDate() === day.getDate()){
                    console.log(eventDate, eventEntry.events);
                  }
                  return eventDate.getDate() === day.getDate();
                });

                return matchingDay && matchingDay.events.length > 0 ? (
                  <ul>
                    {matchingDay.events.map((event, i) => (
                      
                      <li key={i} className = "calendar-event">
                        <strong className = "event-title">{event.summary}</strong>
                        {event.start?.dateTime && (
                          <div className = "event-time">
                            {new Date(event.start.dateTime).toLocaleTimeString()}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: "0.9em", color: "#FE7743", }}>No events</p>
                );
              })()}

          </div>
        ))}

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
  
  dayHeader: {
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center",
  },
  events: {
    flexGrow: 1,
  },
  event: {
    backgroundColor: "#f0f0f0",
    margin: "5px 0",
    padding: "5px",
    borderRadius: "4px",
    fontSize: "0.9em",
  }, 
};

export default CalendarWidget;
