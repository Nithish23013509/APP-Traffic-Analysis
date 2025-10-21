const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const radius = Math.min(width, height) / 2;
const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
const color = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494"]);
const pie = d3.pie().sort(null).value(d => d.value);
const path = d3.arc().outerRadius(radius - 10).innerRadius(0);
const labelArc = d3.arc().outerRadius(radius - 60).innerRadius(radius - 60);
let categoryData = {};

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

// --- NEW, SMARTER CATEGORIZATION ---
function categorizeDomain(domain) {
    if (/\.google-analytics\.com$|\.googletagmanager\.com$/.test(domain)) return 'Analytics';
    if (/\.doubleclick\.net$|\.googleadservices\.com$|\.googlesyndication\.com$|\.ads\.|adsystem\.|.adservice\./.test(domain)) return 'Advertising';
    if (/\.googlevideo\.com$/.test(domain)) return 'Video Content';
    if (/\.ytimg\.com$|\.ggpht\.com$/.test(domain)) return 'Image Content';
    if (/\.gstatic\.com$|\.cloudfront\.net$|\.akamaized\.net$|\.fbcdn\.net$/.test(domain)) return 'CDN';
    if (/\.googleapis\.com$/.test(domain)) return 'Google API';
    if (/\.facebook\.com$|\.twitter\.com$|\.linkedin\.com$/.test(domain)) return 'Social';
    if (domain.includes('google.com')) return 'Google Service';
    return 'Other';
}

// Function to update status text based on storage
function updateStatus() {
    chrome.storage.local.get(['isMonitoring', 'monitoringTabTitle'], (result) => {
        if (result.isMonitoring && result.monitoringTabTitle) {
            // Corrected typo: result.monitoringTabTitle
            statusEl.textContent = `Status: Active (Monitoring: ${result.monitoringTabTitle})`;
        } else if (result.isMonitoring) {
            statusEl.textContent = 'Status: Active';
        } else {
            statusEl.textContent = 'Status: Inactive';
        }
    });
}

// --- NEW, SMARTER "START" LOGIC ---
startBtn.addEventListener('click', () => {
    // This new logic finds the best tab to monitor.
    // It looks for the most recently used tab that ISN'T the dashboard.
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const dashboardUrl = chrome.runtime.getURL("dashboard.html");
        let targetTab = null;

        // Find the most recently active, non-dashboard, valid website tab.
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url && tabs[i].url !== dashboardUrl && tabs[i].url.startsWith("http")) {
                targetTab = tabs[i];
                break; // Found our target
            }
        }

        if (targetTab) {
            console.log("DASHBOARD: Found target tab to monitor:", targetTab.url);
            // Send the message to start monitoring the found tab
            chrome.runtime.sendMessage({ command: "start", targetTabId: targetTab.id, tabTitle: targetTab.title });
        } else {
            alert("No website to monitor was found.\n\nPlease open a website (like youtube.com) in another tab and try again.");
        }
    });
});

stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: "stop" });
});

// Listen for storage changes to update the status text
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.isMonitoring || changes.monitoringTabTitle) {
        updateStatus();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEAR") {
        categoryData = {};
    } else if (message.type === "DATA") {
        const category = categorizeDomain(message.domain);
        categoryData[category] = (categoryData[category] || 0) + 1;
    }
    updateChart();
});

function updateChart() {
    const data_ready = Object.entries(categoryData).map(([key, value]) => ({ key, value }));
    const arc = g.selectAll(".arc").data(pie(data_ready), d => d.data.key);
    arc.exit().remove();
    const arcEnter = arc.enter().append("g").attr("class", "arc");
    arcEnter.append("path");
    arcEnter.append("text").attr("class", "slice-label").attr("dy", "0.35em");

    const merged = arcEnter.merge(arc);

    merged.select("path").attr("fill", d => color(d.data.key))
        .transition().duration(750)
        .attrTween("d", function(d) {
            const i = d3.interpolate(this._current || { startAngle: 0, endAngle: 0 }, d);
            this._current = i(1);
            return (t) => path(i(t));
        });

    merged.select("text")
        .text(d => d.data.value > 2 ? d.data.key : '') // Only show label if the slice is big enough
        .transition().duration(750)
        .attr("transform", d => `translate(${labelArc.centroid(d)})`);
    
    const legend = d3.select("#legend");
    legend.html("");
    const sortedData = data_ready.sort((a, b) => b.value - a.value);

    sortedData.forEach(item => {
        const legendItem = legend.append("div").attr("class", "legend-item");
        legendItem.append("div").attr("class", "legend-color").style("background-color", color(item.key));
        legendItem.append("div").attr("class", "legend-label").text(item.key);
        legendItem.append("div").attr("class", "legend-count").text(item.value);
    });
}

// Initial calls
updateStatus();
updateChart();

