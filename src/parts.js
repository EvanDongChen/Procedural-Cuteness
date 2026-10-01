import { noisyBlob, catEar, roundEar, limbNub, starPath, bowPath, flowerPath } from "./shapes.js";

function path(d, fill, extra = "") {
  return `<path d="${d}" fill="${fill}" ${extra} />`;
}

export function buildBody(rng, p, palette) {
  const { d } = noisyBlob(rng, p.bodyCx, p.bodyCy, p.bodyRx, p.bodyRy, {
    noiseAmount: 0.06,
    noiseFreq: 1.2,
    noiseSeedOffset: 10,
  });
  return path(d, palette.body, `stroke="${palette.outline}" stroke-width="3"`);
}

export function buildHead(rng, p, palette) {
  const { d } = noisyBlob(rng, p.headCx, p.headCy, p.headR, p.headR, {
    noiseAmount: 0.05,
    noiseFreq: 1.3,
    noiseSeedOffset: 20,
  });
  return path(d, palette.head, `stroke="${palette.outline}" stroke-width="3"`);
}

export function buildEars(p, palette) {
  if (p.species === "round") return "";
  const [lx, ly] = p.earOffsets.left;
  const [rx, ry] = p.earOffsets.right;
  let outer, inner;
  if (p.species === "cat") {
    outer = catEar(p.headCx + lx, p.headCy + ly, p.earSize, -p.earAngle) + " " + catEar(p.headCx + rx, p.headCy + ry, p.earSize, p.earAngle);
    inner = catEar(p.headCx + lx, p.headCy + ly + p.earSize * 0.12, p.earSize * 0.55, -p.earAngle) + " " + catEar(p.headCx + rx, p.headCy + ry + p.earSize * 0.12, p.earSize * 0.55, p.earAngle);
  } else if (p.species === "bunny") {
    outer = roundEar(p.headCx + lx, p.headCy + ly, p.earSize * 0.4, p.earSize) + " " + roundEar(p.headCx + rx, p.headCy + ry, p.earSize * 0.4, p.earSize);
    inner = roundEar(p.headCx + lx, p.headCy + ly, p.earSize * 0.22, p.earSize * 0.75) + " " + roundEar(p.headCx + rx, p.headCy + ry, p.earSize * 0.22, p.earSize * 0.75);
  } else if (p.species === "bear" || p.species === "mouse") {
    const er = p.species === "bear" ? p.earSize * 0.55 : p.earSize * 0.4;
    outer = roundEar(p.headCx + lx, p.headCy + ly, er, er) + " " + roundEar(p.headCx + rx, p.headCy + ry, er, er);
    inner = roundEar(p.headCx + lx, p.headCy + ly, er * 0.55, er * 0.55) + " " + roundEar(p.headCx + rx, p.headCy + ry, er * 0.55, er * 0.55);
  } else {
    // bird: small round wing-like tufts
    const er = p.earSize * 0.35;
    outer = roundEar(p.headCx + lx, p.headCy + ly, er, er * 1.4) + " " + roundEar(p.headCx + rx, p.headCy + ry, er, er * 1.4);
    inner = "";
  }
  return (
    path(outer, palette.ear, `stroke="${palette.outline}" stroke-width="3"`) +
    (inner ? path(inner, palette.innerEar) : "")
  );
}

export function buildLimbs(p, palette) {
  if (p.limbStyle === "none") return "";
  const legs =
    p.limbStyle === "nub-arms-legs"
      ? [
          limbNub(p.bodyCx - p.bodyRx * 0.5, p.bodyCy + p.bodyRy * 0.85, p.limbR, p.limbR * 0.8),
          limbNub(p.bodyCx + p.bodyRx * 0.5, p.bodyCy + p.bodyRy * 0.85, p.limbR, p.limbR * 0.8),
        ]
      : [];
  const arms = [
    limbNub(p.bodyCx - p.bodyRx * 0.95, p.bodyCy + p.bodyRy * 0.1, p.limbR * 0.9, p.limbR * 0.7),
    limbNub(p.bodyCx + p.bodyRx * 0.95, p.bodyCy + p.bodyRy * 0.1, p.limbR * 0.9, p.limbR * 0.7),
  ];
  return [...legs, ...arms]
    .map((d) => path(d, palette.body, `stroke="${palette.outline}" stroke-width="3"`))
    .join("");
}

export function buildPattern(rng, p, palette) {
  if (p.pattern === "none") return "";
  if (p.pattern === "tummy-patch") {
    const d = noisyBlob(rng, p.bodyCx, p.bodyCy + p.bodyRy * 0.25, p.bodyRx * 0.5, p.bodyRy * 0.55, {
      noiseAmount: 0.08,
      noiseSeedOffset: 30,
    }).d;
    return path(d, palette.innerEar);
  }
  if (p.pattern === "freckles" || p.pattern === "spots") {
    const n = p.pattern === "freckles" ? 10 : 5;
    const rMax = p.pattern === "freckles" ? 3 : p.bodyRx * 0.12;
    let out = "";
    for (let i = 0; i < n; i++) {
      const ang = rng.rand() * Math.PI * 2;
      const rad = rng.rand() * p.bodyRx * 0.7;
      const cx = p.bodyCx + Math.cos(ang) * rad;
      const cy = p.bodyCy + Math.sin(ang) * rad * (p.bodyRy / p.bodyRx);
      const r = rMax * (0.5 + rng.rand() * 0.5);
      out += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${palette.bodyShade}" />`;
    }
    return out;
  }
  return "";
}

