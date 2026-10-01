// Seeded RNG + Perlin-style noise, ported from the xorshift approach fishdraw uses.
// Everything downstream must only use `rand()`/`noise()` from a freshly-seeded instance
// so identical seeds always produce identical output.

export function strToSeed(str) {
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) >>> 0;
  }
  return seed === 0 ? 0x5eed : seed;
}

export function createRng(seedInput) {
  let jsr =
    typeof seedInput === "number" ? seedInput >>> 0 : strToSeed(String(seedInput));
  if (jsr === 0) jsr = 0x5eed;

  function rand() {
    jsr ^= jsr << 17;
    jsr ^= jsr >>> 13;
    jsr ^= jsr << 5;
    jsr >>>= 0;
    return jsr / 4294967295;
  }

  const PERLIN_YWRAPB = 4;
  const PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
  const PERLIN_ZWRAPB = 8;
  const PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
  const PERLIN_SIZE = 4095;
  const perlinOctaves = 4;
  const perlinAmpFalloff = 0.5;
  const scaledCosine = (i) => 0.5 * (1.0 - Math.cos(i * Math.PI));

  let perlin = null;

  function noise(x, y = 0, z = 0) {
    if (perlin == null) {
      perlin = new Array(PERLIN_SIZE + 1);
      for (let i = 0; i < PERLIN_SIZE + 1; i++) perlin[i] = rand();
    }
    if (x < 0) x = -x;
    if (y < 0) y = -y;
    if (z < 0) z = -z;

    let xi = Math.floor(x);
    let yi = Math.floor(y);
    let zi = Math.floor(z);
    let xf = x - xi;
    let yf = y - yi;
    let zf = z - zi;
    let rxf, ryf;
    let r = 0;
    let ampl = 0.5;
    let n1, n2, n3;

    for (let o = 0; o < perlinOctaves; o++) {
      let of = xi + (yi << PERLIN_YWRAPB) + (zi << PERLIN_ZWRAPB);
      rxf = scaledCosine(xf);
      ryf = scaledCosine(yf);

      n1 = perlin[of & PERLIN_SIZE];
      n1 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n1);
      n2 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
      n2 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n2);
      n1 += ryf * (n2 - n1);

      of += PERLIN_ZWRAP;
      n2 = perlin[of & PERLIN_SIZE];
      n2 += rxf * (perlin[(of + 1) & PERLIN_SIZE] - n2);
      n3 = perlin[(of + PERLIN_YWRAP) & PERLIN_SIZE];
      n3 += rxf * (perlin[(of + PERLIN_YWRAP + 1) & PERLIN_SIZE] - n3);
      n2 += ryf * (n3 - n2);

      n1 += scaledCosine(zf) * (n2 - n1);
      r += n1 * ampl;
      ampl *= perlinAmpFalloff;

      xi <<= 1;
      xf *= 2;
      yi <<= 1;
      yf *= 2;
      zi <<= 1;
      zf *= 2;
      if (xf >= 1.0) {
        xi++;
        xf--;
      }
      if (yf >= 1.0) {
        yi++;
        yf--;
      }
      if (zf >= 1.0) {
        zi++;
        zf--;
      }
    }
    return r;
  }

  function choice(opts, weights) {
    const w = weights || opts.map(() => 1);
    const total = w.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    let s = 0;
    for (let i = 0; i < w.length; i++) {
      s += w[i];
      if (r <= s) return opts[i];
    }
    return opts[opts.length - 1];
  }

  // Triangular distribution: most likely value `b`, bounded by [a, c].
  function rndtri(a, b, c) {
    const s0 = (b - a) / 2;
    const s1 = (c - b) / 2;
    const s = s0 + s1;
    const r = rand() * s;
    if (r < s0) {
      const d = Math.sqrt(2 * r * (b - a));
      return a + d;
    }
    const d = Math.sqrt(2 * (s - r) * (c - b));
    return c - d;
  }

  return { rand, noise, choice, rndtri };
}
