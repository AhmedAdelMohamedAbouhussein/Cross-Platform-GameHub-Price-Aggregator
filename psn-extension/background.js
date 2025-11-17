chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_NPSSO") return;

  chrome.cookies.get(
    { url: "https://ca.account.sony.com", name: "npsso" },
    (cookie) => {
      if (cookie) {
        sendResponse({ npsso: cookie.value });
      } else {
        chrome.tabs.create(
          { url: "https://ca.account.sony.com/api/v1/ssocookie", active: false },
          (tab) => {
            setTimeout(() => {
              chrome.cookies.get(
                { url: "https://ca.account.sony.com", name: "npsso" },
                (cookie2) => {
                  if (cookie2) {
                    sendResponse({ npsso: cookie2.value });
                  } else {
                    sendResponse({ error: "NPSSO_NOT_FOUND" });
                  }
                }
              );
              chrome.tabs.remove(tab.id);
            }, 3000);
          }
        );
      }
    }
  );

  return true;
});
