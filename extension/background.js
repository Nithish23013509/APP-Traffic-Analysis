let debuggee = null;
let currentTabTitle = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "start") {
        if (debuggee) {
            console.log("Already debugging a tab.");
            return true; 
        }
        debuggee = { tabId: request.targetTabId };
        currentTabTitle = request.tabTitle;
        
        chrome.storage.local.set({ isMonitoring: true, monitoringTabTitle: currentTabTitle });
        sendMessageToDashboard({ type: "CLEAR" });

        chrome.debugger.attach(debuggee, "1.3", () => {
            if (chrome.runtime.lastError) {
                console.error("Debugger attach error:", chrome.runtime.lastError.message);
                chrome.storage.local.set({ isMonitoring: false, monitoringTabTitle: '' });
                return;
            }
            chrome.debugger.sendCommand(debuggee, "Network.enable");
        });
        return true;
    } else if (request.command === "stop") {
        if (debuggee) {
            chrome.debugger.detach(debuggee);
            debuggee = null;
            chrome.storage.local.set({ isMonitoring: false, monitoringTabTitle: '' });
        }
        return true;
    }
});

chrome.debugger.onEvent.addListener((source, method, params) => {
    if (!debuggee || source.tabId !== debuggee.tabId) return;

    if (method === "Network.requestWillBeSent") {
        try {
            const url = new URL(params.request.url);
            const domain = url.hostname.replace(/^www\./, '');
            
            // --- MODIFIED: Send a more detailed object ---
            const requestInfo = {
                domain: domain,
                fullUrl: params.request.url,
                method: params.request.method
            };
            sendMessageToDashboard({ type: "DATA", data: requestInfo });

        } catch(e) {
            // Ignore malformed URLs
        }
    }
});

chrome.debugger.onDetach.addListener((source) => {
    if (debuggee && source.tabId === debuggee.tabId) {
        debuggee = null;
        chrome.storage.local.set({ isMonitoring: false, monitoringTabTitle: '' });
    }
});

async function sendMessageToDashboard(data) {
    const dashboardUrl = chrome.runtime.getURL("dashboard.html");
    try {
        const tabs = await chrome.tabs.query({ url: dashboardUrl });
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, data);
        }
    } catch (e) {
        console.error("Error sending message to dashboard:", e);
    }
}

