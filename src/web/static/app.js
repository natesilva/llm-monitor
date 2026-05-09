const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
];

let comparisonChart = null;
const tileCharts = {};
const activeConfigs = new Set();
let allConfigs = [];

function configColor(index) {
  return COLORS[index % COLORS.length];
}

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function refresh() {
  const data = await fetchJSON("/api/configs");
  allConfigs = data.configs;

  await renderToggles();
  await renderTiles();
  await renderComparison();
  document.getElementById("last-refresh").textContent =
    `Last updated: ${new Date().toLocaleTimeString()}`;
}

async function renderToggles() {
  const container = document.getElementById("toggles");
  container.innerHTML = "";
  allConfigs.forEach((cfg, i) => {
    const btn = document.createElement("button");
    btn.className = `toggle-btn${activeConfigs.has(cfg) ? " active" : ""}`;
    btn.textContent = cfg;
    btn.style.setProperty("--cfg-color", configColor(i));
    btn.addEventListener("click", () => {
      if (activeConfigs.has(cfg)) {
        activeConfigs.delete(cfg);
        btn.classList.remove("active");
      } else {
        activeConfigs.add(cfg);
        btn.classList.add("active");
      }
      renderComparison();
    });
    container.appendChild(btn);
  });

  if (activeConfigs.size === 0 && allConfigs.length > 0) {
    for (const c of allConfigs) activeConfigs.add(c);
    for (const b of container.querySelectorAll(".toggle-btn")) {
      b.classList.add("active");
    }
  }
}

async function renderTiles() {
  const container = document.getElementById("tiles");
  const existing = new Set();

  for (const cfg of allConfigs) {
    existing.add(cfg);

    const metrics = await fetchJSON(
      `/api/metrics?config=${encodeURIComponent(cfg)}&hours=48`,
    );

    if (tileCharts[cfg]) {
      updateTileChart(cfg, metrics);
      continue;
    }

    const tile = document.createElement("div");
    tile.className = "tile";
    tile.id = `tile-${cfg}`;

    if (metrics.dataPoints.length === 0) {
      tile.innerHTML = `
        <div class="tile-header"><span class="tile-label">${cfg}</span></div>
        <div class="empty-tile">No data yet</div>
      `;
    } else {
      tile.innerHTML = `
        <div class="tile-header">
          <span class="tile-label">${cfg}</span>
          <span class="tile-model">${metrics.dataPoints[metrics.dataPoints.length - 1].model || ""}</span>
        </div>
        <div class="tile-canvas-wrap"><canvas class="tile-canvas" id="canvas-${cfg}"></canvas></div>
        <div class="tile-stats">
          <div class="stat"><div class="stat-value">${metrics.stats.avgTps}</div><div class="stat-label">Avg TPS</div></div>
          <div class="stat"><div class="stat-value">${metrics.stats.p50LatencyMs}ms</div><div class="stat-label">P50 Latency</div></div>
          <div class="stat"><div class="stat-value">${metrics.stats.p95LatencyMs}ms</div><div class="stat-label">P95 Latency</div></div>
          <div class="stat"><div class="stat-value">${(metrics.stats.successRate * 100).toFixed(0)}%</div><div class="stat-label">Success</div></div>
          <div class="stat"><div class="stat-value">${metrics.stats.tpsStdDev}</div><div class="stat-label">TPS StdDev</div></div>
        </div>
      `;
    }

    container.appendChild(tile);

    if (metrics.dataPoints.length > 0) {
      const canvas = document.getElementById(`canvas-${cfg}`);
      const colorIdx = allConfigs.indexOf(cfg);
      createTileChart(canvas, metrics, configColor(colorIdx));
    }
  }

  for (const key of Object.keys(tileCharts)) {
    if (!existing.has(key)) {
      const el = document.getElementById(`tile-${key}`);
      if (el) el.remove();
      delete tileCharts[key];
    }
  }
}

