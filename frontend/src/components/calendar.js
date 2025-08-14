// calendar.js
import React, { useEffect, useMemo, useState } from "react";
import BackendButton from "./BackendButton";
import "./calendar.css";

const CalendarWidget = ({ hasCalendarAccess, calConnected, onConnect }) => {
  const [eventsData, setEvents] = useState([]);

  // ----- Timezone & date helpers -----
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";

  // Local YYYY-MM-DD for a JS Date in the chosen timeZone
  const ymdInZone = (date) => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt
      .formatToParts(date)
      .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
    return `${parts.year}-${parts.month}-${parts.day}`; // YYYY-MM-DD
  };

  // Normalize any input (YYYY-MM-DD | ISO string | Date) into a YYYY-MM-DD key
  const normalizeDateKey = (val) => {
    if (!val) return null;
    if (typeof val === "string") {
      // If ISO with time, strip to date; if already YMD, keep it
      const ymd = val.includes("T") ? val.split("T")[0] : val;
      // Basic validity check
      const d = new Date(ymd);
      return isNaN(d) ? null : ymd;
    }
    const d = val instanceof Date ? val : new Date(val);
    return isNaN(d) ? null : ymdInZone(d);
  };

  // Pick a JS Date from various shapes (string | Date | {date} | {dateTime})
  const pickDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === "string") return new Date(val);
    if (val.dateTime) return new Date(val.dateTime);
    if (val.date) return new Date(`${val.date}T00:00:00`);
    return null;
  };

  // All-day according to Google payload
  const isAllDay = (ev) => !!ev.start?.date && !ev.start?.dateTime;

  // Multi-day (either all-day spanning > 1 day, or timed crossing midnight)
  const isMultiDay = (ev) => {
    const start = pickDate(ev.start?.dateTime || ev.start);
    const end = pickDate(ev.end?.dateTime || ev.end);
    if (!start || !end) return false;

    if (isAllDay(ev)) {
      // end.date is EXCLUSIVE → check end-1 day
      const endMinusOne = new Date(end);
      endMinusOne.setDate(endMinusOne.getDate() - 1);
      return ymdInZone(start) !== ymdInZone(endMinusOne);
    }
    return ymdInZone(start) !== ymdInZone(end);
  };

  // Format a date range like "Aug 14–Aug 16" (includes year if different)
  const formatDateRange = (start, end, { includeYearIfDiff = true } = {}) => {
    const dateFmt = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone,
    });
    const yearFmt = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone });

    // For all-day (or when start at midnight), end is exclusive → show end-1
    let endShown = end;
    if (
      start &&
      end &&
      start.getHours() === 0 &&
      start.getMinutes() === 0 &&
      start.getSeconds() === 0
    ) {
      const tmp = new Date(end);
      tmp.setDate(tmp.getDate() - 1);
      endShown = tmp;
    }

    const s = dateFmt.format(start);
    const e = dateFmt.format(endShown || start);

    if (!includeYearIfDiff) return `${s}–${e}`;

    const sy = yearFmt.format(start);
    const ey = yearFmt.format(endShown || start);
    return sy === ey ? `${s}–${e}` : `${s} ${sy}–${e} ${ey}`;
  };

  // Render line under each event title
  const renderEventLine = (ev) => {
    const start = pickDate(ev.start?.dateTime || ev.start);
    const end = pickDate(ev.end?.dateTime || ev.end);

    if (isAllDay(ev)) {
      if (isMultiDay(ev)) return `All day (${formatDateRange(start, end)})`;
      return "All day";
    }

    if (isMultiDay(ev)) {
      return formatDateRange(start, end);
    }

    const timeOpts = { hour: "numeric", minute: "2-digit", timeZone };
    const s = start ? start.toLocaleTimeString([], timeOpts) : "";
    const e = end ? end.toLocaleTimeString([], timeOpts) : "";
    return end ? `${s} – ${e}` : s;
  };

  // ----- Calendar days to render -----
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  // ----- Effects -----
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
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) throw new Error("Failed to fetch events");
      const data = await resp.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  // Build a map of dateKey → day bucket for fast matching
  const dayMap = useMemo(() => {
    const map = new Map();
    for (const entry of eventsData) {
      const key = normalizeDateKey(entry?.date);
      if (key) map.set(key, entry);
    }
    return map;
  }, [eventsData]);

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
        <BackendButton onClick={onConnect}>Connect Calendar</BackendButton>
      </div>

      <div className="calendar-container" style={styles.calendarContainer}>
        {days.map((day, index) => {
          const key = ymdInZone(day);
          const matchingDay = dayMap.get(key);

          return (
            <div key={index} className="day-column" style={styles.dayColumn}>
              <div className="dates" style={styles.dayHeader}>
                {day.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>

              {matchingDay?.events?.length ? (
                <div>
                  {matchingDay.events.map((event, i) => (
                    <div
                      key={i}
                      className={`calendar-event ${isMultiDay(event) ? "multi-day" : ""}`}
                    >
                      <strong className="event-title">{event.summary}</strong>
                      <div className="event-time">{renderEventLine(event)}</div>
                    </div>
                  ))}
                </div>
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




