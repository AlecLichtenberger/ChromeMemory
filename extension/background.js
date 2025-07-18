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
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
              `?maxResults=25` +
              `&orderBy=startTime` +
              `&singleEvents=true` +
              `&timeMin=${encodeURIComponent(timeMin)}` +
              `&timeMax=${encodeURIComponent(timeMax)}`;

  console.log("Fetching calendar events from:", url);

  fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (!data || !Array.isArray(data.items)) {
        console.error("Unexpected response from Google Calendar API:", JSON.stringify(data, null, 2));
        return;
      }

      console.log("Fetched events:", data.items);
      chrome.storage.local.set({ calendarEvents: data.items }, () => {
        console.log("Events stored to local storage.");
      });
    })
    .catch(err => console.error("Error fetching events:", err));
}


// 🔁 Always re-authenticate when fetch_events is received
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "fetch_events") {
    console.log("Forcing re-authentication...");
    authenticateAndFetchEvents(); // <--- always starts new OAuth flow
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "fetch_events_for_date" && msg.date) {
    const date = new Date(msg.date);
    const timeMin = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const timeMax = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

    chrome.storage.local.get("accessToken", ({ accessToken }) => {
      if (!accessToken) {
        console.log("No access token, re-authenticating...");
        authenticateAndFetchEvents();
        return;
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
                  `?maxResults=25` +
                  `&orderBy=startTime` +
                  `&singleEvents=true` +
                  `&timeMin=${encodeURIComponent(timeMin)}` +
                  `&timeMax=${encodeURIComponent(timeMax)}`;

      fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => {
          if (res.status === 401) {
            console.warn("Token expired or invalid. Re-authenticating...");
            authenticateAndFetchEvents(); // Try again with new token
            return Promise.reject("Invalid token");
          }
          return res.json();
        })
        .then(data => {
          if (!data || !Array.isArray(data.items)) {
            console.error("Bad calendar response:", JSON.stringify(data, null, 2));
            return;
          }

          chrome.storage.local.set({ calendarEvents: data.items }, () => {
            console.log("Events for selected date stored.");
          });
        })
        .catch(err => {
          if (err !== "Invalid token") {
            console.error("Calendar fetch failed:", err);
          }
        });
    });
  }
});
