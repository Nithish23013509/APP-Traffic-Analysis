# Real-time Website Traffic Connection Visualizer

![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3dotjs&logoColor=white)
![Chrome](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)

This repository contains the source code for a Chrome Extension built as a college mini-project. The extension monitors a browser tab's network traffic in real-time, categorizes all external domains, and displays the connections in an interactive dashboard.

## Demo

Here is the extension in action, monitoring `youtube.com`:

![Dashboard Screenshot](https.i.imgur.com/your-screenshot-url.png)
*(**Note:** You should replace the link above with a direct link to your own screenshot, like `image_db1b20.png` or `image_42f4a4.png`, after uploading it to GitHub or an image host.)*

## Features

* **Real-time Monitoring:** Attaches to any active browser tab using the `chrome.debugger` API to capture network requests live.
* **Interactive Pie Chart:** Uses **D3.js** to build a dynamic pie chart that categorizes all connected domains (e.g., Advertising, Video Content, CDN, Analytics).
* **Drill-Down Details:** Click on a pie slice to see a list of all unique domains in that category.
* **Deep Request Inspection:** Click on a domain from the list to open a modal window showing:
    * A list of all individual requests made to that domain.
    * The full Request URL.
    * The Request Method (GET/POST).
    * The HTTP Status Code (e.g., 200, 404).
    * The Resource Type (e.g., Script, Image).
    * A **Tracker Status** warning.
    * A truncated preview of the **Response Body**.
* **Self-Contained Dashboard:** The entire UI is a single `dashboard.html` page bundled within the extension.

## How to Install and Use

This extension is not on the Chrome Web Store and must be loaded as an "unpacked" extension.

### Installation

1.  **Download:** Download this repository as a ZIP file and unzip it, or clone it to your local machine.
2.  **Locate Folder:** You only need the `extension` folder.
3.  **Open Chrome Extensions:** Open Google Chrome, type `chrome://extensions` in the address bar, and press Enter.
4.  **Enable Developer Mode:** In the top-right corner, turn on the "Developer mode" toggle.
5.  **Load Extension:** Click the "Load unpacked" button. A file dialog will open.
6.  **Select Folder:** Navigate to and select the `extension` folder from this project.

The extension is now installed! You will see its icon in your browser toolbar.

### How to Use

1.  **Open Dashboard:** Click the extension's icon in your toolbar and click the **"Open Dashboard"** button. This will open the dashboard in a new tab.
2.  **Open Target Site:** In another tab, open any website you want to monitor (e.g., `youtube.com`, `quora.com`).
3.  **Start Monitoring:** Go back to the **Dashboard tab** and click the **"Start Monitoring Active Tab"** button.
    * The extension will find the last active tab (YouTube) and attach to it.
    * The status will change to "Active".
    * A blue "debugging" bar will appear on the YouTube tab.
4.  **Browse:** Go back to the YouTube tab and browse normally (click a video, go to another page).
5.  **View Results:** Go back to the Dashboard tab. The pie chart will update in real-time, showing all the connections. You can now click on slices and domains to explore the data.

## Project Structure

All the code is located within the `extension/` folder:

* `manifest.json`: The "blueprint" for the Chrome Extension. It defines permissions (`debugger`, `tabs`, `storage`), the background script, and the popup action.
* `background.js`: The "brain" of the extension. Runs as a service worker, handles attaching the debugger, listens for network events, processes data, and sends it to the dashboard.
* `dashboard.html`: The main user interface. Contains the HTML structure for the controls, chart, legend, and modals.
* `dashboard.js`: The "muscle" of the dashboard. Contains all D3.js logic for drawing the pie chart, handling clicks, showing details, and communicating with the background script.
* `popup.html` / `popup.js`: The simple popup window that appears when you click the extension icon. Its only job is to open the main `dashboard.html` page.
* `d3.v5.min.js`: The local copy of the D3.js library, included to comply with Manifest V3's Content Security Policy.
* `icon.png`: The extension's icon.

## Future Improvements

* **Enhanced Tracker Database:** Integrate a more comprehensive, standard ad-blocking list (like EasyList) for higher accuracy in tracker identification.
* **Performance Metrics:** Add a section to display performance data, such as total data downloaded (in MB) and the average request duration.
* **Export Data:** Add a button to export the captured session data (domains and requests) as a JSON file for external analysis.
