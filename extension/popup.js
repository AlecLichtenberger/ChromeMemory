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

    calendarEvents.forEach(event => {
      const div = document.createElement("div");
      div.className = "event";

      const start = event.start.dateTime || event.start.date || "Unknown time";
      div.textContent = `${event.summary || "(No Title)"}\n${new Date(start).toLocaleString()}`;
      container.appendChild(div);
    });
  });
}

