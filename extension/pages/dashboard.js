// ── Helpers ───────────────────────────────────────────────
function formatTime(seconds) {
  if (seconds < 60) return seconds + "s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDayLabel(dateStr) {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return days[new Date(dateStr).getDay()];
}

// ── Chart defaults ────────────────────────────────────────
Chart.defaults.color = "#5a5a7a";
Chart.defaults.borderColor = "#1a1a30";

// ── Load all data from storage ────────────────────────────
async function getData() {
  const result = await chrome.storage.local.get(["timeData","customCategories"]);
  return {
    timeData: result.timeData || {},
    customCategories: result.customCategories || {}
  };
}

// ── OVERVIEW PAGE ─────────────────────────────────────────
let barChart, donutChart, trendChart;

async function loadOverview() {
  const today = getToday();
  const { timeData } = await getData();
  const todayData = timeData[today] || {};

  // Tally categories
  let prod = 0, neut = 0, unprod = 0;
  const sitesArr = [];

  for (const [domain, info] of Object.entries(todayData)) {
    const s = info.seconds || 0;
    if (info.category === "productive")        prod   += s;
    else if (info.category === "unproductive") unprod += s;
    else                                       neut   += s;
    sitesArr.push({ domain, ...info });
  }

  const total = prod + neut + unprod;
  const score = (prod + unprod) > 0
    ? Math.round((prod / (prod + unprod)) * 100) : 0;

  // KPI cards
  document.getElementById("kpiTotal").textContent  = formatTime(total);
  document.getElementById("kpiProd").textContent   = formatTime(prod);
  document.getElementById("kpiUnprod").textContent = formatTime(unprod);
  document.getElementById("kpiScore").textContent  = score + "%";
  document.getElementById("kpiProdPct").textContent =
    total > 0 ? Math.round((prod/total)*100) + "% of total" : "No data";
  document.getElementById("kpiUnprodPct").textContent =
    total > 0 ? Math.round((unprod/total)*100) + "% of total" : "No data";

  const labels = {
    100: "🔥 Outstanding",
    75:  "⚡ Great Focus",
    50:  "👍 Good",
    25:  "⚠️ Needs Work",
    0:   "😬 Distracted"
  };
  const scoreLabel = Object.entries(labels)
    .reverse()
    .find(([k]) => score >= Number(k));
  document.getElementById("kpiScoreLabel").textContent =
    scoreLabel ? scoreLabel[1] : "No data";

  // Date label
  document.getElementById("overviewDate").textContent =
    "Today — " + new Date().toDateString();

  // ── Bar Chart ──
  const topSites = sitesArr
    .sort((a,b) => b.seconds - a.seconds)
    .slice(0, 7);

  const barColors = topSites.map(s => {
    if (s.category === "productive")   return "#00d4a0";
    if (s.category === "unproductive") return "#f43f5e";
    return "#f59e0b";
  });

  if (barChart) barChart.destroy();
  barChart = new Chart(
    document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: topSites.map(s => s.domain),
      datasets: [{
        label: "Time (seconds)",
        data: topSites.map(s => s.seconds),
        backgroundColor: barColors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          ticks: {
            callback: val => formatTime(val)
          }
        }
      }
    }
  });

  // ── Donut Chart ──
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(
    document.getElementById("donutChart"), {
    type: "doughnut",
    data: {
      labels: ["Productive","Neutral","Unproductive"],
      datasets: [{
        data: [prod, neut, unprod],
        backgroundColor: ["#00d4a0","#f59e0b","#f43f5e"],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, font: { size: 11 } }
        }
      }
    }
  });

  // ── 7-Day Trend ──
  const last7 = getLast7Days();
  const trendProd   = [];
  const trendUnprod = [];

  for (const day of last7) {
    const dayData = timeData[day] || {};
    let p = 0, u = 0;
    for (const info of Object.values(dayData)) {
      if (info.category === "productive")        p += info.seconds;
      else if (info.category === "unproductive") u += info.seconds;
    }
    trendProd.push(Math.round(p / 60));   // convert to minutes
    trendUnprod.push(Math.round(u / 60));
  }

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(
    document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: last7.map(getDayLabel),
      datasets: [
        {
          label: "Productive (min)",
          data: trendProd,
          borderColor: "#00d4a0",
          backgroundColor: "rgba(0,212,160,0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4
        },
        {
          label: "Distraction (min)",
          data: trendUnprod,
          borderColor: "#f43f5e",
          backgroundColor: "rgba(244,63,94,0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: { ticks: { callback: v => v + "m" } }
      }
    }
  });
}

// ── ALL SITES PAGE ────────────────────────────────────────
async function loadSites() {
  const today = getToday();
  const { timeData } = await getData();
  const todayData = timeData[today] || {};

  const sites = Object.entries(todayData)
    .map(([domain, info]) => ({ domain, ...info }))
    .sort((a, b) => b.seconds - a.seconds);

  const total = sites.reduce((sum, s) => sum + s.seconds, 0);
  const tbody = document.getElementById("sitesTable");

  if (!sites.length) {
    tbody.innerHTML = `<tr><td colspan="4"
      style="text-align:center;padding:30px;color:#5a5a7a">
      No data yet today</td></tr>`;
    return;
  }

  tbody.innerHTML = sites.map(site => {
    const pct = total > 0 ? Math.round((site.seconds/total)*100) : 0;
    const cat = site.category || "neutral";
    return `
      <tr>
        <td>${site.domain}</td>
        <td><span class="badge badge-${cat}">${cat}</span></td>
        <td>${formatTime(site.seconds)}</td>
        <td>${pct}%</td>
      </tr>`;
  }).join("");
}

// ── WEEKLY REPORT PAGE ────────────────────────────────────
let weeklyChart;

