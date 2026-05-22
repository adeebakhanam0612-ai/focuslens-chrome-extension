# 🔍 FocusLens – Chrome Extension for Time Tracking & Productivity Analytics



![Version](https://img.shields.io/badge/version-1.0.0-blue)




![Manifest](https://img.shields.io/badge/manifest-v3-green)




![License](https://img.shields.io/badge/license-MIT-purple)



A Chrome Extension that automatically tracks time spent on websites
and provides detailed productivity analytics with beautiful charts
and weekly reports.

---

## ✨ Features

- ⏱️ **Auto Time Tracking** — Tracks every website you visit in real time
- 🏷️ **Smart Classification** — Automatically labels sites as Productive,
  Neutral, or Unproductive
- 📊 **Live Popup** — See your current site, live timer, and today's
  focus score instantly
- 📈 **Full Dashboard** — Beautiful analytics with bar charts, donut
  charts, and trend lines
- 📅 **Weekly Reports** — 7-day breakdown with heatmap and productivity score
- ⚙️ **Custom Rules** — Override any site's category to match your workflow
- 💾 **Export Data** — Download your tracking data as CSV anytime

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3 |
| Frontend | HTML, CSS, JavaScript |
| Charts | Chart.js 4.4.1 |
| Storage | Chrome Storage API |
| Background | Chrome Service Worker |

---

## 📁 Project Structure
FocusLens/
└── extension/
├── manifest.json        # Extension configuration
├── background.js        # Core time tracking engine
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   └── icon128.png
└── pages/
├── popup.html       # Extension popup UI
├── popup.js         # Popup logic
├── dashboard.html   # Full analytics dashboard
├── dashboard.js     # Dashboard charts & data
└── chart.min.js     # Chart.js library (local)
---

## 🚀 Installation

1. Clone this repository
 git clone https://github.com/adeebakhanam0612-ai/focuslens-chrome-extension.git
 2. Open Google Chrome and go to
    chrome://extensions
    3. Enable **Developer Mode** (top right toggle)

4. Click **Load Unpacked**

5. Select the `extension` folder

6. Click the 🔍 FL icon in your toolbar to start tracking!

---

## 📊 Dashboard Pages

| Page | Description |
|------|-------------|
| 📊 Overview | KPI cards, bar chart, donut chart, 7-day trend |
| 🌐 All Sites | Full table of every site visited with time |
| 📅 Weekly Report | Stacked bar chart and day heatmap |
| ⚙️ Settings | Custom site categories and data export |

---

## 🏷️ Site Categories

### Productive ✅
GitHub, Stack Overflow, LeetCode, Coursera, Notion,
Figma, Claude AI, Trello and more

### Unproductive ❌
Facebook, Instagram, YouTube, TikTok, Netflix,
Twitter, Snapchat and more

### Neutral 🟡
Google, Wikipedia, Reddit, News sites and everything else

---

## 👩‍💻 Developer

**Adeeba Khanam**
GitHub: [@adeebakhanam0612-ai](https://github.com/adeebakhanam0612-ai)

---

## 📌 Project Context

Built as **Internship Task 4** — Chrome Extension for Time Tracking
and Productivity Analytics.

---

## 📄 License

This project is open source under the [MIT License](LICENSE).
