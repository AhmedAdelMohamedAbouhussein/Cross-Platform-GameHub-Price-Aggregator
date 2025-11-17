const syncBtn = document.getElementById("syncBtn");
const statusText = document.getElementById("statusText");

const BACKEND_URL = "https://your-backend.com"; // CHANGE THIS

syncBtn.addEventListener("click", () => {
  statusText.textContent = "Syncing...";

  chrome.runtime.sendMessage({ type: "GET_NPSSO" }, async (res) => {

    if (res?.npsso) {
      statusText.textContent = "Sending NPSSO to server...";

      try {
        const API_KEY = "EXTENSION_ONLY_SECRET_12345"; // safe enough

        const response = await fetch(`${BACKEND_URL}/psn/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Extension-Key": API_KEY
          },
          body: JSON.stringify({ npsso: res.npsso })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Backend error");
        }

        statusText.textContent = "PSN synced successfully!";
      } 
      catch (err) {
        statusText.textContent = "Backend error: " + err.message;
      }

    } else {
      statusText.textContent = "Failed to retrieve NPSSO.";
      console.error(res?.error);
    }
  });
});