let selectedDate = new Date(); // Tracks the current date shown

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("load-events");
  const prevBtn = document.getElementById("load-prev-day");
  const nextBtn = document.getElementById("load-next-day");
  const dateElement = document.getElementById("current-date");
  const container = document.getElementById("events");

  if (!button || !container || !dateElement || !prevBtn || !nextBtn) {
    console.error("Missing DOM elements");
    return;
  }

  function updateDateDisplay() {
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const yyyy = selectedDate.getFullYear();
    dateElement.textContent = `${mm}/${dd}/${yyyy}`;
  }

  function triggerFetch() {
    container.textContent = "Loading events...";
    chrome.runtime.sendMessage({
      type: "fetch_events_for_date",
      date: selectedDate.toISOString()
    });
    setTimeout(loadEventsToPopup, 1500);
  }

  prevBtn.addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    updateDateDisplay();
    triggerFetch();
  });

  nextBtn.addEventListener("click", () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    updateDateDisplay();
    triggerFetch();
  });

  button.addEventListener("click", () => {
    triggerFetch();
  });

  updateDateDisplay();
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


