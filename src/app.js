import { generateParams, assemble } from "./character.js";
import { generateName } from "./names.js";

const canvas = document.getElementById("canvas");
const seedInput = document.getElementById("seed-input");
const nameLabel = document.getElementById("name-label");
const randomizeBtn = document.getElementById("randomize-btn");
const downloadSvgBtn = document.getElementById("download-svg-btn");
const downloadPngBtn = document.getElementById("download-png-btn");
const gallery = document.getElementById("gallery");

const RECENT_KEY = "procedural-cuteness-recent";
const MAX_RECENT = 12;

function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

function render(seed) {
  const params = generateParams(seed);
  const svg = assemble(params);
  canvas.innerHTML = svg;
  nameLabel.textContent = generateName(seed);
  seedInput.value = seed;
  const url = new URL(window.location.href);
  url.searchParams.set("seed", seed);
  window.history.replaceState({}, "", url);
  pushRecent(seed);
}

function pushRecent(seed) {
  let recent = [];
  try {
    recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch (e) {
    recent = [];
  }
  recent = recent.filter((s) => s !== seed);
  recent.unshift(seed);
  recent = recent.slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch (e) {
    /* storage unavailable, ignore */
  }
  renderGallery(recent);
}

function renderGallery(recent) {
  gallery.innerHTML = "";
  for (const seed of recent) {
    const thumb = document.createElement("button");
    thumb.className = "thumb";
    thumb.title = seed;
    thumb.innerHTML = assemble(generateParams(seed));
    thumb.addEventListener("click", () => render(seed));
    gallery.appendChild(thumb);
  }
}

function currentSvgString() {
  const svgEl = canvas.querySelector("svg");
  return new XMLSerializer().serializeToString(svgEl);
}

function download(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

downloadSvgBtn.addEventListener("click", () => {
  const blob = new Blob([currentSvgString()], { type: "image/svg+xml" });
  download(`${seedInput.value || "character"}.svg`, blob);
});

downloadPngBtn.addEventListener("click", () => {
  const svgEl = canvas.querySelector("svg");
  const size = 800;
  const img = new Image();
  const svgBlob = new Blob([currentSvgString()], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const ctx = off.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    off.toBlob((blob) => {
      download(`${seedInput.value || "character"}.png`, blob);
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.src = url;
});

randomizeBtn.addEventListener("click", () => render(randomSeed()));

seedInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && seedInput.value.trim()) {
    render(seedInput.value.trim());
  }
});

function init() {
  const url = new URL(window.location.href);
  const seedFromUrl = url.searchParams.get("seed");
  render(seedFromUrl || randomSeed());
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    renderGallery(recent);
  } catch (e) {
    /* ignore */
  }
}

init();
