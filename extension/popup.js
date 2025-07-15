document.addEventListener("DOMContentLoaded", () => {
  const dateElement = document.getElementById("current-date");
  const now = new Date();
  dateElement.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });


  const button = document.getElementById("load-events");
  const container = document.getElementById("events");

  if (!button || !container) {
    console.error("Missing DOM elements");
    return;
  }

  button.addEventListener("click", () => {
    container.textContent = "Loading events...";
    chrome.runtime.sendMessage({ type: "fetch_events" });

    // Try loading after a short delay
    setTimeout(loadEventsToPopup, 1500);
  });

  // Optional: auto-load if events are cached
  loadEventsToPopup();
});

function loadEventsToPopup() {
  chrome.storage.local.get("calendarEvents", ({ calendarEvents }) => {
    const container = document.getElementById("events");
    container.innerHTML = "";

    if (!calendarEvents || calendarEvents.length === 0) {
      container.textContent = "No events found.";
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfTomorrow = startOfToday + 24 * 60 * 60 * 1000;

    const todayEvents = [];
    const otherEvents = [];

    calendarEvents.forEach(event => {
      const startStr = event.start?.dateTime || event.start?.date;
      if (!startStr) return;

      const eventTime = new Date(startStr).getTime();
      if (eventTime >= startOfToday && eventTime < startOfTomorrow) {
        todayEvents.push(event);
      } else {
        otherEvents.push(event);
      }
    });

    const renderEventList = (title, list) => {
      if (list.length === 0) return;

      const sectionHeader = document.createElement("h3");
      sectionHeader.textContent = title;
      container.appendChild(sectionHeader);

      list.forEach(event => {
        const div = document.createElement("div");
        div.className = "event";
        const start = event.start.dateTime || event.start.date || "Unknown time";
        div.textContent = `${event.summary || "(No Title)"}\n${new Date(start).toLocaleString()}`;
        container.appendChild(div);
      });
    };

    // Show today's events first
    renderEventList("Today's Events", todayEvents);
    renderEventList("Upcoming Events", otherEvents);
  });
}

