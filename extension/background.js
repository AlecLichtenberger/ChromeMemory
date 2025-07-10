function authenticateAndFetchEvents() {
  const CLIENT_ID = chrome.runtime.getManifest().oauth2.client_id;
  const redirectUri = chrome.identity.getRedirectURL();

  const authUrl =
    `https://accounts.google.com/o/oauth2/auth` +
    `?client_id=${CLIENT_ID}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')}`;

  console.log("Launching OAuth flow:", authUrl);

  chrome.identity.launchWebAuthFlow(
    {
      url: authUrl,
      interactive: true
    },
    function (redirect_url) {
      if (chrome.runtime.lastError || !redirect_url) {
        console.error("Auth failed:", chrome.runtime.lastError?.message || chrome.runtime.lastError);
        return;
      }

      console.log("OAuth completed. Redirect URL:", redirect_url);
      const params = new URLSearchParams(new URL(redirect_url).hash.substring(1));
      const accessToken = params.get("access_token");

      if (!accessToken) {
        console.error("No access token found in redirect URL.");
        return;
      }

      chrome.storage.local.set({ accessToken }, () => {
        console.log("Access token stored.");
        fetchEventList(accessToken);
      });
    }
  );
}

function fetchEventList(accessToken) {
  console.log("Fetching calendar events with token:", accessToken);

  fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      console.log("Fetched events:", data.items);
      chrome.storage.local.set({ calendarEvents: data.items }, () => {
        console.log("Events saved to local storage.");
      });
    })
    .catch(err => console.error("Error fetching events:", err));
}

// 🔁 Listen for requests from the popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Received message:", msg);

  if (msg.type === "fetch_events") {
    chrome.storage.local.get("accessToken", ({ accessToken }) => {
      if (accessToken) {
        console.log("Token found, fetching events...");
        fetchEventList(accessToken);
      } else {
        console.log("No token found, starting OAuth flow...");
        authenticateAndFetchEvents();
      }
    });
  }
});