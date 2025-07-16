document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("load-events");
  const container = document.getElementById("events");

  if (!button || !container) {
    console.error("Missing DOM elements");
    return;
  }

  button.addEventListener("click", () => {
    container.textContent = "Loading events...";
    chrome.runtime.sendMessage({ type: "fetch_events" });

    // Load events after a short delay
    setTimeout(loadEventsToPopup, 1500);
  });

  // Optional: auto-load cached events on open
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

    calendarEvents.forEach(event => {
      const card = document.createElement("div");
      card.className = "event-card";

      const title = document.createElement("div");
      title.className = "event-title";
      title.textContent = event.summary || "(No Title)";

      const start = event.start.dateTime || event.start.date || "Unknown time";
      const time = document.createElement("div");
      time.className = "event-time";
      time.textContent = new Date(start).toLocaleString();

      card.appendChild(title);
      card.appendChild(time);
      container.appendChild(card);
    });
  });
}



