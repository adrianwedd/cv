// curvature-field.js
// Renders gravitational field as static streamlines showing spacetime curvature
// Adapted from Footnotes at the Edge of Reality
// Static per session — seed changes daily, field is frozen during reading
// Redraws only on window resize

// Seeded RNG (Mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Adaptive grid size by viewport
function gridForViewport(w, h) {
  const minDim = Math.min(w, h);
  if (minDim < 520) return { nx: 120, ny: 68, seeds: 4 };
  if (minDim < 900) return { nx: 180, ny: 101, seeds: 6 };
  return { nx: 240, ny: 135, seeds: 8 };
}

// Deterministic mass position — behind header area
function massesAtTime({ seed, tMs, w, h, count = 1 }) {
  const masses = [];
  for (let i = 0; i < count; i++) {
    const rng = mulberry32(seed + i * 1013);
    const cx = 0.5;
    const cy = 0.3;
    const radius = 0.02 + rng() * 0.03;
    const ecc = 0.85 + rng() * 0.20;
    const period = (10 + rng() * 10) * 60000;
    const phase = rng() * Math.PI * 2;
    const angle = phase + (tMs / period) * Math.PI * 2;

    const minDim = Math.min(w, h);
    const x = (cx * w) + (radius * minDim) * Math.cos(angle);
    const y = (cy * h) + (radius * minDim) * ecc * Math.sin(angle);
    const weight = 3.0 + rng() * 1.0;

    masses.push({ x, y, weight });
  }
  return masses;
}

// Compute gravitational potential on grid
function computePhiGrid({ nx, ny, w, h, masses, epsilonPx }) {
  const phi = new Float32Array(nx * ny);
  const dx = w / (nx - 1);
  const dy = h / (ny - 1);
  const eps2 = epsilonPx * epsilonPx;

  for (let j = 0; j < ny; j++) {
    const y = j * dy;
    for (let i = 0; i < nx; i++) {
      const x = i * dx;
      let v = 0;
      for (const m of masses) {
        const rx = x - m.x;
        const ry = y - m.y;
        const r2 = rx * rx + ry * ry;
        v += -m.weight / Math.sqrt(r2 + eps2);
      }
      phi[j * nx + i] = v;
    }
  }
  return phi;
}

// Compute gradient field
function computeGradient(phi, nx, ny, w, h) {
  const grad = new Array(nx * ny);
  const dx = w / (nx - 1);
  const dy = h / (ny - 1);

  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      const idx = j * nx + i;
      const gx = -(phi[idx + 1] - phi[idx - 1]) / (2 * dx);
      const gy = -(phi[idx + nx] - phi[idx - nx]) / (2 * dy);
      grad[idx] = { x: gx, y: gy };
    }
  }

  for (let i = 0; i < nx; i++) {
    grad[i] = { x: 0, y: 0 };
    grad[(ny - 1) * nx + i] = { x: 0, y: 0 };
  }
  for (let j = 0; j < ny; j++) {
    grad[j * nx] = { x: 0, y: 0 };
    grad[j * nx + nx - 1] = { x: 0, y: 0 };
  }

  return grad;
}

// Bilinear sample gradient
function sampleGradient(grad, x, y, nx, ny, w, h) {
  const dx = w / (nx - 1);
  const dy = h / (ny - 1);
  const fi = x / dx;
  const fj = y / dy;
  const i = Math.floor(fi);
  const j = Math.floor(fj);

  if (i < 0 || j < 0 || i >= nx - 1 || j >= ny - 1) return null;

  const fx = fi - i;
  const fy = fj - j;

  const g00 = grad[j * nx + i] || { x: 0, y: 0 };
  const g10 = grad[j * nx + i + 1] || { x: 0, y: 0 };
  const g01 = grad[(j + 1) * nx + i] || { x: 0, y: 0 };
  const g11 = grad[(j + 1) * nx + i + 1] || { x: 0, y: 0 };

  return {
    x: g00.x * (1 - fx) * (1 - fy) + g10.x * fx * (1 - fy) + g01.x * (1 - fx) * fy + g11.x * fx * fy,
    y: g00.y * (1 - fx) * (1 - fy) + g10.y * fx * (1 - fy) + g01.y * (1 - fx) * fy + g11.y * fx * fy
  };
}

