
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID; // Replace with your OAuth Client ID

function authenticateUser() {
  chrome.identity.launchWebAuthFlow(
    {
      url: `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=https://oauth2.googleapis.com/token&scope=https://www.googleapis.com/auth/calendar.readonly`,
      interactive: true
    },
    function (redirect_url) {
      if (chrome.runtime.lastError || !redirect_url) {
        console.error("Auth failed:", chrome.runtime.lastError);
        return;
      }

      let params = new URLSearchParams(new URL(redirect_url).hash.substring(1));
      let accessToken = params.get("access_token");

      if (accessToken) {
        chrome.storage.local.set({ accessToken }, () => {
          console.log("Access Token saved.");
          fetchCalendarEvents(accessToken);
        });
      }
    }
  );
}
function fetchCalendarEvents(accessToken) {
  fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true", {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
    .then(response => response.json())
    .then(data => {
      chrome.storage.local.set({ calendarEvents: data.items });
    })
    .catch(error => console.error("Error fetching calendar events:", error));
}