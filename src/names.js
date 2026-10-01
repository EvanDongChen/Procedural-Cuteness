import { createRng } from "./rng.js";

const STARTS = ["Mo", "Ri", "Pu", "Ko", "Ma", "Fu", "Chi", "Su", "Ta", "Ni", "Me", "Lu", "Ko", "Bu", "Wa"];
const MIDS = ["mu", "ri", "po", "ko", "na", "fu", "chi", "su", "ta", "ni", "mo", "lu"];
const ENDS = ["mi", "ko", "pon", "ta", "ro", "chan", "pi", "mu", "nu", "ru", "n"];

export function generateName(seedInput) {
  const rng = createRng(`name::${seedInput}`);
  const { choice, rand } = rng;
  let name = choice(STARTS);
  if (rand() < 0.6) name += choice(MIDS);
  name += choice(ENDS);
  return name;
}
