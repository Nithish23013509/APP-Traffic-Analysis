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
        if (debuggee.tabId === targetTabId) return;
        chrome.debugger.detach(debuggee, () => handleStart(targetTabId, tabTitle));
        return;
    }
    debuggee = { tabId: targetTabId };
    chrome.storage.local.set({ isMonitoring: true, monitoringTabTitle: tabTitle });

    chrome.debugger.attach(debuggee, "1.3", () => {
        if (chrome.runtime.lastError) {
            console.error("Debugger attach error:", chrome.runtime.lastError.message);
            handleStop(); return;
        }
        chrome.debugger.sendCommand(debuggee, "Network.enable", {}, () => {
             if (chrome.runtime.lastError) {
                console.error("BACKGROUND ERROR: Failed to enable network:", chrome.runtime.lastError.message);
                handleStop();
            } else {
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
    chrome.debugger.detach(tempDebuggee, () => {});
}

// Store basic request info when it's sent
const requestDetails = {};

chrome.debugger.onEvent.addListener((source, method, params) => {
    if (!debuggee || source.tabId !== debuggee.tabId) return;

    // Store method and full URL when the request starts
    if (method === "Network.requestWillBeSent") {
        requestDetails[params.requestId] = {
            fullUrl: params.request.url,
            method: params.request.method
        };
    }
    // Send combined details when the response is received
    else if (method === "Network.responseReceived") {
        try {
            const reqInfo = requestDetails[params.requestId];
            if (!reqInfo) return; // Ignore if we didn't see the request start

            const url = new URL(params.response.url); // Use response URL in case of redirects
            const domain = url.hostname.replace(/^www\./, '');
            
            // --- MODIFIED: Send more details ---
            const detailedInfo = {
                domain: domain,
                fullUrl: reqInfo.fullUrl,
                method: reqInfo.method,
                status: params.response.status,
                type: params.type // e.g., Document, Script, Image, Stylesheet
            };
            sendMessageToDashboard({ type: "DATA", data: detailedInfo });

            // Clean up stored request info
            delete requestDetails[params.requestId];

        } catch (e) {}
    }
    // Also clean up if loading failed
    else if (method === "Network.loadingFailed") {
         delete requestDetails[params.requestId];
    }
});

chrome.debugger.onDetach.addListener(source => {
    if (debuggee && source.tabId === debuggee.tabId) handleStop();
});

async function sendMessageToDashboard(data) {
    try {
        const dashboardUrl = chrome.runtime.getURL("dashboard.html");
        const tabs = await chrome.tabs.query({ url: dashboardUrl });
        if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, data);
        }
    } catch (e) {}
}