export function buildEyes(p, palette) {
  const [lx, ly] = [p.headCx - p.eyeSpacing, p.headCy + p.eyeY];
  const [rx, ry] = [p.headCx + p.eyeSpacing, p.headCy + p.eyeY];
  const r = p.eyeSize;

  function oneEye(cx, cy) {
    if (p.eyeStyle === "happy-closed") {
      return `<path d="M ${(cx - r).toFixed(2)} ${cy.toFixed(2)} Q ${cx.toFixed(2)} ${(cy + r * 1.3).toFixed(2)} ${(cx + r).toFixed(2)} ${cy.toFixed(2)}" stroke="${palette.eye}" stroke-width="${(r * 0.35).toFixed(2)}" fill="none" stroke-linecap="round" />`;
    }
    let s = `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${palette.eye}" />`;
    if (p.eyeStyle === "sparkle" || p.eyeStyle === "shiny-round") {
      s += `<circle cx="${(cx + r * 0.35).toFixed(2)}" cy="${(cy - r * 0.35).toFixed(2)}" r="${(r * 0.35).toFixed(2)}" fill="white" />`;
      if (p.eyeStyle === "sparkle") {
        s += `<circle cx="${(cx - r * 0.3).toFixed(2)}" cy="${(cy + r * 0.25).toFixed(2)}" r="${(r * 0.18).toFixed(2)}" fill="white" />`;
      }
    }
    return s;
  }
  return oneEye(lx, ly) + oneEye(rx, ry);
}

export function buildBlush(p, palette) {
  if (!p.hasBlush) return "";
  const y = p.headCy + p.eyeY + p.eyeSize * 1.4;
  const dx = p.eyeSpacing * 1.15;
  return (
    `<ellipse cx="${(p.headCx - dx).toFixed(2)}" cy="${y.toFixed(2)}" rx="${p.blushSize.toFixed(2)}" ry="${(p.blushSize * 0.6).toFixed(2)}" fill="${palette.blush}" opacity="0.7" />` +
    `<ellipse cx="${(p.headCx + dx).toFixed(2)}" cy="${y.toFixed(2)}" rx="${p.blushSize.toFixed(2)}" ry="${(p.blushSize * 0.6).toFixed(2)}" fill="${palette.blush}" opacity="0.7" />`
  );
}

export function buildMouth(p, palette) {
  const cx = p.headCx;
  const cy = p.headCy + p.eyeY + p.eyeSize * 2.2;
  if (p.mouthStyle === "none") return "";
  if (p.mouthStyle === "smile") {
    return `<path d="M ${(cx - 6).toFixed(2)} ${cy.toFixed(2)} Q ${cx.toFixed(2)} ${(cy + 6).toFixed(2)} ${(cx + 6).toFixed(2)} ${cy.toFixed(2)}" stroke="${palette.outline}" stroke-width="2" fill="none" stroke-linecap="round" />`;
  }
  if (p.mouthStyle === "w-mouth") {
    return `<path d="M ${(cx - 7).toFixed(2)} ${cy.toFixed(2)} Q ${(cx - 3.5).toFixed(2)} ${(cy + 5).toFixed(2)} ${cx.toFixed(2)} ${cy.toFixed(2)} Q ${(cx + 3.5).toFixed(2)} ${(cy + 5).toFixed(2)} ${(cx + 7).toFixed(2)} ${cy.toFixed(2)}" stroke="${palette.outline}" stroke-width="2" fill="none" stroke-linecap="round" />`;
  }
  if (p.mouthStyle === "open-smile") {
    return `<path d="M ${(cx - 7).toFixed(2)} ${cy.toFixed(2)} Q ${cx.toFixed(2)} ${(cy + 10).toFixed(2)} ${(cx + 7).toFixed(2)} ${cy.toFixed(2)} Z" fill="${palette.eye}" opacity="0.85" />`;
  }
  return "";
}

export function buildAccessory(p, palette) {
  if (p.accessory === "none") return "";
  const cx = p.headCx + p.accessoryOffset[0];
  const cy = p.headCy + p.accessoryOffset[1];
  if (p.accessory === "bow") {
    return path(bowPath(cx, cy, p.accessorySize), palette.accessory, `stroke="${palette.outline}" stroke-width="2"`) +
      `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(p.accessorySize * 0.22).toFixed(2)}" fill="${palette.accessory}" stroke="${palette.outline}" stroke-width="2" />`;
  }
  if (p.accessory === "flower") {
    return (
      path(flowerPath(cx, cy, p.accessorySize * 0.5), palette.accessory, `stroke="${palette.outline}" stroke-width="1.5"`) +
      `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(p.accessorySize * 0.25).toFixed(2)}" fill="${palette.blush}" />`
    );
  }
  if (p.accessory === "star") {
    return path(starPath(cx, cy, p.accessorySize * 0.6, p.accessorySize * 0.26), palette.accessory, `stroke="${palette.outline}" stroke-width="2" stroke-linejoin="round"`);
  }
  if (p.accessory === "headband") {
    return `<path d="M ${(p.headCx - p.headR * 0.9).toFixed(2)} ${(p.headCy - p.headR * 0.3).toFixed(2)} Q ${p.headCx.toFixed(2)} ${(p.headCy - p.headR * 0.75).toFixed(2)} ${(p.headCx + p.headR * 0.9).toFixed(2)} ${(p.headCy - p.headR * 0.3).toFixed(2)}" stroke="${palette.accessory}" stroke-width="${(p.headR * 0.18).toFixed(2)}" fill="none" stroke-linecap="round" />`;
  }
  return "";
}
