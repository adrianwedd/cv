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

  const CATEGORY_MAP = {
    'cygnet': 0, 'AI-SWA': 0, 'failure-first-embodied-ai': 0, 'failure-first': 0,
    'VERITAS': 1, 'ADHDo': 1, 'neuroconnect': 1, 'emdr-agent': 1,
    'evolve-evolution': 2, 'evolvechiropractictas.com': 2, 'truecapacity.coach': 2, 'annicalarsdotter.com': 2,
    'notebooklm-automation': 3, 'rlm-mcp': 3, 'cv': 3, 'Dx0': 3,
    'orbitr': 4, 'squishmallowdex': 4, 'TEL3SIS': 4
  };
  const CATEGORY_NAMES = ['AI & Agents', 'Health & Safety', 'Client Delivery', 'Tooling', 'Creative'];
  const CATEGORY_COLORS = ['#8ac7d9', '#c9a8d9', '#7dd9b5', '#d9c78a', '#d98abd'];

  let activityData = null;
  let constellationCanvas = null;
  let constellationCtx = null;
  let constellationAnimId = null;
  let constellationStartTime = 0;
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
    renderConstellation();
    renderHeatmap();
    staggerEntrance();
  }

  function staggerEntrance() {
    const panels = document.querySelectorAll('.activity-panel');
    panels.forEach((p, i) => {
      p.style.opacity = '0';
      p.style.transform = 'translateY(16px)';
      setTimeout(() => {
        p.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
      }, i * 120);
    });
  }

  // ── Panel 1: Streamgraph ──────────────────────────────

  function renderStreamgraph() {
    const container = document.getElementById('viz-streamgraph');
    if (!container || !activityData.commit_timeline.length) return;

    const weeks = activityData.commit_timeline;
    const W = container.clientWidth || 340;
    const H = 160;

    // Group repos into categories
    const catTotals = [];
    for (const week of weeks) {
      const cats = new Array(CATEGORY_NAMES.length).fill(0);
      for (const [repo, count] of Object.entries(week.repos)) {
        const cat = CATEGORY_MAP[repo] ?? CATEGORY_NAMES.length - 1;
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
    const xStep = W / Math.max(n - 1, 1);

    // Build stacked areas from bottom
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
        const scaledBot = H - (yBot / maxTotal) * (H * 0.85) - H * 0.05;
        const scaledTop = H - (yTop / maxTotal) * (H * 0.85) - H * 0.05;
        topPoints.push({ x, y: scaledTop });
        botPoints.push({ x, y: scaledBot });
      }

      // Smooth path using cardinal spline approximation
      const topPath = smoothLine(topPoints);
      const botPath = smoothLine(botPoints.reverse());

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `${topPath} L ${botPoints[0].x},${botPoints[0].y} ${botPath.replace(/^M\s*[\d.]+,[\d.]+\s*/, '')} Z`);
      path.setAttribute('fill', CATEGORY_COLORS[cat]);
      path.setAttribute('fill-opacity', '0.7');
      path.setAttribute('stroke', 'none');
      ns.appendChild(path);
    }

    // Month labels
    const startDate = new Date(weeks[0].week);
    for (let i = 0; i < n; i += 4) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * 7);
      const label = d.toLocaleDateString('en-AU', { month: 'short' });
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', i * xStep);
      text.setAttribute('y', H - 2);
      text.setAttribute('fill', 'var(--color-text-muted)');
      text.setAttribute('font-size', '9');
      text.setAttribute('font-family', 'var(--font-family-mono)');
      text.textContent = label;
      ns.appendChild(text);
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
      const lbl = document.createTextNode(CATEGORY_NAMES[i]);
      item.appendChild(lbl);
      legend.appendChild(item);
    }
    container.appendChild(legend);
  }

  function smoothLine(points) {
    if (points.length < 2) return '';
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

    const SIZE = 200;
    const CX = SIZE / 2;
    const CY = SIZE / 2;

    const ns = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ns.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    ns.setAttribute('width', '100%');
    ns.setAttribute('height', SIZE);
    ns.setAttribute('role', 'img');
    ns.setAttribute('aria-label', 'Language distribution ring chart');

    // Inner ring: top 5, outer ring: rest
    const top5 = entries.slice(0, 5);
    const rest = entries.slice(5, 12);

    drawRing(ns, top5, total, CX, CY, 50, 75, PALETTE);
    drawRing(ns, rest, total, CX, CY, 78, 92, PALETTE.slice(5));

    // Center text
    const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerText.setAttribute('x', CX);
    centerText.setAttribute('y', CY - 4);
    centerText.setAttribute('text-anchor', 'middle');
    centerText.setAttribute('fill', 'var(--color-text-primary)');
    centerText.setAttribute('font-size', '16');
    centerText.setAttribute('font-family', 'var(--font-family-mono)');
    centerText.textContent = entries.length;
    ns.appendChild(centerText);

    const subText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subText.setAttribute('x', CX);
    subText.setAttribute('y', CY + 12);
    subText.setAttribute('text-anchor', 'middle');
    subText.setAttribute('fill', 'var(--color-text-muted)');
    subText.setAttribute('font-size', '9');
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
      if (sweep < 0.01) return;
      const x1i = cx + r1 * Math.cos(angle);
      const y1i = cy + r1 * Math.sin(angle);
      const x1o = cx + r2 * Math.cos(angle);
      const y1o = cy + r2 * Math.sin(angle);
      const x2i = cx + r1 * Math.cos(angle + sweep);
      const y2i = cy + r1 * Math.sin(angle + sweep);
      const x2o = cx + r2 * Math.cos(angle + sweep);
      const y2o = cy + r2 * Math.sin(angle + sweep);
      const large = sweep > Math.PI ? 1 : 0;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', [
        `M ${x1o} ${y1o}`,
        `A ${r2} ${r2} 0 ${large} 1 ${x2o} ${y2o}`,
        `L ${x2i} ${y2i}`,
        `A ${r1} ${r1} 0 ${large} 0 ${x1i} ${y1i}`,
        'Z'
      ].join(' '));
      path.setAttribute('fill', colors[i % colors.length]);
      path.setAttribute('fill-opacity', '0.85');
      path.setAttribute('stroke', 'var(--color-background)');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
      angle += sweep;
    });
  }

  // ── Panel 3: Repository Constellation ──────────────────

  function renderConstellation() {
    const container = document.getElementById('viz-constellation');
    if (!container || !activityData.repositories.length) return;

    constellationCanvas = document.createElement('canvas');
    constellationCanvas.className = 'constellation-canvas';
    constellationCanvas.setAttribute('role', 'img');
    constellationCanvas.setAttribute('aria-label', 'Repository constellation showing project relationships');
    container.textContent = '';
    container.appendChild(constellationCanvas);

    constellationCtx = constellationCanvas.getContext('2d');
    constellationStartTime = performance.now();

    sizeConstellationCanvas();
    window.addEventListener('resize', sizeConstellationCanvas);
    tickConstellation();
  }

  function sizeConstellationCanvas() {
    if (!constellationCanvas) return;
    const container = constellationCanvas.parentElement;
    const w = container.clientWidth || 340;
    const h = 200;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    constellationCanvas.width = w * dpr;
    constellationCanvas.height = h * dpr;
    constellationCanvas.style.width = w + 'px';
    constellationCanvas.style.height = h + 'px';
    constellationCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tickConstellation() {
    if (isPrinting) return;
    drawConstellation(performance.now());
    constellationAnimId = requestAnimationFrame(tickConstellation);
  }

  function drawConstellation(now) {
    const ctx = constellationCtx;
    const canvas = constellationCanvas;
    if (!ctx || !canvas) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    ctx.clearRect(0, 0, W, H);

    const repos = activityData.repositories.slice(0, 18);
    const elapsed = (now - constellationStartTime) / 1000;

    // Position nodes in a relaxed layout — golden angle spiral with drift
    const nodes = repos.map((r, i) => {
      const activity = r.issues + r.commits;
      const maxActivity = repos[0].issues + repos[0].commits;
      const radius = 3 + (activity / maxActivity) * 14;
      const cat = CATEGORY_MAP[r.name] ?? 4;

      // Golden angle spiral
      const ga = 2.399963;
      const baseAngle = i * ga;
      const baseR = 25 + Math.sqrt(i) * 28;

      // Gentle orbital drift (30s period)
      const drift = elapsed * (0.02 + i * 0.003);
      const angle = baseAngle + drift;

      const x = W / 2 + baseR * Math.cos(angle);
      const y = H / 2 + baseR * Math.sin(angle) * 0.65;

      return { x, y, radius, cat, name: r.name, lang: r.language };
    });

    // Draw connections for shared tech categories
    ctx.lineWidth = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].cat === nodes[j].cat) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = 0.08 * (1 - dist / 160);
            ctx.strokeStyle = CATEGORY_COLORS[nodes[i].cat] || '#8ac7d9';
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
    }

    // Draw nodes
    for (const node of nodes) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = CATEGORY_COLORS[node.cat] || '#8ac7d9';
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();

      // Label for large nodes
      if (node.radius > 8) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#a8b3c2';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 10);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── Panel 4: Heatmap ──────────────────────────────────

  function renderHeatmap() {
    const container = document.getElementById('viz-heatmap');
    if (!container) return;

    // Build day map from both heatmap and commit_timeline data
    const dayMap = {};
    // From heatmap entries (daily granularity where available)
    for (const e of (activityData.heatmap || [])) {
      dayMap[e.date] = (dayMap[e.date] || 0) + e.count;
    }
    // From commit_timeline (weekly — spread across the week)
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

    const end = new Date();
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';

    // 52 weeks x 7 days
    const WEEKS = 52;
    const today = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - (WEEKS * 7 - 1) - startDay.getDay());

    const monthLabels = document.createElement('div');
    monthLabels.className = 'heatmap-months';
    let lastMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const col = document.createElement('div');
      col.className = 'heatmap-col';

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startDay);
        cellDate.setDate(startDay.getDate() + w * 7 + d);
        const key = cellDate.toISOString().slice(0, 10);
        const count = dayMap[key] || 0;
        const level = maxCount > 0 ? Math.min(Math.ceil((count / maxCount) * 4), 4) : 0;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.dataset.level = level;
        cell.dataset.date = key;
        cell.dataset.count = count;
        col.appendChild(cell);
      }

      // Month label
      const weekStart = new Date(startDay);
      weekStart.setDate(startDay.getDate() + w * 7);
      if (weekStart.getMonth() !== lastMonth && weekStart.getDate() <= 7) {
        const label = document.createElement('span');
        label.className = 'heatmap-month-label';
        label.textContent = weekStart.toLocaleDateString('en-AU', { month: 'short' });
        label.style.gridColumnStart = w + 1;
        monthLabels.appendChild(label);
        lastMonth = weekStart.getMonth();
      }

      grid.appendChild(col);
    }

    container.textContent = '';
    container.appendChild(monthLabels);
    container.appendChild(grid);
  }

  // ── Print support ─────────────────────────────────────

  window.addEventListener('beforeprint', () => {
    isPrinting = true;
    if (constellationAnimId) {
      cancelAnimationFrame(constellationAnimId);
      constellationAnimId = null;
    }
    // Freeze constellation at current state (already drawn)
  });

  window.addEventListener('afterprint', () => {
    isPrinting = false;
    if (constellationCanvas && !constellationAnimId) {
      tickConstellation();
    }
  });

  // ── Boot ──────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
