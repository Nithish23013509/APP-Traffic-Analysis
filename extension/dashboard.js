const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const radius = Math.min(width, height) / 2;
const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
const color = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494"]);
const pie = d3.pie().sort(null).value(d => d.value.size);
const path = d3.arc().outerRadius(radius - 10).innerRadius(0);
const labelArc = d3.arc().outerRadius(radius - 60).innerRadius(radius - 60);

// Data now stores a map of domains to their request details
let categoryData = {};

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const detailsContainer = document.getElementById('details-container');
const closeDetailsBtn = document.getElementById('close-details');
const detailsList = document.getElementById('details-list');
const detailsTitle = document.getElementById('details-category-title');

// --- NEW: Modal elements ---
const requestModal = document.getElementById('request-modal');
const closeModal = document.querySelector('.close-modal');
const modalTitle = document.getElementById('modal-title');
const modalFullUrl = document.getElementById('modal-full-url');
const modalMethod = document.getElementById('modal-method');
const modalTrackerStatus = document.getElementById('modal-tracker-status');

// --- NEW: A simple list of known tracker/ad strings ---
const TRACKER_LIST = new Set([
    'google-analytics', 'googletagmanager', 'doubleclick', 'googleadservices',
    'googlesyndication', 'facebook', 'fbcdn', 'connect.facebook.net',
    'advertising', 'ads', 'adsystem', 'adservice'
]);

function isTracker(domain) {
    for (const tracker of TRACKER_LIST) {
        if (domain.includes(tracker)) {
            return true;
        }
    }
    return false;
}

function categorizeDomain(domain) {
    if (isTracker(domain)) {
        if (domain.includes('google-analytics') || domain.includes('googletagmanager')) return 'Analytics';
        return 'Advertising';
    }
    if (/\.googlevideo\.com$/.test(domain)) return 'Video Content';
    if (/\.ytimg\.com$|\.ggpht\.com$/.test(domain)) return 'Image Content';
    if (/\.gstatic\.com$|\.cloudfront\.net$|\.akamaized\.net$/.test(domain)) return 'CDN';
    if (/\.googleapis\.com$/.test(domain)) return 'Google API';
    if (domain.includes('google.com')) return 'Google Service';
    return 'Other';
}

function updateStatus() {
    chrome.storage.local.get(['isMonitoring', 'monitoringTabTitle'], (result) => {
        if (result.isMonitoring && result.monitoringTabTitle) {
            statusEl.textContent = `Status: Active (Monitoring: ${result.monitoringTabTitle})`;
        } else {
            statusEl.textContent = 'Status: Inactive';
        }
    });
}

startBtn.addEventListener('click', () => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const dashboardUrl = chrome.runtime.getURL("dashboard.html");
        let targetTab = null;
        for (let i = tabs.length - 1; i >= 0; i--) {
            if (tabs[i].url && tabs[i].url !== dashboardUrl && tabs[i].url.startsWith("http")) {
                targetTab = tabs[i];
                break;
            }
        }
        if (targetTab) {
            chrome.runtime.sendMessage({ command: "start", targetTabId: targetTab.id, tabTitle: targetTab.title });
        } else {
            alert("No website to monitor was found.\n\nPlease open a website (like youtube.com) in another tab and try again.");
        }
    });
});

stopBtn.addEventListener('click', () => chrome.runtime.sendMessage({ command: "stop" }));
closeDetailsBtn.addEventListener('click', () => detailsContainer.style.display = 'none');

// --- NEW: Event listeners for the modal ---
closeModal.addEventListener('click', () => requestModal.style.display = 'none');
requestModal.addEventListener('click', (e) => {
    if (e.target === requestModal) { // Close if clicking on the overlay
        requestModal.style.display = 'none';
    }
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.isMonitoring || changes.monitoringTabTitle) updateStatus();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CLEAR") {
        categoryData = {};
        detailsContainer.style.display = 'none';
        requestModal.style.display = 'none';
    } else if (message.type === "DATA") {
        const { domain, fullUrl, method } = message.data;
        const category = categorizeDomain(domain);
        
        if (!categoryData[category]) {
            categoryData[category] = new Map();
        }
        if (!categoryData[category].has(domain)) {
            categoryData[category].set(domain, []);
        }
        categoryData[category].get(domain).push({ fullUrl, method });
    }
    updateChart();
});

function showDetails(category) {
    const domainsMap = categoryData[category];
    if (!domainsMap) return;

    detailsTitle.textContent = `Domains in "${category}"`;
    detailsList.innerHTML = '';

    const sortedDomains = Array.from(domainsMap.keys()).sort();
    
    sortedDomains.forEach(domain => {
        const li = document.createElement('li');
        li.textContent = domain;
        // --- MODIFIED: Add a click listener to show the request modal ---
        li.addEventListener('click', () => {
            const requests = domainsMap.get(domain);
            showRequestModal(domain, requests);
        });
        detailsList.appendChild(li);
    });

    detailsContainer.style.display = 'block';
}

// --- NEW: Function to show the modal with request details ---
function showRequestModal(domain, requests) {
    modalTitle.textContent = domain;
    modalFullUrl.textContent = requests[0].fullUrl; // Show the first request's URL
    modalMethod.textContent = requests[0].method;
    
    if (isTracker(domain)) {
        modalTrackerStatus.textContent = "Known Tracker/Advertiser";
        modalTrackerStatus.className = 'tracker-warning';
    } else {
        modalTrackerStatus.textContent = "Not a known tracker.";
        modalTrackerStatus.className = '';
    }
    
    requestModal.style.display = 'flex';
}

function updateChart() {
    const data_ready = Object.entries(categoryData).map(([key, value]) => ({ key, value }));
    const arc = g.selectAll(".arc").data(pie(data_ready), d => d.data.key);
    arc.exit().remove();
    const arcEnter = arc.enter().append("g").attr("class", "arc");
    arcEnter.append("path").on('click', d => showDetails(d.data.key));
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
        .text(d => d.data.value.size > 2 ? d.data.key : '')
        .transition().duration(750)
        .attr("transform", d => `translate(${labelArc.centroid(d)})`);
    const legend = d3.select("#legend");
    legend.html("");
    const sortedData = data_ready.sort((a, b) => b.value.size - a.value.size);
    sortedData.forEach(item => {
        const legendItem = legend.append("div").attr("class", "legend-item");
        legendItem.append("div").attr("class", "legend-color").style("background-color", color(item.key));
        legendItem.append("div").attr("class", "legend-label").text(item.key);
        legendItem.append("div").attr("class", "legend-count").text(item.value.size);
    });
}

updateStatus();
updateChart();
