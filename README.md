# 🌐 Real-time Website Traffic Connection Visualizer

![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?logo=d3dotjs&logoColor=white)
![Chrome](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)

---

### 📖 Overview
This repository contains the source code for a **Chrome Extension** built as a **college mini-project**.  
The extension monitors a browser tab's **network traffic in real-time**, categorizes all external domains, and displays the connections in an **interactive dashboard** powered by **D3.js**.

---

## 🎥 Demo

Here is the extension in action, monitoring `youtube.com`:

![Dashboard Screenshot](https://i.imgur.com/your-screenshot-url.png)

> 🖼️ **Note:** Replace the link above with your own screenshot (e.g., `image_db1b20.png` or `image_42f4a4.png`) after uploading it to GitHub or any image host.

---

## 🚀 Features

- ⚡ **Real-time Monitoring:**  
  Attaches to any active browser tab using the `chrome.debugger` API to capture network requests live.

- 📊 **Interactive Pie Chart:**  
  Uses **D3.js** to visualize domain categories such as *Advertising*, *Video Content*, *CDN*, and *Analytics*.

- 🔍 **Drill-Down Details:**  
  Click on any pie slice to view a detailed list of unique domains in that category.

- 🧠 **Deep Request Inspection:**  
  Click on a domain to open a modal showing:
  - All network requests made to that domain
  - Request URL, Method (GET/POST), and HTTP Status
  - Resource Type (e.g., Script, Image)
  - Tracker Status alert
  - Truncated Response Body preview

- 🖥️ **Self-Contained Dashboard:**  
  The entire UI is contained in a single `dashboard.html` bundled inside the extension.

---

## 🧩 Project Structure


---

## ⚙️ Installation & Usage

This extension is not available on the Chrome Web Store.  
You can load it manually as an **unpacked extension**.

### 🧱 Installation Steps

1. **Download Repository:**
   - Clone this repository or download it as a ZIP file and unzip it.

2. **Locate Folder:**
   - Open the `extension` folder inside the project.

3. **Open Chrome Extensions Page:**
   - In Chrome, go to `chrome://extensions`.

4. **Enable Developer Mode:**
   - Turn on the **Developer mode** toggle in the top-right corner.

5. **Load Unpacked:**
   - Click **Load unpacked** → Select the `extension` folder.

✅ The extension will appear in your Chrome toolbar.

---

### 🧭 How to Use

1. **Open Dashboard:**
   - Click the extension icon → then click **“Open Dashboard”**.

2. **Open a Website:**
   - In another tab, open any site you want to monitor (e.g., `youtube.com`).

3. **Start Monitoring:**
   - In the Dashboard tab, click **“Start Monitoring Active Tab”**.
   - The extension will attach to the active tab and begin tracking requests.
   - You’ll see a blue “debugging” banner appear on the target tab.

4. **View Results:**
   - Return to the Dashboard tab.
   - Watch as the pie chart updates in real-time with categorized connections.

5. **Explore:**
   - Click any slice or domain for deeper insights.

---

## 🔮 Future Improvements

- 🧾 **Enhanced Tracker Database:**  
  Integrate a standard ad-blocking list (e.g., EasyList) for improved tracker detection.

- ⚙️ **Performance Metrics:**  
  Display data size (MB), request count, and average request time.

- 💾 **Export Functionality:**  
  Allow exporting session data (domains, requests) as a JSON file.

---

## 🧑‍💻 Author
**Developed by:** [Your Name]  
**Project Type:** College Mini Project  
**Technologies Used:** HTML5, CSS3, JavaScript (ES6+), D3.js, Chrome Debugger API  

---

## 🏷️ License
This project is released under the **MIT License**.  
You are free to use, modify, and distribute this project with attribution.

---

> ⭐ *If you found this project useful, please consider giving it a star on GitHub!*
