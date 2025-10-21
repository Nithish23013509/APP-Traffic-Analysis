document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusEl = document.getElementById('status');

    // Function to check and set the status from storage
    function updateStatus() {
        chrome.storage.local.get(['isMonitoring'], (result) => {
            if (result.isMonitoring) {
                statusEl.textContent = "Status: Active";
            } else {
                statusEl.textContent = "Status: Inactive";
            }
        });
    }

    // Check status right when the popup opens
    updateStatus();

    startBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (!currentTab.url || currentTab.url.startsWith("chrome://")) {
                alert("Cannot monitor this type of page. Please switch to a website like youtube.com.");
                return;
            }
            
            // This is the message that starts the monitoring
            chrome.runtime.sendMessage({ command: "start", targetTabId: currentTab.id });
            
            // Immediately update the UI
            statusEl.textContent = "Status: Active";
        });
    });

    stopBtn.addEventListener('click', () => {
        // This is the message that stops the monitoring
        chrome.runtime.sendMessage({ command: "stop" });
        
        // Immediately update the UI
        statusEl.textContent = "Status: Inactive";
    });
});