function createTileChart(canvas, metrics, color) {
  const labels = metrics.dataPoints.map((d) => {
    const dt = new Date(d.timestamp);
    return dt.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const pointColors = metrics.dataPoints.map((d) =>
    d.httpStatus >= 200 && d.httpStatus < 300 ? color : "#ef4444",
  );

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: metrics.dataPoints.map((d) => d.tps),
          borderColor: color,
          backgroundColor: `${color}20`,
          pointBackgroundColor: pointColors,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          display: true,
          ticks: { maxTicksLimit: 6, color: "#555" },
          grid: { color: "#1f2230" },
        },
        y: {
          display: true,
          ticks: { color: "#555" },
          grid: { color: "#1f2230" },
        },
      },
    },
  });

  tileCharts[metrics.config] = chart;
}

function updateTileChart(cfg, metrics) {
  const chart = tileCharts[cfg];
  if (!chart) return;

  const tile = document.getElementById(`tile-${cfg}`);
  if (!tile) return;

  const colorIdx = allConfigs.indexOf(cfg);
  const color = configColor(colorIdx);

  const labels = metrics.dataPoints.map((d) => {
    const dt = new Date(d.timestamp);
    return dt.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const pointColors = metrics.dataPoints.map((d) =>
    d.httpStatus >= 200 && d.httpStatus < 300 ? color : "#ef4444",
  );

  chart.data.labels = labels;
  chart.data.datasets[0].data = metrics.dataPoints.map((d) => d.tps);
  chart.data.datasets[0].pointBackgroundColor = pointColors;
  chart.update("none");

  const statsEl = tile.querySelector(".tile-stats");
  if (statsEl) {
    const values = statsEl.querySelectorAll(".stat-value");
    if (values.length >= 5) {
      values[0].textContent = metrics.stats.avgTps;
      values[1].textContent = `${metrics.stats.p50LatencyMs}ms`;
      values[2].textContent = `${metrics.stats.p95LatencyMs}ms`;
      values[3].textContent = `${(metrics.stats.successRate * 100).toFixed(0)}%`;
      values[4].textContent = metrics.stats.tpsStdDev;
    }
  }

  const modelEl = tile.querySelector(".tile-model");
  if (modelEl && metrics.dataPoints.length > 0) {
    modelEl.textContent =
      metrics.dataPoints[metrics.dataPoints.length - 1].model || "";
  }
}

async function renderComparison() {
  const canvas = document.getElementById("comparison-chart");
  const emptyEl = document.getElementById("comparison-empty");
  const selected = [...activeConfigs];

  if (selected.length === 0) {
    canvas.style.display = "none";
    emptyEl.style.display = "block";
    if (comparisonChart) {
      comparisonChart.destroy();
      comparisonChart = null;
    }
    return;
  }

  canvas.style.display = "block";
  emptyEl.style.display = "none";

  const result = await fetchJSON(
    `/api/metrics/compare?hours=24&configs=${selected.map(encodeURIComponent).join(",")}`,
  );

  const datasets = result.series.map((s, i) => {
    const colorIdx = allConfigs.indexOf(s.config);
    const color = configColor(colorIdx >= 0 ? colorIdx : i);
    return {
      label: s.config,
      data: s.dataPoints.map((d) => ({ x: new Date(d.timestamp), y: d.tps })),
      borderColor: color,
      backgroundColor: "transparent",
      pointRadius: 2,
      tension: 0.3,
    };
  });

  if (comparisonChart) {
    comparisonChart.data.datasets = datasets;
    comparisonChart.update("none");
  } else {
    comparisonChart = new Chart(canvas, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#aaa",
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: { tooltipFormat: "MMM d, HH:mm" },
            ticks: { color: "#555" },
            grid: { color: "#1f2230" },
          },
          y: {
            title: { display: true, text: "Tokens/sec", color: "#888" },
            ticks: { color: "#555" },
            grid: { color: "#1f2230" },
          },
        },
      },
    });
  }
}

refresh();
setInterval(refresh, 60_000);
