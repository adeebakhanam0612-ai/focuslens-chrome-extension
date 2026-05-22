// ── Helper: Format seconds ────────────────────────────────
function formatTime(seconds) {
  if (seconds < 60) return seconds + "s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}

// ── Helper: Today's date key ──────────────────────────────
function getToday() {
  return new Date().toISOString().split("T")[0];
}

// ── Live Timer (synced with background.js) ────────────────
let timerInterval = null;
let elapsedSeconds = 0;

function startTimer(initialSeconds) {
  // Clear any old timer first
  if (timerInterval) clearInterval(timerInterval);

  // Start from where background.js says we are
  elapsedSeconds = initialSeconds;
  updateTimerDisplay();

  // Count up every second
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const m = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const s = String(elapsedSeconds % 60).padStart(2, "0");
  document.getElementById("liveTimer").textContent = m + ":" + s;
}

// ── Load live tracking info ───────────────────────────────
function loadLiveInfo() {
  chrome.runtime.sendMessage({ type: "GET_CURRENT" }, (res) => {
    if (chrome.runtime.lastError || !res) return;

    // Show domain
    document.getElementById("siteName").textContent =
      res.domain || "No active tab";

    // Show category badge
    const labels = {
      productive:   "Productive",
      neutral:      "Neutral",
      unproductive: "Unproductive",
      other:        "Other"
    };
    const badge = document.getElementById("siteBadge");
    badge.textContent = labels[res.category] || "Other";
    badge.className   = "badge " + (res.category || "other");

    // ✅ Start timer from background's elapsed time
    // This way it never resets when popup reopens!
    startTimer(res.elapsed || 0);
  });
}

// ── Load today's stats ────────────────────────────────────
async function loadTodayStats() {
  const today = getToday();
  const result = await chrome.storage.local.get("timeData");
  const timeData = result.timeData || {};
  const todayData = timeData[today] || {};

  let productive = 0, neutral = 0, unproductive = 0;

  for (const site of Object.values(todayData)) {
    if (site.category === "productive")        productive   += site.seconds;
    else if (site.category === "neutral")      neutral      += site.seconds;
    else if (site.category === "unproductive") unproductive += site.seconds;
  }

  document.getElementById("prodTime").textContent   = formatTime(productive);
  document.getElementById("neutTime").textContent   = formatTime(neutral);
  document.getElementById("unprodTime").textContent = formatTime(unproductive);

  // Focus score
  const total = productive + unproductive;
  const score = total > 0 ? Math.round((productive / total) * 100) : 0;
  document.getElementById("scorePct").textContent  = score + "%";
  document.getElementById("scoreBar").style.width  = score + "%";
}

// ── Dashboard button ──────────────────────────────────────
document.getElementById("dashBtn").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("pages/dashboard.html")
  });
});

// ── Run on popup open ─────────────────────────────────────
loadLiveInfo();
loadTodayStats();

// Refresh stats every 5 seconds
setInterval(loadTodayStats, 5000);