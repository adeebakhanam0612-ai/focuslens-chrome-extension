// ── Website Categories ────────────────────────────────────
const PRODUCTIVE_SITES = [
  "github.com", "stackoverflow.com", "leetcode.com",
  "coursera.org", "udemy.com", "notion.so", "figma.com",
  "claude.ai", "chat.openai.com", "trello.com", "asana.com"
];

const UNPRODUCTIVE_SITES = [
  "facebook.com", "instagram.com", "twitter.com", "x.com",
  "tiktok.com", "youtube.com", "netflix.com", "snapchat.com"
];

// ── Helper Functions ──────────────────────────────────────
function getDomain(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function classifySite(domain) {
  if (!domain) return "other";
  if (PRODUCTIVE_SITES.some(s => domain.includes(s))) return "productive";
  if (UNPRODUCTIVE_SITES.some(s => domain.includes(s))) return "unproductive";
  return "neutral";
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

// ── Tracking State ────────────────────────────────────────
let currentTab = null;
let currentUrl = null;
let startTime = null;

// ── Save Time to Storage ──────────────────────────────────
async function saveTime(url, seconds) {
  if (!url || seconds < 1) return;

  const domain = getDomain(url);
  if (!domain) return;

  const today = getToday();
  const data = await chrome.storage.local.get("timeData");
  const timeData = data.timeData || {};

  if (!timeData[today]) timeData[today] = {};
  if (!timeData[today][domain]) {
    timeData[today][domain] = { seconds: 0, category: classifySite(domain) };
  }

  timeData[today][domain].seconds += seconds;

  await chrome.storage.local.set({ timeData });
}

// ── Switch Tracking to New Tab ────────────────────────────
async function switchTab(tabId, url) {
  // Save time for previous tab first
  if (currentUrl && startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    await saveTime(currentUrl, elapsed);
  }

  // Start tracking new tab
  currentTab = tabId;
  currentUrl = url;
  startTime = Date.now();
}

// ── Listen for Tab Changes ────────────────────────────────
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url) await switchTab(tabId, tab.url);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active && tab.url) {
    await switchTab(tabId, tab.url);
  }
});

// ── Save every 30 seconds automatically ──────────────────
chrome.alarms.create("autosave", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async () => {
  if (currentUrl && startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    await saveTime(currentUrl, elapsed);
    startTime = Date.now(); // reset timer
  }
});

// ── Start on Install ──────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
  if (tab?.url) await switchTab(tab.id, tab.url);
});
// ── Handle messages from popup ────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_CURRENT") {
    const domain = currentUrl ? getDomain(currentUrl) : null;
    sendResponse({
      domain: domain,
      category: domain ? classifySite(domain) : "other",
      elapsed: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    });
  }
  return true;
});