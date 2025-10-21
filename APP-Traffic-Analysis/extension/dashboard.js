const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const radius = Math.min(width, height) / 2;
const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
const color = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);
const pie = d3.pie().sort(null).value(d => d.value);
const path = d3.arc().outerRadius(radius - 10).innerRadius(0);
const labelArc = d3.arc().outerRadius(radius - 60).innerRadius(radius - 60);
let categoryData = {};

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');

startBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        // Prevent monitoring the dashboard itself
        if (activeTab.url.includes(chrome.runtime.id)) {
            alert("Cannot monitor the dashboard. Please switch to another tab to start monitoring.");
            return;
        }
        statusEl.textContent = 'Status: Active';
        chrome.runtime.sendMessage({ command: "start", targetTabId: activeTab.id });
    });
});

stopBtn.addEventListener('click', () => {
    statusEl.textContent = 'Status: Inactive';
    chrome.runtime.sendMessage({ command: "stop" });
});

function categorizeDomain(domain) {
    if (domain.includes('google-analytics') || domain.includes('googletagmanager')) return 'Analytics';
    if (domain.includes('doubleclick') || domain.includes('adservice')) return 'Advertising';
    if (domain.includes('gstatic') || domain.includes('cloudfront')) return 'CDN';
    if (domain.includes('facebook') || domain.includes('twitter')) return 'Social';
    if (domain.includes('googleapis')) return 'API';
    return 'Other';
}

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
    merged.select("text").text(d => d.data.key).transition().duration(750).attr("transform", d => `translate(${labelArc.centroid(d)})`);
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
updateChart();
