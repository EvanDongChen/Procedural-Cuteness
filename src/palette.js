// Seeded pastel palette with light/dark variants per color (for gradient fills)
// so shapes read as shaded, not flat clip-art. Hue relationships are picked
// from a small set of pleasant schemes (analogous / complementary) instead of
// a fully random offset, to avoid muddy clashes.

function hsl(h, s, l) {
  const hue = Math.round(((h % 360) + 360) % 360);
  return `hsl(${hue}, ${clamp(s, 0, 100).toFixed(1)}%, ${clamp(l, 0, 100).toFixed(1)}%)`;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// A base hue/sat/light plus pre-shaded light/base/dark CSS strings, for use as
// a gradient's two stops or a flat fill + stroke pair.
function shadeSet(h, s, l) {
  return {
    light: hsl(h, s * 0.9, clamp(l + 10, 0, 97)),
    base: hsl(h, s, l),
    dark: hsl(h, Math.min(100, s + 5), clamp(l - 16, 0, 100)),
  };
}

export function generatePalette(rng) {
  const { rand, choice } = rng;

  const baseHue = rand() * 360;
  const sat = 55 + rand() * 25; // 55-80%, more saturated than before so it reads as illustrated, not washed out
  const baseLight = 72 + rand() * 10;

  const scheme = choice(["analogous", "complementary", "split"]);
  const accentOffset =
    scheme === "complementary" ? 180 : scheme === "split" ? (rand() < 0.5 ? 150 : -150) : rand() < 0.5 ? 35 : -35;

  const body = shadeSet(baseHue, sat, baseLight);
  const head = shadeSet(baseHue, sat * 0.95, baseLight + 5);
  const ear = shadeSet(baseHue + accentOffset, sat, baseLight);
  const innerEar = shadeSet(baseHue + accentOffset, Math.max(15, sat - 35), 92);
  const blush = shadeSet(345 + rand() * 20 - 10, 65 + rand() * 20, 82);
  const accessory = shadeSet(baseHue + accentOffset + 180, 60 + rand() * 25, 72);
  const eye = hsl(baseHue + 180, 25 + rand() * 15, 16 + rand() * 8);
  const outline = hsl(baseHue, Math.min(45, sat * 0.6), 30 + rand() * 8);
  const shadow = hsl(baseHue, sat * 0.4, 50);

  return { body, head, ear, innerEar, blush, accessory, eye, outline, shadow };
}
