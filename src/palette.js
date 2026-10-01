// Seeded pastel palette: always lands in a "cute" high-lightness, low-to-mid
// saturation range regardless of the seed, just varies hue relationships.

function hsl(h, s, l) {
  const hue = Math.round(((h % 360) + 360) % 360);
  return `hsl(${hue}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

export function generatePalette(rng) {
  const { rand } = rng;

  const baseHue = rand() * 360;
  const sat = 45 + rand() * 25; // 45-70%
  const accentOffset = rand() < 0.5 ? 30 + rand() * 40 : -(30 + rand() * 40);

  const body = hsl(baseHue, sat, 78 + rand() * 10);
  const bodyShade = hsl(baseHue, sat, 62 + rand() * 8);
  const head = hsl(baseHue, sat, 82 + rand() * 8);
  const ear = hsl(baseHue + accentOffset, sat, 75 + rand() * 10);
  const innerEar = hsl(baseHue + accentOffset, Math.max(20, sat - 25), 88 + rand() * 6);
  const blush = hsl(340 + rand() * 30 - 15, 70 + rand() * 20, 80 + rand() * 8);
  const eye = hsl(baseHue + 180 + (rand() * 20 - 10), 20 + rand() * 15, 18 + rand() * 10);
  const accessory = hsl(baseHue + 180 + accentOffset, 55 + rand() * 25, 70 + rand() * 12);
  const outline = hsl(baseHue, Math.min(40, sat), 35 + rand() * 10);

  return { body, bodyShade, head, ear, innerEar, blush, eye, accessory, outline };
}
