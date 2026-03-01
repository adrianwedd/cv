/**
 * GitHub Activity Visualization
 * Four-panel display: Streamgraph, Language Ring, Constellation, Heatmap
 * Pure DOM/Canvas/SVG — no external libraries
 */

(function () {
  'use strict';

  const PALETTE = [
    '#8ac7d9', '#6ba3b5', '#4d8091', '#9dd4e3', '#b5e0eb',
    '#c9a8d9', '#a88cb5', '#7dd9b5', '#d9c78a', '#d9968a',
    '#8a9dd9', '#d98abd'
  ];

  // Any repo not in the map falls to "Other" (index 4)
  const CATEGORY_MAP = {
    'cygnet': 0, 'AI-SWA': 0, 'failure-first-embodied-ai': 0, 'failure-first': 0,
    'VERITAS': 1, 'ADHDo': 1, 'neuroconnect': 1, 'emdr-agent': 1,
    'evolve-evolution': 2, 'evolvechiropractictas.com': 2, 'truecapacity.coach': 2, 'annicalarsdotter.com': 2,
    'notebooklm-automation': 3, 'rlm-mcp': 3, 'cv': 3, 'Dx0': 3,
    'orbitr': 4, 'squishmallowdex': 4, 'TEL3SIS': 4,
    // Common repos that appear in data
    'terminal': 0,
  };
  const CATEGORY_NAMES = ['AI & Agents', 'Health & Safety', 'Client Delivery', 'Tooling', 'Other'];
  const CATEGORY_COLORS = ['#8ac7d9', '#c9a8d9', '#7dd9b5', '#d9c78a', '#d98abd'];

  let activityData = null;
  let isPrinting = false;

  function init() {
    fetch('data/github-activity.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        activityData = data;
        observeEntry();
      })
      .catch(() => {});
  }

  function observeEntry() {
    const section = document.getElementById('activity');
    if (!section) return;
    if (!('IntersectionObserver' in window)) {
      renderAll();
      return;
    }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        renderAll();
      }
    }, { threshold: 0.1 });
    obs.observe(section);
  }

  function renderAll() {
    renderStreamgraph();
    renderLanguageRing();
    renderHeatmap();
    staggerEntrance();
  }

  function staggerEntrance() {
    const panels = document.querySelectorAll('.activity-panel');
    panels.forEach((p, i) => {
      p.style.opacity = '0';
      p.style.transform = 'translateY(12px)';
      setTimeout(() => {
        p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      }, i * 100);
    });
  }

  // ── Panel 1: Streamgraph ──────────────────────────────

  function renderStreamgraph() {
    const container = document.getElementById('viz-streamgraph');
    if (!container || !activityData.commit_timeline.length) return;

    const weeks = activityData.commit_timeline;
    const W = container.clientWidth || 320;
    const H = 140;

    // Group repos into categories
    const catTotals = [];
    for (const week of weeks) {
      const cats = new Array(CATEGORY_NAMES.length).fill(0);
      for (const [repo, count] of Object.entries(week.repos)) {
        const cat = CATEGORY_MAP[repo] ?? (CATEGORY_NAMES.length - 1);
        cats[Math.min(cat, CATEGORY_NAMES.length - 1)] += count;
      }
      catTotals.push(cats);
    }

    const maxTotal = Math.max(...catTotals.map(c => c.reduce((a, b) => a + b, 0)), 1);
    const ns = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ns.setAttribute('viewBox', `0 0 ${W} ${H}`);
    ns.setAttribute('width', '100%');
    ns.setAttribute('height', H);
    ns.setAttribute('role', 'img');
    ns.setAttribute('aria-label', 'Commit activity streamgraph showing weekly commits by category');

    const n = catTotals.length;
    const xStep = n > 1 ? W / (n - 1) : W;

    // Build stacked areas from bottom — draw back-to-front so top categories overlay
    for (let cat = CATEGORY_NAMES.length - 1; cat >= 0; cat--) {
      const topPoints = [];
      const botPoints = [];

      for (let i = 0; i < n; i++) {
        const x = i * xStep;
        let yBot = 0;
        for (let c = 0; c < cat; c++) {
          yBot += catTotals[i][c];
        }
        const yTop = yBot + catTotals[i][cat];
        // Map 0..maxTotal -> H*0.90..H*0.05 (leave bottom margin for labels)
        const scaledBot = H - 14 - (yBot / maxTotal) * (H * 0.78);
        const scaledTop = H - 14 - (yTop / maxTotal) * (H * 0.78);
        topPoints.push({ x, y: scaledTop });
        botPoints.push({ x, y: scaledBot });
      }

      const topPath = smoothLine(topPoints);
      const botReversed = [...botPoints].reverse();
      const botPath = smoothLine(botReversed);
      // Strip leading "M x,y" from botPath so we can append it after a lineto
      const botPathBody = botPath.replace(/^M\s*[\d.eE+\-]+\s*,\s*[\d.eE+\-]+\s*/, '');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const lastTop = topPoints[topPoints.length - 1];
      const firstBot = botReversed[0]; // = last botPoint
      path.setAttribute('d',
        `${topPath} L ${firstBot.x},${firstBot.y} ${botPathBody} Z`
      );
      path.setAttribute('fill', CATEGORY_COLORS[cat]);
      path.setAttribute('fill-opacity', '0.75');
      path.setAttribute('stroke', 'var(--color-background)');
      path.setAttribute('stroke-width', '0.5');
      ns.appendChild(path);
    }

    // Month labels along bottom
    if (weeks.length > 0) {
      const startDate = new Date(weeks[0].week);
      for (let i = 0; i < n; i += 4) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i * 7);
        const label = d.toLocaleDateString('en-AU', { month: 'short' });
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', Math.min(i * xStep, W - 16));
        text.setAttribute('y', H - 2);
        text.setAttribute('fill', 'var(--color-text-muted)');
        text.setAttribute('font-size', '8');
        text.setAttribute('font-family', 'var(--font-family-mono)');
        text.textContent = label;
        ns.appendChild(text);
      }
    }

    container.textContent = '';
    container.appendChild(ns);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'viz-legend';
    for (let i = 0; i < CATEGORY_NAMES.length; i++) {
      const item = document.createElement('span');
      item.className = 'viz-legend-item';
      const dot = document.createElement('span');
      dot.className = 'viz-legend-dot';
      dot.style.backgroundColor = CATEGORY_COLORS[i];
      item.appendChild(dot);
      item.appendChild(document.createTextNode(CATEGORY_NAMES[i]));
      legend.appendChild(item);
    }
    container.appendChild(legend);
  }

  function smoothLine(points) {
    if (points.length < 2) return `M ${points[0].x},${points[0].y}`;
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const cpx = (prev.x + cur.x) / 2;
      d += ` C ${cpx},${prev.y} ${cpx},${cur.y} ${cur.x},${cur.y}`;
    }
    return d;
  }

  // ── Panel 2: Language Ring ────────────────────────────

  function renderLanguageRing() {
    const container = document.getElementById('viz-languages');
    if (!container || !activityData.languages) return;

    const entries = Object.entries(activityData.languages);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (!total) return;

    const SIZE = 180;
    const CX = SIZE / 2;
    const CY = SIZE / 2;

    const ns = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ns.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    ns.setAttribute('width', SIZE);
    ns.setAttribute('height', SIZE);
    ns.setAttribute('role', 'img');
    ns.setAttribute('aria-label', 'Language distribution ring chart');

    // Inner ring: top 5, outer ring: rest (up to 7 more)
    const top5 = entries.slice(0, 5);
    const rest = entries.slice(5, 12);

    drawRing(ns, top5, total, CX, CY, 46, 70, PALETTE);
    if (rest.length > 0) {
      drawRing(ns, rest, total, CX, CY, 73, 85, PALETTE.slice(5));
    }

    // Center text
    const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerText.setAttribute('x', CX);
    centerText.setAttribute('y', CY - 5);
    centerText.setAttribute('text-anchor', 'middle');
    centerText.setAttribute('dominant-baseline', 'middle');
    centerText.setAttribute('fill', 'var(--color-text-primary)');
    centerText.setAttribute('font-size', '18');
    centerText.setAttribute('font-family', 'var(--font-family-mono)');
    centerText.textContent = entries.length;
    ns.appendChild(centerText);

    const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subText.setAttribute('x', CX);
    subText.setAttribute('y', CY + 11);
    subText.setAttribute('text-anchor', 'middle');
    subText.setAttribute('fill', 'var(--color-text-muted)');
    subText.setAttribute('font-size', '8');
    subText.setAttribute('font-family', 'var(--font-family-mono)');
    subText.textContent = 'languages';
    ns.appendChild(subText);

    container.textContent = '';
    container.appendChild(ns);

    // Labels below
    const legend = document.createElement('div');
    legend.className = 'viz-legend';
    for (let i = 0; i < Math.min(5, top5.length); i++) {
      const pct = ((top5[i][1] / total) * 100).toFixed(0);
      const item = document.createElement('span');
      item.className = 'viz-legend-item';
      const dot = document.createElement('span');
      dot.className = 'viz-legend-dot';
      dot.style.backgroundColor = PALETTE[i];
      item.appendChild(dot);
      item.appendChild(document.createTextNode(`${top5[i][0]} ${pct}%`));
      legend.appendChild(item);
    }
    container.appendChild(legend);
  }

  function drawRing(svg, entries, total, cx, cy, r1, r2, colors) {
    let angle = -Math.PI / 2;
    entries.forEach(([, value], i) => {
      const sweep = (value / total) * Math.PI * 2;
      if (sweep < 0.015) return;
      const GAP = 0.03; // radians gap between segments
      const a1 = angle + GAP / 2;
      const a2 = angle + sweep - GAP / 2;
      const x1i = cx + r1 * Math.cos(a1);
      const y1i = cy + r1 * Math.sin(a1);
      const x1o = cx + r2 * Math.cos(a1);
      const y1o = cy + r2 * Math.sin(a1);
      const x2i = cx + r1 * Math.cos(a2);
      const y2i = cy + r1 * Math.sin(a2);
      const x2o = cx + r2 * Math.cos(a2);
      const y2o = cy + r2 * Math.sin(a2);
      const large = (sweep - GAP) > Math.PI ? 1 : 0;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', [
        `M ${x1o} ${y1o}`,
        `A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o}`,
        `L ${x2i} ${y2i}`,
        `A ${r1} ${r1} 0 ${large} 0 ${x1i} ${y1i}`,
        'Z'
      ].join(' '));
      path.setAttribute('fill', colors[i % colors.length]);
      path.setAttribute('fill-opacity', '0.88');
      svg.appendChild(path);
      angle += sweep;
    });
  }

  // ── Panel 3: Heatmap ──────────────────────────────────

  function renderHeatmap() {
    const container = document.getElementById('viz-heatmap');
    if (!container) return;

    // Build day map from both heatmap and commit_timeline data
    const dayMap = {};
    for (const e of (activityData.heatmap || [])) {
      dayMap[e.date] = (dayMap[e.date] || 0) + e.count;
    }
    // From commit_timeline (weekly — mark the week start day)
    for (const w of (activityData.commit_timeline || [])) {
      const total = Object.values(w.repos).reduce((a, b) => a + b, 0);
      if (total > 0 && !dayMap[w.week]) {
        dayMap[w.week] = total;
      }
    }
    if (!Object.keys(dayMap).length) return;

    let maxCount = 0;
    for (const c of Object.values(dayMap)) {
      if (c > maxCount) maxCount = c;
    }

    const today = new Date();
    const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Start from the Sunday on or before the earliest data point
    const earliest = Object.keys(dayMap).sort()[0];
    const earliestDate = new Date(earliest);
    const startDay = new Date(earliestDate);
    startDay.setDate(startDay.getDate() - startDay.getDay());
    const WEEKS = Math.ceil((todayNorm - startDay) / (7 * 86400000)) + 1;

    // Build month labels: track which grid column each month starts in
    const monthLabelData = []; // { colIndex, label }
    let lastMonth = -1;

    const cols = [];
    for (let w = 0; w < WEEKS; w++) {
      const weekStart = new Date(startDay);
      weekStart.setDate(startDay.getDate() + w * 7);

      if (weekStart.getMonth() !== lastMonth && weekStart.getDate() <= 7) {
        monthLabelData.push({
          col: w,
          label: weekStart.toLocaleDateString('en-AU', { month: 'short' })
        });
        lastMonth = weekStart.getMonth();
      }

      const colCells = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDay);
        cellDate.setDate(startDay.getDate() + w * 7 + d);
        const key = cellDate.toISOString().slice(0, 10);
        const count = dayMap[key] || 0;
        const level = maxCount > 0 ? Math.min(Math.ceil((count / maxCount) * 4), 4) : 0;
        colCells.push({ level, key, count });
      }
      cols.push(colCells);
    }

    // Wrapper (handles overflow on very small screens)
    const wrapper = document.createElement('div');
    wrapper.className = 'heatmap-wrapper';

    // Month labels row — use CSS grid matching heatmap-grid
    const monthRow = document.createElement('div');
    monthRow.className = 'heatmap-months';
    monthRow.style.gridTemplateColumns = `repeat(${WEEKS}, 1fr)`;

    for (const { col, label } of monthLabelData) {
      const span = document.createElement('span');
      span.className = 'heatmap-month-label';
      span.textContent = label;
      span.style.gridColumnStart = col + 1;
      monthRow.appendChild(span);
    }

    // Grid of cells
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';
    grid.style.gridTemplateColumns = `repeat(${WEEKS}, 1fr)`;

    for (const colCells of cols) {
      const col = document.createElement('div');
      col.className = 'heatmap-col';
      for (const { level, key, count } of colCells) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.dataset.level = level;
        cell.dataset.date = key;
        cell.dataset.count = count;
        col.appendChild(cell);
      }
      grid.appendChild(col);
    }

    wrapper.appendChild(monthRow);
    wrapper.appendChild(grid);

    // Remove label element, replace container children
    const labelEl = container.querySelector('.activity-panel-label');
    container.textContent = '';
    if (labelEl) container.appendChild(labelEl);
    container.appendChild(wrapper);
  }

  // ── Print support ─────────────────────────────────────

  window.addEventListener('beforeprint', () => {
    isPrinting = true;
  });

  window.addEventListener('afterprint', () => {
    isPrinting = false;
  });

  // ── Boot ──────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