// Integrate streamline using RK4
function integrateStreamline(seed, grad, nx, ny, w, h, maxSteps, dt, scale) {
  const points = [];
  let pos = { ...seed };

  for (let step = 0; step < maxSteps; step++) {
    points.push({ ...pos });

    const k1 = sampleGradient(grad, pos.x, pos.y, nx, ny, w, h);
    if (!k1) break;

    const pos2 = { x: pos.x + k1.x * dt * scale * 0.5, y: pos.y + k1.y * dt * scale * 0.5 };
    const k2 = sampleGradient(grad, pos2.x, pos2.y, nx, ny, w, h);
    if (!k2) break;

    const pos3 = { x: pos.x + k2.x * dt * scale * 0.5, y: pos.y + k2.y * dt * scale * 0.5 };
    const k3 = sampleGradient(grad, pos3.x, pos3.y, nx, ny, w, h);
    if (!k3) break;

    const pos4 = { x: pos.x + k3.x * dt * scale, y: pos.y + k3.y * dt * scale };
    const k4 = sampleGradient(grad, pos4.x, pos4.y, nx, ny, w, h);
    if (!k4) break;

    pos.x += (dt * scale / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
    pos.y += (dt * scale / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);
  }

  return points;
}

// Generate seed points from viewport edges
function generateSeeds(seed, count, w, h) {
  const rng = mulberry32(seed + 9999);
  const seeds = [];

  for (let i = 0; i < count; i++) {
    const edge = Math.floor(rng() * 4);
    const t = rng();
    let x, y;

    switch (edge) {
      case 0: x = t * w; y = 10; break;
      case 1: x = w - 10; y = t * h; break;
      case 2: x = t * w; y = h - 10; break;
      case 3: x = 10; y = t * h; break;
    }

    seeds.push({ x, y });
  }

  return seeds;
}

// Render streamlines with fade toward mass
function renderStreamlines(ctx, streamlines, w, h, mass) {
  ctx.clearRect(0, 0, w, h);

  const cx = mass.x;
  const cy = mass.y;
  const targetRadius = 50;
  const fadeDistance = 100;
  const fadeStart = targetRadius + fadeDistance;

  for (const line of streamlines) {
    if (line.length < 3) continue;

    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];

      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const dist = Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy));

      // Reduced opacity (0.06) for subtlety behind dense CV text
      let opacity = 0.06;
      if (dist < fadeStart) {
        opacity = 0.06 * ((dist - targetRadius) / fadeDistance);
        opacity = Math.max(0, opacity);
      }

      if (opacity > 0) {
        ctx.strokeStyle = 'rgba(138, 199, 217, ' + opacity + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }
}

// Main initialization
function initCurvatureField({ canvasId, seed = 42, masses = 1, epsilon = 140 } = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  const t0 = performance.now();

  function resizeAndDraw(tNow) {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { nx, ny, seeds: seedCount } = gridForViewport(w, h);
    const tMs = tNow - t0;

    const m = massesAtTime({ seed, tMs, w, h, count: masses });
    const phi = computePhiGrid({ nx, ny, w, h, masses: m, epsilonPx: epsilon });
    const grad = computeGradient(phi, nx, ny, w, h);

    const seedPoints = generateSeeds(seed, seedCount, w, h);
    const streamlines = seedPoints.map(function (s) {
      return integrateStreamline(s, grad, nx, ny, w, h, 1200, 1000, 50);
    });

    renderStreamlines(ctx, streamlines, w, h, m[0]);
  }

  resizeAndDraw(performance.now());
  window.addEventListener('resize', function () { resizeAndDraw(performance.now()); }, { passive: true });
}
