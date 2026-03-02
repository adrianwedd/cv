/**
 * GitHub Activity Visualization
 * Three panels: Streamgraph, Language Ring, Commit Bars
 * Pure DOM/Canvas/SVG — no external libraries
 * All panels interactive on hover
 */

(function () {
  'use strict';

  // Dark theme palette (light colours on dark background)
  const PALETTE_DARK = [
    '#8ac7d9', '#6ba3b5', '#4d8091', '#9dd4e3', '#b5e0eb',
    '#c9a8d9', '#a88cb5', '#7dd9b5', '#d9c78a', '#d9968a',
    '#8a9dd9', '#d98abd'
  ];
  // Light theme palette (darkened for WCAG AA contrast on #f5f5f0)
  const PALETTE_LIGHT = [
    '#3a8a9e', '#3d7080', '#2d5a6b', '#3a8899', '#358590',
    '#8a5a9e', '#6e4d80', '#3a9e75', '#9e8a3a', '#9e5a3a',
    '#3a4d9e', '#9e3a80'
  ];
  const CATEGORY_COLORS_DARK = ['#8ac7d9', '#c9a8d9', '#7dd9b5', '#d9c78a', '#d98abd'];
  const CATEGORY_COLORS_LIGHT = ['#3a8a9e', '#8a5a9e', '#3a9e75', '#9e8a3a', '#9e3a80'];

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }
  function getPalette() { return isLightTheme() ? PALETTE_LIGHT : PALETTE_DARK; }
  function getCategoryColors() { return isLightTheme() ? CATEGORY_COLORS_LIGHT : CATEGORY_COLORS_DARK; }

  const CATEGORY_MAP = {
    // AI & Agents
    'cygnet': 0, 'AI-SWA': 0, 'failure-first-embodied-ai': 0, 'failure-first': 0,
    'terminal': 0, 'orchestrix': 0, 'personal-intelligence-node': 0,
    'claude-code-skills-peeps-for-claude': 0, 'lunar_tools_prototypes': 0,
    // Health & Safety
    'VERITAS': 1, 'ADHDo': 1, 'neuroconnect': 1, 'emdr-agent': 1,
    // Client Delivery
    'evolve-evolution': 2, 'evolvechiropractictas.com': 2, 'truecapacity.coach': 2, 'annicalarsdotter.com': 2,
    'local-business-intelligence': 2,
    // Tooling
    'notebooklm-automation': 3, 'rlm-mcp': 3, 'cv': 3, 'Dx0': 3,
    'grid2_repo': 3, 'adrianwedd': 3, 'adrianwedd.com': 3,
    // Other
    'orbitr': 4, 'squishmallowdex': 4, 'TEL3SIS': 4,
    'strategic-acquisitions': 4, 'Enchanted-Garden-Tycoon': 4,
    'This-Wasn-t-in-the-Brochure': 4, 'why-demonstrated-risk-is-ignored': 4,
    'Footnotes-at-the-Edge-of-Reality': 4,
  };
  const CATEGORY_NAMES = ['AI & Agents', 'Health & Safety', 'Client Delivery', 'Tooling', 'Other'];

  let activityData = null;
  let tooltipEl = null;

  // ── Shared tooltip ─────────────────────────────────────

  function getTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'viz-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(builder, e) {
    const t = getTooltip();
    t.textContent = '';
    builder(t);
    t.style.opacity = '1';
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const t = getTooltip();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = e.clientX + 14;
    let y = e.clientY - 10;
    // Flip left if overflowing right
    if (x + 250 > vw) x = e.clientX - 254;
    // Flip up if overflowing bottom
    if (y + 120 > vh) y = e.clientY - 120;
    // Clamp to viewport edges
    x = Math.max(0, Math.min(x, vw - 250));
    y = Math.max(0, Math.min(y, vh - 120));
    t.style.left = x + 'px';
    t.style.top = y + 'px';
  }

  function hideTooltip() {
    const t = getTooltip();
    t.style.opacity = '0';
  }

  function tooltipLine(parent, text, color) {
    const row = document.createElement('div');
    row.className = 'viz-tooltip-row';
    if (color) {
      const dot = document.createElement('span');
      dot.className = 'viz-tooltip-dot';
      dot.style.background = color;
      row.appendChild(dot);
    }
    const span = document.createElement('span');
    span.textContent = text;
    row.appendChild(span);
    parent.appendChild(row);
  }

  function fmtDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Init ──────────────────────────────────────────────

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
    renderCommitHeatmap();
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

  function buildCatTotals(weeks) {
    return weeks.map(week => {
      const cats = new Array(CATEGORY_NAMES.length).fill(0);
      for (const [repo, count] of Object.entries(week.repos)) {
        const cat = CATEGORY_MAP[repo] ?? (CATEGORY_NAMES.length - 1);
        cats[Math.min(cat, CATEGORY_NAMES.length - 1)] += count;
      }
      return cats;
    });
  }

  function renderStreamgraph() {
    const container = document.getElementById('viz-streamgraph');
    if (!container || !activityData.commit_timeline.length) return;

    const weeks = activityData.commit_timeline;
    const catTotals = buildCatTotals(weeks);
    const W = container.clientWidth || 320;
    const H = 140;
    const BOTTOM = 14; // space for month labels

    const maxTotal = Math.max(...catTotals.map(c => c.reduce((a, b) => a + b, 0)), 1);
    const n = catTotals.length;
    const xStep = n > 1 ? W / (n - 1) : W;

    const ns = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ns.setAttribute('viewBox', `0 0 ${W} ${H}`);
    ns.setAttribute('width', '100%');
    ns.setAttribute('height', H);
    ns.setAttribute('role', 'img');
    ns.setAttribute('aria-label', 'Commit activity streamgraph by category over time');
    ns.style.cursor = 'crosshair';
    ns.style.overflow = 'visible';

    // Build stacked area paths
    for (let cat = CATEGORY_NAMES.length - 1; cat >= 0; cat--) {
      const topPoints = [];
      const botPoints = [];
      for (let i = 0; i < n; i++) {
        const x = i * xStep;
        let yBot = 0;
        for (let c = 0; c < cat; c++) yBot += catTotals[i][c];
        const yTop = yBot + catTotals[i][cat];
        const scaledBot = H - BOTTOM - (yBot / maxTotal) * (H * 0.78);
        const scaledTop = H - BOTTOM - (yTop / maxTotal) * (H * 0.78);
        topPoints.push({ x, y: scaledTop });
        botPoints.push({ x, y: scaledBot });
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const topPath = smoothLine(topPoints);
      const botReversed = [...botPoints].reverse();
      const botPath = smoothLine(botReversed);
      const botPathBody = botPath.replace(/^M\s*[\d.eE+\-]+\s*,\s*[\d.eE+\-]+\s*/, '');
      const firstBot = botReversed[0];
      path.setAttribute('d', `${topPath} L ${firstBot.x},${firstBot.y} ${botPathBody} Z`);
      path.setAttribute('fill', getCategoryColors()[cat]);
      path.setAttribute('fill-opacity', '0.75');
      path.setAttribute('stroke', 'var(--color-background)');
      path.setAttribute('stroke-width', '0.5');
      path.dataset.cat = cat;
      ns.appendChild(path);
    }

    // Month labels
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

    // Hover indicator: vertical line
    const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    indicator.setAttribute('y1', '0');
    indicator.setAttribute('y2', H - BOTTOM);
    indicator.setAttribute('stroke', 'var(--color-text-muted)');
    indicator.setAttribute('stroke-width', '1');
    indicator.setAttribute('stroke-dasharray', '3,2');
    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 0.1s';
    indicator.style.pointerEvents = 'none';
    ns.appendChild(indicator);

    // Invisible overlay rect for mouse capture
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.setAttribute('width', W);
    overlay.setAttribute('height', H - BOTTOM);
    overlay.setAttribute('fill', 'transparent');
    ns.appendChild(overlay);

    overlay.addEventListener('mousemove', e => {
      const rect = ns.getBoundingClientRect();
      const svgX = (e.clientX - rect.left) * (W / rect.width);
      const idx = Math.max(0, Math.min(n - 1, Math.round(svgX / xStep)));
      const cats = catTotals[idx];
      const total = cats.reduce((a, b) => a + b, 0);
      const week = weeks[idx];

      indicator.setAttribute('x1', idx * xStep);
      indicator.setAttribute('x2', idx * xStep);
      indicator.style.opacity = '1';

      // Dim non-hovered areas — find which category x falls in
      showTooltip(t => {
        const header = document.createElement('div');
        header.className = 'viz-tooltip-header';
        header.textContent = 'Week of ' + fmtDate(week.week);
        t.appendChild(header);
        tooltipLine(t, `Total: ${total} commits`);
        for (let c = 0; c < CATEGORY_NAMES.length; c++) {
          if (cats[c] > 0) {
            tooltipLine(t, `${CATEGORY_NAMES[c]}: ${cats[c]}`, getCategoryColors()[c]);
          }
        }
      }, e);
    });

    overlay.addEventListener('mouseleave', () => {
      indicator.style.opacity = '0';
      hideTooltip();
    });

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
      dot.style.backgroundColor = getCategoryColors()[i];
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

    const top5 = entries.slice(0, 5);
    const rest = entries.slice(5, 12);

    drawRing(ns, top5, total, CX, CY, 46, 70, getPalette(), entries);
    if (rest.length > 0) {
      drawRing(ns, rest, total, CX, CY, 73, 85, getPalette().slice(5), entries);
    }

    // Center text — updates on hover
    const centerVal = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerVal.setAttribute('x', CX);
    centerVal.setAttribute('y', CY - 5);
    centerVal.setAttribute('text-anchor', 'middle');
    centerVal.setAttribute('dominant-baseline', 'middle');
    centerVal.setAttribute('fill', 'var(--color-text-primary)');
    centerVal.setAttribute('font-size', '18');
    centerVal.setAttribute('font-family', 'var(--font-family-mono)');
    centerVal.textContent = entries.length;

    const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerLabel.setAttribute('x', CX);
    centerLabel.setAttribute('y', CY + 11);
    centerLabel.setAttribute('text-anchor', 'middle');
    centerLabel.setAttribute('fill', 'var(--color-text-muted)');
    centerLabel.setAttribute('font-size', '8');
    centerLabel.setAttribute('font-family', 'var(--font-family-mono)');
    centerLabel.textContent = 'languages';

    ns.appendChild(centerVal);
    ns.appendChild(centerLabel);

    // Hover on segments — show language tooltip
    ns.addEventListener('mouseover', e => {
      const path = e.target.closest('path[data-lang]');
      if (!path) return;
      const lang = path.dataset.lang;
      const bytes = parseInt(path.dataset.bytes, 10);
      const pct = ((bytes / total) * 100).toFixed(1);

      // Pulse center text
      centerVal.textContent = pct + '%';
      centerLabel.textContent = lang;

      // Highlight segment
      ns.querySelectorAll('path[data-lang]').forEach(p => {
        p.style.opacity = p === path ? '1' : '0.35';
        p.style.transition = 'opacity 0.15s';
      });

      showTooltip(t => {
        const header = document.createElement('div');
        header.className = 'viz-tooltip-header';
        header.textContent = lang;
        t.appendChild(header);
        tooltipLine(t, `${pct}% of codebase`);
        tooltipLine(t, `${(bytes / 1000).toFixed(0)}k bytes`);
      }, e);
    });

    ns.addEventListener('mousemove', e => {
      if (e.target.closest('path[data-lang]')) moveTooltip(e);
    });

    ns.addEventListener('mouseout', e => {
      const path = e.target.closest('path[data-lang]');
      if (!path) return;
      if (ns.contains(e.relatedTarget) && e.relatedTarget.closest('path[data-lang]')) return;
      // Leaving the ring entirely
      centerVal.textContent = entries.length;
      centerLabel.textContent = 'languages';
      ns.querySelectorAll('path[data-lang]').forEach(p => {
        p.style.opacity = '1';
      });
      hideTooltip();
    });

    container.textContent = '';
    container.appendChild(ns);

    // Legend
    const legend = document.createElement('div');
    legend.className = 'viz-legend';
    for (let i = 0; i < Math.min(5, top5.length); i++) {
      const pct = ((top5[i][1] / total) * 100).toFixed(0);
      const item = document.createElement('span');
      item.className = 'viz-legend-item';
      const dot = document.createElement('span');
      dot.className = 'viz-legend-dot';
      dot.style.backgroundColor = getPalette()[i];
      item.appendChild(dot);
      item.appendChild(document.createTextNode(`${top5[i][0]} ${pct}%`));
      legend.appendChild(item);
    }
    container.appendChild(legend);
  }

  function drawRing(svg, entries, total, cx, cy, r1, r2, colors, allEntries) {
    let angle = -Math.PI / 2;
    entries.forEach(([lang, value], i) => {
      const sweep = (value / total) * Math.PI * 2;
      if (sweep < 0.015) { angle += sweep; return; }
      const GAP = 0.03;
      const a1 = angle + GAP / 2;
      const a2 = angle + sweep - GAP / 2;
      const x1i = cx + r1 * Math.cos(a1), y1i = cy + r1 * Math.sin(a1);
      const x1o = cx + r2 * Math.cos(a1), y1o = cy + r2 * Math.sin(a1);
      const x2i = cx + r1 * Math.cos(a2), y2i = cy + r1 * Math.sin(a2);
      const x2o = cx + r2 * Math.cos(a2), y2o = cy + r2 * Math.sin(a2);
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
      path.dataset.lang = lang;
      path.dataset.bytes = value;
      path.style.cursor = 'pointer';
      svg.appendChild(path);
      angle += sweep;
    });
  }

  // ── Panel 3: Commit Heatmap (weekly totals bar chart) ─

  function renderCommitHeatmap() {
    const container = document.getElementById('viz-heatmap');
    if (!container || !activityData.heatmap || !activityData.heatmap.length) return;

    const weeks = activityData.heatmap;
    const maxCount = Math.max(...weeks.map(w => w.count), 1);

    const W = container.clientWidth || 640;
    const H = 120;
    const BOTTOM = 16;
    const CHART_H = H - BOTTOM;
    const n = weeks.length;
    const barW = Math.max(2, (W / n) - 1.5);
    const xStep = W / n;

    const ns = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ns.setAttribute('viewBox', `0 0 ${W} ${H}`);
    ns.setAttribute('width', '100%');
    ns.setAttribute('height', H);
    ns.setAttribute('role', 'img');
    ns.setAttribute('aria-label', 'Weekly commit totals');
    ns.style.cursor = 'default';
    ns.style.overflow = 'visible';

    const primaryColor = isLightTheme() ? '#44717f' : '#8ac7d9';
    const barGroups = [];

    for (let i = 0; i < n; i++) {
      const count = weeks[i].count;
      const x = i * xStep + (xStep - barW) / 2;
      const barH = Math.max(1, (count / maxCount) * CHART_H);
      const y = CHART_H - barH;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barW);
      rect.setAttribute('height', barH);
      rect.setAttribute('fill', primaryColor);
      rect.setAttribute('fill-opacity', count > 0 ? (0.3 + 0.7 * (count / maxCount)).toFixed(2) : '0.08');
      rect.setAttribute('rx', '1');
      rect.style.cursor = 'pointer';
      rect.dataset.week = i;
      ns.appendChild(rect);
      barGroups.push({ rect, count, week: weeks[i] });
    }

    // Month labels
    let lastMonth = -1;
    for (let i = 0; i < n; i++) {
      const d = new Date(weeks[i].date + 'T00:00:00');
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        const label = d.toLocaleDateString('en-AU', { month: 'short' });
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', i * xStep);
        text.setAttribute('y', H - 2);
        text.setAttribute('fill', 'var(--color-text-muted)');
        text.setAttribute('font-size', '8');
        text.setAttribute('font-family', 'var(--font-family-mono)');
        text.textContent = label;
        ns.appendChild(text);
      }
    }

    // Hover
    barGroups.forEach(({ rect, count, week }) => {
      rect.addEventListener('mouseenter', e => {
        barGroups.forEach(({ rect: r }) => {
          r.style.opacity = r === rect ? '1' : '0.4';
          r.style.transition = 'opacity 0.12s';
        });
        showTooltip(t => {
          const header = document.createElement('div');
          header.className = 'viz-tooltip-header';
          header.textContent = 'Week of ' + fmtDate(week.date);
          t.appendChild(header);
          tooltipLine(t, count + ' commits');
        }, e);
      });
      rect.addEventListener('mousemove', e => moveTooltip(e));
      rect.addEventListener('mouseleave', () => {
        barGroups.forEach(({ rect: r }) => { r.style.opacity = '1'; });
        hideTooltip();
      });
    });

    const labelEl = container.querySelector('.activity-panel-label');
    container.textContent = '';
    if (labelEl) container.appendChild(labelEl);
    container.appendChild(ns);
  }

  // ── Print support ─────────────────────────────────────

  window.addEventListener('beforeprint', () => {
    if (tooltipEl) tooltipEl.style.opacity = '0';
  });

  // ── Boot ──────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-render on theme change so colours update
  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      setTimeout(function() {
        if (activityData) init();
      }, 50);
    });
  }
})();