async function loadWeekly() {
  const { timeData } = await getData();
  const last7 = getLast7Days();

  let wkProd = 0, wkUnprod = 0, wkNeut = 0;
  const prodArr = [], unprodArr = [], neutArr = [];

  for (const day of last7) {
    const dayData = timeData[day] || {};
    let p = 0, u = 0, n = 0;
    for (const info of Object.values(dayData)) {
      if (info.category === "productive")        p += info.seconds;
      else if (info.category === "unproductive") u += info.seconds;
      else                                       n += info.seconds;
    }
    wkProd   += p;
    wkUnprod += u;
    wkNeut   += n;
    prodArr.push(Math.round(p/60));
    unprodArr.push(Math.round(u/60));
    neutArr.push(Math.round(n/60));
  }

  const wkTotal = wkProd + wkUnprod + wkNeut;
  const wkScore = (wkProd + wkUnprod) > 0
    ? Math.round((wkProd / (wkProd + wkUnprod)) * 100) : 0;

  document.getElementById("wkTotal").textContent  = formatTime(wkTotal);
  document.getElementById("wkProd").textContent   = formatTime(wkProd);
  document.getElementById("wkUnprod").textContent = formatTime(wkUnprod);
  document.getElementById("wkScore").textContent  = wkScore + "%";
  document.getElementById("weekLabel").textContent =
    last7[0] + " → " + last7[6];

  // Stacked bar chart
  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(
    document.getElementById("weeklyChart"), {
    type: "bar",
    data: {
      labels: last7.map(getDayLabel),
      datasets: [
        {
          label: "Productive",
          data: prodArr,
          backgroundColor: "#00d4a0",
          borderRadius: 4
        },
        {
          label: "Neutral",
          data: neutArr,
          backgroundColor: "#f59e0b",
          borderRadius: 4
        },
        {
          label: "Distraction",
          data: unprodArr,
          backgroundColor: "#f43f5e",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, ticks: { callback: v => v + "m" } }
      },
      plugins: { legend: { position: "top" } }
    }
  });

  // Heatmap
  const heatmap = document.getElementById("heatmap");
  const maxMins = Math.max(...prodArr.map((p,i) => p + unprodArr[i] + neutArr[i]), 1);

  heatmap.innerHTML = last7.map((day, i) => {
    const mins = prodArr[i] + unprodArr[i] + neutArr[i];
    const intensity = mins / maxMins;
    const score = (prodArr[i] + unprodArr[i]) > 0
      ? Math.round((prodArr[i] / (prodArr[i] + unprodArr[i])) * 100) : 0;
    const bg = `rgba(124,106,255,${0.1 + intensity * 0.8})`;
    return `
      <div class="heat-cell" style="background:${bg}" title="${day}: ${mins}m total">
        <div class="heat-day">${getDayLabel(day)}</div>
        <div style="font-size:11px;color:#e2e2f0;font-weight:bold">${score}%</div>
      </div>`;
  }).join("");
}

// ── SETTINGS PAGE ─────────────────────────────────────────
async function loadSettings() {
  const { customCategories } = await getData();
  renderCustomList(customCategories);
}

function renderCustomList(customCategories) {
  const list = document.getElementById("customList");
  const entries = Object.entries(customCategories);

  if (!entries.length) {
    list.innerHTML = `<div style="color:#5a5a7a;font-size:12px">
      No custom rules yet</div>`;
    return;
  }

  list.innerHTML = entries.map(([domain, cat]) => `
    <div class="custom-item">
      <span>${domain}</span>
      <span class="badge badge-${cat}">${cat}</span>
      <button class="remove-btn" onclick="removeCustomSite('${domain}')">×</button>
    </div>`).join("");
}

async function addCustomSite() {
  const domain = document.getElementById("customDomain").value.trim()
    .replace(/^www\./, "").toLowerCase();
  const cat = document.getElementById("customCat").value;

  if (!domain) return alert("Please enter a domain name");

  const { customCategories } = await getData();
  customCategories[domain] = cat;
  await chrome.storage.local.set({ customCategories });

  document.getElementById("customDomain").value = "";
  renderCustomList(customCategories);
}

async function removeCustomSite(domain) {
  const { customCategories } = await getData();
  delete customCategories[domain];
  await chrome.storage.local.set({ customCategories });
  renderCustomList(customCategories);
}

// ── EXPORT CSV ────────────────────────────────────────────
async function exportCSV() {
  const { timeData } = await getData();
  const rows = [["Date","Domain","Category","Seconds","Time"]];

  for (const [date, sites] of Object.entries(timeData)) {
    for (const [domain, info] of Object.entries(sites)) {
      rows.push([date, domain, info.category,
        info.seconds, formatTime(info.seconds)]);
    }
  }

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "focuslens-" + getToday() + ".csv";
  a.click();
}

// ── CLEAR DATA ────────────────────────────────────────────
async function clearData() {
  if (confirm("Delete ALL tracking data? This cannot be undone!")) {
    await chrome.storage.local.remove("timeData");
    alert("All data cleared!");
    loadOverview();
    loadSites();
    loadWeekly();
  }
}

// ── NAVIGATION ────────────────────────────────────────────
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    const page = item.dataset.page;

    // Update nav
    document.querySelectorAll(".nav-item")
      .forEach(n => n.classList.remove("active"));
    item.classList.add("active");

    // Show page
    document.querySelectorAll(".page")
      .forEach(p => p.classList.remove("active"));
    document.getElementById("page-" + page)
      .classList.add("active");

    // Load data for page
    if (page === "overview") loadOverview();
    if (page === "sites")    loadSites();
    if (page === "weekly")   loadWeekly();
    if (page === "settings") loadSettings();
  });
});

// ── INIT ──────────────────────────────────────────────────
loadOverview();