let debuggee = null;
let rootDomain = null;
const trackedDomains = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "start") {
        if (debuggee) {
            console.log("Already debugging a tab.");
            return;
        }
        debuggee = { tabId: request.targetTabId };
        rootDomain = null;
        trackedDomains.clear();
        
        chrome.debugger.attach(debuggee, "1.3", () => {
            if (chrome.runtime.lastError) {
                console.error("Debugger attach error:", chrome.runtime.lastError.message);
                return;
            }
            chrome.debugger.sendCommand(debuggee, "Network.enable");
        });
    } else if (request.command === "stop") {
        if (debuggee) {
            chrome.debugger.detach(debuggee);
            debuggee = null;
        }
    }
});

chrome.debugger.onEvent.addListener((source, method, params) => {
    if (!debuggee || source.tabId !== debuggee.tabId) return;

    if (method === "Network.requestWillBeSent") {
        try {
            const url = new URL(params.request.url);
            const domain = url.hostname.replace(/^www\./, '');

            if (!rootDomain) {
                rootDomain = domain;
                if (!trackedDomains.has(rootDomain)) {
                    trackedDomains.add(rootDomain);
                    sendMessageToDashboard({ type: "ROOT", domain: rootDomain });
                }
            } else if (domain !== rootDomain && !trackedDomains.has(domain)) {
                trackedDomains.add(domain);
                sendMessageToDashboard({ type: "EXTERNAL", source: rootDomain, target: domain });
            }
        } catch(e) {
            // Ignore malformed URLs
        }
    }
});

chrome.debugger.onDetach.addListener((source) => {
    if (debuggee && source.tabId === debuggee.tabId) {
        debuggee = null;
    }
});

async function sendMessageToDashboard(data) {
    try {
        const tabs = await chrome.tabs.query({ url: "http://localhost:5000/*" });
        if (tabs.length > 0) {
            const dashboardTabId = tabs[0].id;
            chrome.tabs.sendMessage(dashboardTabId, data);
        } else {
            console.log("Dashboard tab not found.");
        }
    } catch (e) {
        console.error("Error sending message to dashboard:", e);
    }
}