function createCalendarWidget(events) {
  let container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.width = "300px";
  container.style.background = "white";
  container.style.padding = "10px";
  container.style.border = "1px solid black";

  let title = document.createElement("h3");
  title.innerText = "Upcoming Events";
  container.appendChild(title);

  events.forEach(event => {
    let eventDiv = document.createElement("div");
    eventDiv.innerText = `${event.summary} - ${new Date(event.start.dateTime).toLocaleString()}`;
    container.appendChild(eventDiv);
  });

  document.body.appendChild(container);
}

// Get stored calendar events and display them
chrome.storage.local.get(["calendarEvents"], (data) => {
  if (data.calendarEvents) {
    createCalendarWidget(data.calendarEvents);
  }
});
