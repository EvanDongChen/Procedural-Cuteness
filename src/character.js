import { createRng } from "./rng.js";
import { generatePalette } from "./palette.js";
import { bbox } from "./shapes.js";
import {
  buildBody,
  buildHead,
  buildEars,
  buildLimbs,
  buildPattern,
  buildEyes,
  buildBlush,
  buildMouth,
  buildAccessory,
  buildGradientDefs,
  buildShadow,
  buildShine,
  buildTail,
} from "./parts.js";

const CANVAS = 300; // working coordinate space before reframing

export function generateParams(seedInput) {
  const rng = createRng(seedInput);
  const { choice, rndtri } = rng;

  const species = choice(["cat", "bunny", "bear", "mouse", "bird", "round"]);
  const headR = rndtri(55, 72, 85);
  const bodyScale = rndtri(0.45, 0.6, 0.75); // body size relative to head, chibi-skewed small
  const bodyRx = headR * bodyScale * rndtri(0.85, 1, 1.15);
  const bodyRy = bodyRx * rndtri(0.75, 0.95, 1.1);

  const headCx = CANVAS / 2;
  const headCy = CANVAS / 2 - bodyRy * 0.55;
  const bodyCx = CANVAS / 2;
  const bodyCy = headCy + headR * 0.55 + bodyRy * 0.7;

  const earSize = headR * rndtri(0.35, 0.5, 0.65);
  const earAngle = rndtri(10, 22, 35);
  const earSpread = headR * rndtri(0.55, 0.7, 0.85);
  const earOffsets = {
    left: [-earSpread, -headR * 0.75],
    right: [earSpread, -headR * 0.75],
  };

  const eyeSize = rndtri(headR * 0.1, headR * 0.14, headR * 0.19);
  const eyeSpacing = headR * rndtri(0.28, 0.36, 0.44);
  const eyeY = headR * rndtri(-0.05, 0.05, 0.15);

  const limbStyle = choice(["none", "nub-arms", "nub-arms-legs"], [1, 2, 2]);
  const limbR = bodyRx * rndtri(0.18, 0.24, 0.3);

  const pattern = choice(["none", "freckles", "tummy-patch", "spots"], [3, 2, 3, 2]);

  const accessory = choice(["none", "bow", "flower", "star", "headband"], [3, 2, 2, 1, 1]);
  const accessorySize = headR * rndtri(0.18, 0.24, 0.3);
  // Sits on the head's top arc (angle measured from straight up), well inside
  // the ear-free zone, instead of out near the ear base where it used to clip.
  const accessoryAngleDeg = choice([-1, 1]) * rndtri(18, 30, 42);
  const accessoryAngle = (accessoryAngleDeg * Math.PI) / 180;
  const accessoryDist = headR * rndtri(0.78, 0.88, 0.95);
  const accessoryOffset = [Math.sin(accessoryAngle) * accessoryDist, -Math.cos(accessoryAngle) * accessoryDist];

  return {
    seed: seedInput,
    species,
    headR,
    headCx,
    headCy,
    bodyRx,
    bodyRy,
    bodyCx,
    bodyCy,
    earSize,
    earAngle,
    earOffsets,
    eyeSize,
    eyeSpacing,
    eyeY,
    eyeStyle: choice(["dot", "sparkle", "happy-closed", "shiny-round"]),
    mouthStyle: choice(["none", "smile", "w-mouth", "open-smile"], [1, 3, 3, 2]),
    hasBlush: choice([true, false], [3, 1]),
    blushSize: rndtri(headR * 0.1, headR * 0.14, headR * 0.19),
    limbStyle,
    limbR,
    pattern,
    accessory,
    accessorySize,
    accessoryOffset,
  };
}

export function assemble(params) {
  // Rendering is driven by params alone, but part builders that still need
  // fresh noise (pattern placement, blob perturbation) get their own rng
  // reseeded deterministically from the same seed + a salt, so independently
  // reseeding noise streams never interfere with each other.
  const uid = sanitizeId(params.seed);
  const pal = generatePalette(createRng(hashCombine(params.seed, "palette")));
  const rngBody = createRng(hashCombine(params.seed, "body"));
  const rngPattern = createRng(hashCombine(params.seed, "pattern"));
  const rngTail = createRng(hashCombine(params.seed, "tail"));

  const defs = buildGradientDefs(uid, pal);
  const shadowLayer = buildShadow(params, pal);
  const tailLayer = buildTail(rngTail, params, pal, uid);
  const bodyLayer = buildBody(rngBody, params, pal, uid);
  const patternLayer = buildPattern(rngPattern, params, pal);
  const headLayer = buildHead(createRng(hashCombine(params.seed, "head")), params, pal, uid);
  const earsLayer = buildEars(params, pal, uid);
  const limbsLayer = buildLimbs(params, pal, uid);
  const shineLayer = buildShine(params);
  const blushLayer = buildBlush(params, pal);
  const eyesLayer = buildEyes(params, pal);
  const mouthLayer = buildMouth(params, pal);
  const accessoryLayer = buildAccessory(params, pal);

  const svgBody =
    defs +
    shadowLayer +
    tailLayer +
    earsLayer +
    bodyLayer +
    patternLayer +
    limbsLayer +
    headLayer +
    shineLayer +
    blushLayer +
    eyesLayer +
    mouthLayer +
    accessoryLayer;

  const pad = 20;
  const tailReach = params.bodyRx * 2.1; // generous: covers tail/limb/shadow overshoot on either side
  const box = bbox([
    [params.headCx - params.headR, params.headCy - params.headR - params.earSize * 1.6],
    [params.headCx + params.headR, params.headCy + params.headR],
    [params.bodyCx - tailReach, params.bodyCy - params.bodyRy],
    [params.bodyCx + tailReach, params.bodyCy + params.bodyRy + params.limbR * 1.5],
  ]);
  const vb = `${(box.xmin - pad).toFixed(1)} ${(box.ymin - pad).toFixed(1)} ${(box.xmax - box.xmin + pad * 2).toFixed(1)} ${(box.ymax - box.ymin + pad * 2).toFixed(1)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="400" height="400">${svgBody}</svg>`;
}

function hashCombine(seed, salt) {
  return `${seed}::${salt}`;
}

// Gradient ids must be unique per character when several are inlined on one
// page (e.g. the recent-friends gallery), or they'd all share one <defs>.
function sanitizeId(seed) {
  return String(seed).replace(/[^a-zA-Z0-9]/g, "") + "-" + Math.abs(hashInt(String(seed)));
}

function hashInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}
