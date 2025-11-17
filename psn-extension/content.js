window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data.type === "REQUEST_NPSSO") {
        chrome.runtime.sendMessage({ type: "GET_NPSSO" }, (res) => {
            window.postMessage({
                type: "NPSSO_RESPONSE",
                npsso: res?.npsso || null,
                error: res?.error || null
            });
        });
    }
});
