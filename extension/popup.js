document.getElementById('openDashboardBtn').addEventListener('click', () => {
    // This gets the URL of the dashboard.html file from within the extension itself
    const dashboardUrl = chrome.runtime.getURL("dashboard.html");
    
    // Check if the dashboard is already open
    chrome.tabs.query({ url: dashboardUrl }, (tabs) => {
        if (tabs.length === 0) {
            // If not open, create a new tab with the dashboard
            chrome.tabs.create({ url: dashboardUrl });
        } else {
            // If already open, just switch to that tab
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    });
});

