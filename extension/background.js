let debuggee = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "start") {
        handleStart(request.targetTabId, request.tabTitle);
    } else if (request.command === "stop") {
        handleStop();
    }
});

function handleStart(targetTabId, tabTitle) {
    if (debuggee) {
        if (debuggee.tabId === targetTabId) {
            console.log("BACKGROUND: Already monitoring this tab.");
            return; 
        }
        // If monitoring a different tab, stop that one first, then start the new one.
        chrome.debugger.detach(debuggee, () => handleStart(targetTabId, tabTitle));
        return;
    }

    debuggee = { tabId: targetTabId };
    chrome.storage.local.set({ isMonitoring: true, monitoringTabTitle: tabTitle });
    
    chrome.debugger.attach(debuggee, "1.3", () => {
        if (chrome.runtime.lastError) {
            console.error("BACKGROUND ERROR: Debugger attach failed:", chrome.runtime.lastError.message);
            handleStop(); // Clean up if attach fails
            return;
        }
        console.log("BACKGROUND: Debugger attached successfully to tabId:", targetTabId);
        chrome.debugger.sendCommand(debuggee, "Network.enable", {}, () => {
            if (chrome.runtime.lastError) {
                console.error("BACKGROUND ERROR: Failed to enable network:", chrome.runtime.lastError.message);
                handleStop();
            } else {
                 // Tell the dashboard to clear any old data from a previous session
                sendMessageToDashboard({ type: "CLEAR" });
            }
        });
    });
}

function handleStop() {
    if (!debuggee) return;
    const tempDebuggee = debuggee; 
    debuggee = null;
    chrome.storage.local.set({ isMonitoring: false, monitoringTabTitle: '' });
    chrome.debugger.detach(tempDebuggee, () => {
        if (chrome.runtime.lastError) {
           // This can happen if the tab was already closed, which is fine.
        }
    });
}

chrome.debugger.onEvent.addListener((source, method, params) => {
    if (!debuggee || source.tabId !== debuggee.tabId) return;

    if (method === "Network.requestWillBeSent") {
        try {
            const url = new URL(params.request.url);
            const domain = url.hostname.replace(/^www\./, '');
            sendMessageToDashboard({ type: "DATA", domain: domain });
        } catch (e) {} 
    }
});

chrome.debugger.onDetach.addListener(source => {
    if (debuggee && source.tabId === debuggee.tabId) {
        console.log("BACKGROUND: Debugger detached, cleaning up.");
        handleStop();
    }
});

async function sendMessageToDashboard(data) {
    try {
        const dashboardUrl = chrome.runtime.getURL("dashboard.html");
        const tabs = await chrome.tabs.query({ url: dashboardUrl });
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, data, (response) => {
                if (chrome.runtime.lastError) {}
            });
        }
    } catch (e) {
        console.error("BACKGROUND ERROR: Could not send message to dashboard:", e);
    }
}

