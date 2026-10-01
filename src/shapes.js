// Geometry helpers: closed, smooth, flat-fillable paths (not fishdraw's open
// hatched polylines). Everything returns an SVG path `d` string.

// Catmull-Rom through a closed set of points -> cubic bezier path.
export function smoothClosedPath(points) {
  const n = points.length;
  if (n < 3) return "";
  const get = (i) => points[((i % n) + n) % n];
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + "Z";
}

// A circle/ellipse whose radius is perturbed by noise, blended toward a clean
// ellipse by `noiseAmount` (0 = perfect ellipse, 1 = fully noisy) — same
// lerp-toward-noise trick fishdraw uses for its body curves.
export function noisyBlob(rng, cx, cy, rx, ry, { noiseAmount = 0.15, noiseFreq = 1.5, segments = 24, noiseSeedOffset = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const ang = t * Math.PI * 2;
    const n = rng.noise(Math.cos(ang) * noiseFreq + noiseSeedOffset, Math.sin(ang) * noiseFreq + noiseSeedOffset);
    const rScale = 1 + (n - 0.5) * 2 * noiseAmount;
    pts.push([cx + Math.cos(ang) * rx * rScale, cy + Math.sin(ang) * ry * rScale]);
  }
  return { points: pts, d: smoothClosedPath(pts) };
}

// A simple triangular cat ear: base-left -> rounded tip -> base-right -> back
// to base-left along a slight inward curve, so it reads as a solid filled
// triangle rather than a thin concave spike.
export function catEar(cx, cy, size, angle) {
  const a = (angle * Math.PI) / 180;
  const up = [Math.sin(a), -Math.cos(a)];
  const perp = [Math.cos(a), Math.sin(a)];
  const halfBase = size * 0.4;

  const tipX = cx + up[0] * size;
  const tipY = cy + up[1] * size;
  const baseLeftX = cx - perp[0] * halfBase;
  const baseLeftY = cy - perp[1] * halfBase;
  const baseRightX = cx + perp[0] * halfBase;
  const baseRightY = cy + perp[1] * halfBase;

  // Tip rounded slightly by nudging the two straight edges toward a shared
  // control point just short of the tip.
  const roundT = 0.85;
  const preTipLeftX = baseLeftX + (tipX - baseLeftX) * roundT;
  const preTipLeftY = baseLeftY + (tipY - baseLeftY) * roundT;
  const preTipRightX = baseRightX + (tipX - baseRightX) * roundT;
  const preTipRightY = baseRightY + (tipY - baseRightY) * roundT;

  return (
    `M ${baseLeftX.toFixed(2)} ${baseLeftY.toFixed(2)} ` +
    `L ${preTipLeftX.toFixed(2)} ${preTipLeftY.toFixed(2)} ` +
    `Q ${tipX.toFixed(2)} ${tipY.toFixed(2)} ${preTipRightX.toFixed(2)} ${preTipRightY.toFixed(2)} ` +
    `L ${baseRightX.toFixed(2)} ${baseRightY.toFixed(2)} Z`
  );
}

export function roundEar(cx, cy, rx, ry) {
  return `M ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} ` +
    `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 1 ${(cx + rx).toFixed(2)} ${cy.toFixed(2)} ` +
    `A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 1 1 ${(cx - rx).toFixed(2)} ${cy.toFixed(2)} Z`;
}

export function limbNub(cx, cy, rx, ry) {
  return roundEar(cx, cy, rx, ry);
}

export function starPath(cx, cy, outerR, innerR, points = 5) {
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + "Z";
}

export function bowPath(cx, cy, size) {
  const w = size;
  const h = size * 0.7;
  return (
    `M ${cx.toFixed(2)} ${cy.toFixed(2)} ` +
    `C ${(cx - w * 0.2).toFixed(2)} ${(cy - h * 0.6).toFixed(2)} ${(cx - w).toFixed(2)} ${(cy - h * 0.6).toFixed(2)} ${(cx - w).toFixed(2)} ${cy.toFixed(2)} ` +
    `C ${(cx - w).toFixed(2)} ${(cy + h * 0.6).toFixed(2)} ${(cx - w * 0.2).toFixed(2)} ${(cy + h * 0.6).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)} ` +
    `C ${(cx + w * 0.2).toFixed(2)} ${(cy - h * 0.6).toFixed(2)} ${(cx + w).toFixed(2)} ${(cy - h * 0.6).toFixed(2)} ${(cx + w).toFixed(2)} ${cy.toFixed(2)} ` +
    `C ${(cx + w).toFixed(2)} ${(cy + h * 0.6).toFixed(2)} ${(cx + w * 0.2).toFixed(2)} ${(cy + h * 0.6).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)} Z`
  );
}

export function flowerPath(cx, cy, petalR, petals = 5) {
  let d = "";
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    const px = cx + Math.cos(a) * petalR * 0.9;
    const py = cy + Math.sin(a) * petalR * 0.9;
    d += roundEar(px, py, petalR * 0.65, petalR * 0.65) + " ";
  }
  return d.trim();
}

export function bbox(points) {
  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const [x, y] of points) {
    if (x < xmin) xmin = x;
    if (y < ymin) ymin = y;
    if (x > xmax) xmax = x;
    if (y > ymax) ymax = y;
  }
  return { xmin, ymin, xmax, ymax };
}
