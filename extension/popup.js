document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("calendarEvents", (data) => {
    const container = document.getElementById("events");
    container.innerHTML = "";

    if (!data.calendarEvents || data.calendarEvents.length === 0) {
      container.innerText = "No events found.";
      return;
    }

    data.calendarEvents.forEach(event => {
      const div = document.createElement("div");
      div.className = "event";
      const start = event.start.dateTime || event.start.date;
      div.textContent = `${event.summary || "(No Title)"}\n${new Date(start).toLocaleString()}`;
      container.appendChild(div);
    });
  });
});
