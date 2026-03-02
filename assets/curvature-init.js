var daysSinceEpoch = Math.floor(Date.now() / 86400000);
initCurvatureField({ canvasId: 'curvature-bg', seed: daysSinceEpoch, masses: 1 });
