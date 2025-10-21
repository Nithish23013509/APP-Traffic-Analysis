console.log("DASHBOARD SCRIPT: Loaded and waiting for messages.");

// --- D3 Setup ---
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

function categorizeDomain(domain) {
    if (domain.includes('google-analytics') || domain.includes('googletagmanager')) return 'Analytics';
    if (domain.includes('doubleclick') || domain.includes('adservice') || domain.includes('syndication')) return 'Advertising';
    if (domain.includes('gstatic') || domain.includes('cloudfront') || domain.includes('akamai')) return 'CDN';
    if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('linkedin')) return 'Social';
    if (domain.includes('googleapis')) return 'API';
    return 'Other';
}

// --- LISTEN FOR MESSAGES FROM THE BROWSER EXTENSION ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("DASHBOARD SCRIPT: Received message:", message);
    if (message.type === "ROOT") {
        categoryData = {};
        updateChart();
        sendResponse({ status: "Chart cleared" });
    } else if (message.type === "EXTERNAL") {
        const category = categorizeDomain(message.target);
        categoryData[category] = (categoryData[category] || 0) + 1;
        updateChart();
        sendResponse({ status: "Chart updated" });
    }
    return true; // Keep the message channel open for async response
});

function updateChart() {
    const data_ready = Object.entries(categoryData).map(([key, value]) => ({ key, value }));
    
    const arc = g.selectAll(".arc").data(pie(data_ready), d => d.data.key);

    const arcEnter = arc.enter().append("g").attr("class", "arc");
    arcEnter.append("path").attr("d", path).attr("fill", d => color(d.data.key))
        .style("opacity", 0).transition().duration(500).style("opacity", 1);
    arcEnter.append("text").attr("class", "slice-label").attr("transform", d => `translate(${labelArc.centroid(d)})`).attr("dy", "0.35em").text(d => d.data.key)
        .style("opacity", 0).transition().duration(500).style("opacity", 1);

    arc.select("path").transition().duration(750).attrTween("d", function(d) {
        this._current = this._current || d;
        const interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) { return path(interpolate(t)); };
    });
    arc.select("text").transition().duration(750).attr("transform", d => `translate(${labelArc.centroid(d)})`);

    arc.exit().transition().duration(500).style("opacity", 0).remove();
    
    // Update legend
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

// Initial empty chart
updateChart();
