"use strict";

import { getUse, listUses } from "./uses/index.js";

// App scaffold. Live capture → downscale → pixels → pipeline → overlay loop.
//
// This demo deliberately drives the *whole* engine API surface, so it doubles
// as a live smoke test of the UseSpec contract:
//   listUses() / getUse()      — registry
//   use.mode / .locate / .measurements  — declared contract (shown in readout)
//   use.measure(track, ctx)    — per-detection measurement   [stub: throws]
//   use.deriveFindings(obs)    — observations → findings      [stub: throws]
// Stubs throw "not implemented"; we catch and surface that, so the wiring is
// proven now and the readout fills in for free once the stages land.
const video = document.getElementById("video");
const overlay = document.getElementById("overlay");
const octx = overlay.getContext("2d");
const status = document.getElementById("status");
const useSelect = document.getElementById("useSelect");
const useDescription = document.getElementById("useDescription");
const useLink = document.getElementById("useLink");

// Engine readout panel — the declared contract + live pipeline status.
const roMode = document.getElementById("roMode");
const roLocate = document.getElementById("roLocate");
const roMeasurements = document.getElementById("roMeasurements");
const roEvents = document.getElementById("roEvents");
const roMeasure = document.getElementById("roMeasure");
const roFindings = document.getElementById("roFindings");

// Off-screen buffer we actually read pixels from (downscaled for speed —
// CV does not need full camera resolution, and old phones thank you for it).
const work = document.createElement("canvas");
const wctx = work.getContext("2d", { willReadFrequently: true });
const PROC_W = 320; // processing width; height derived from aspect
let procH = 240;

const DIFF_THRESH = 25;     // per-pixel luma delta counted as "changed"
const MOTION_GATE = 0.012;  // frame motion energy that counts as a detection
const MAX_OBS = 500;        // ring-buffer cap on observations

let stream = null, running = false, prevGray = null;
let lastCentroid = null, events = 0, observations = [], findingsTimer = null;
let activeUse = getUse(new URLSearchParams(location.search).get("use")) ||
  getUse("speed");

// ── Engine pipeline:  detect → track → (classify) → locate → derive ──
// Stages 1–2 have placeholder implementations here; locate/derive are owned
// by the active use via the API (measure / deriveFindings), still stubbed.

function toGray(imageData) {
  const { data } = imageData;
  const g = new Uint8ClampedArray(data.length >> 2);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // luma approx, cheap
    g[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }
  return g;
}

// STAGE 1 — detect: frame differencing → motion energy + bounding box of the
// changed region (a crude "mover"). Real version: MOG2 + connected components.
function detect(gray, width) {
  if (!prevGray || prevGray.length !== gray.length) { prevGray = gray; return { energy: 0, bbox: null }; }
  let acc = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
  for (let j = 0; j < gray.length; j++) {
    const d = Math.abs(gray[j] - prevGray[j]);
    acc += d;
    if (d > DIFF_THRESH) {
      const x = j % width, y = (j / width) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      n++;
    }
  }
  prevGray = gray;
  const energy = acc / gray.length / 255;
  const bbox = (n > 8 && maxX >= minX)
    ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, pixels: n }
    : null;
  return { energy, bbox };
}

// STAGE 2 — track: placeholder single-identity tracker. Projects the
// ground-contact point (bottom-centre), not the bbox centre — the same fix
// that removed the ~7% speed under-read in the Python estimator.
function makeTrack(bbox) {
  const cx = bbox.x + bbox.w / 2, cy = bbox.y + bbox.h / 2;
  const velocity = lastCentroid
    ? { x: cx - lastCentroid.x, y: cy - lastCentroid.y }
    : { x: 0, y: 0 };
  lastCentroid = { x: cx, y: cy };
  return {
    id: 1,
    bbox,
    centroid: { x: cx, y: cy },
    ground: { x: cx, y: bbox.y + bbox.h }, // bottom-centre, on the road plane
    velocity,
  };
}

// STAGES 3–4 — locate + derive, owned by the active use via the API.
function runUseMeasure(track, ctx) {
  try {
    const m = activeUse.measure(track, ctx); // UseSpec.measure  [stub: throws]
    observations.push({ t: ctx.t, ...m });
    if (observations.length > MAX_OBS) observations.shift();
    roMeasure.textContent = "ok · " + JSON.stringify(m);
  } catch (e) {
    roMeasure.textContent = "stub — " + e.message;
  }
}

function runDeriveFindings() {
  if (!activeUse) return;
  try {
    const f = activeUse.deriveFindings(observations); // UseSpec.deriveFindings [stub]
    roFindings.textContent = observations.length + " obs → " + JSON.stringify(f);
  } catch (e) {
    roFindings.textContent = "stub — " + e.message + " (" + observations.length + " obs)";
  }
}

function drawOverlay(energy, bbox) {
  octx.clearRect(0, 0, overlay.width, overlay.height);
  const w = overlay.width, barH = 12;
  octx.fillStyle = "#222";
  octx.fillRect(8, 8, w - 16, barH);
  octx.fillStyle = energy > 0.04 ? "#6ee79b" : "#5a6";
  octx.fillRect(8, 8, (w - 16) * Math.min(1, energy * 8), barH);
  octx.fillStyle = "#eee";
  octx.font = "13px system-ui, sans-serif";
  octx.fillText(`${activeUse.name}: motion ${(energy * 100).toFixed(1)}%`, 10, 36);

  if (bbox && running) {
    const sx = overlay.width / PROC_W, sy = overlay.height / procH;
    octx.strokeStyle = "#6ee79b";
    octx.lineWidth = 2;
    octx.strokeRect(bbox.x * sx, bbox.y * sy, bbox.w * sx, bbox.h * sy);
    octx.fillStyle = "#ffd166"; // ground-contact marker (what locate consumes)
    octx.beginPath();
    octx.arc((bbox.x + bbox.w / 2) * sx, (bbox.y + bbox.h) * sy, 4, 0, Math.PI * 2);
    octx.fill();
  }
}

function syncUseUi() {
  if (!activeUse) return;
  useSelect.value = activeUse.id;
  useDescription.textContent = activeUse.description;
  useLink.href = `${activeUse.id}.html`;
  // Declared contract — read straight off the UseSpec.
  roMode.textContent = activeUse.mode;
  roLocate.textContent = activeUse.locate;
  roMeasurements.textContent = activeUse.measurements.join(", ");
}

function resetPipeline() {
  prevGray = null; lastCentroid = null; events = 0; observations = [];
  roEvents.textContent = "0";
  roMeasure.textContent = "awaiting detection…";
  runDeriveFindings(); // exercise the API immediately (shows the stub on empty obs)
}

function installUseOptions() {
  for (const use of listUses()) {
    const option = document.createElement("option");
    option.value = use.id;
    option.textContent = use.name;
    useSelect.appendChild(option);
  }
  syncUseUi();
  resetPipeline();
}

function frame() {
  if (!running) return;
  if (video.videoWidth) {
    procH = Math.round(PROC_W * video.videoHeight / video.videoWidth);
    if (work.width !== PROC_W) { work.width = PROC_W; work.height = procH; }
    if (overlay.width !== video.clientWidth) {
      overlay.width = video.clientWidth;
      overlay.height = video.clientHeight;
    }
    wctx.drawImage(video, 0, 0, PROC_W, procH);
    const img = wctx.getImageData(0, 0, PROC_W, procH);
    const gray = toGray(img);

    const { energy, bbox } = detect(gray, PROC_W); // STAGE 1
    if (energy > MOTION_GATE && bbox) {
      events++;
      roEvents.textContent = String(events);
      const track = makeTrack(bbox);               // STAGE 2
      const ctx = { width: PROC_W, height: procH, t: performance.now(), calibration: null };
      runUseMeasure(track, ctx);                   // STAGES 3–4 via use API
    }
    drawOverlay(energy, bbox);
  }
  schedule();
}

const useRvfc = "requestVideoFrameCallback" in HTMLVideoElement.prototype;
function schedule() {
  if (useRvfc) video.requestVideoFrameCallback(frame);
  else requestAnimationFrame(frame);
}

async function start() {
  status.textContent = "requesting camera…";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } }, audio: false,
    });
  } catch (e) {
    status.textContent = "camera failed: " + e.name + " — " + e.message +
      " (try the capability check)";
    return;
  }
  video.srcObject = stream;
  await video.play().catch(() => {});
  running = true;
  resetPipeline();
  document.getElementById("start").disabled = true;
  document.getElementById("stop").disabled = false;
  findingsTimer = setInterval(runDeriveFindings, 1500); // derive on a cadence
  const s = stream.getVideoTracks()[0].getSettings?.() || {};
  status.textContent = `running · ${video.videoWidth}×${video.videoHeight}` +
    (s.frameRate ? ` · ${s.frameRate.toFixed(0)} fps` : "") +
    ` · ${activeUse.name} · processing at ${PROC_W}px`;
  schedule();
}

function stop() {
  running = false;
  if (findingsTimer) { clearInterval(findingsTimer); findingsTimer = null; }
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  octx.clearRect(0, 0, overlay.width, overlay.height);
  document.getElementById("start").disabled = false;
  document.getElementById("stop").disabled = true;
  status.textContent = "stopped.";
}

document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
useSelect.addEventListener("change", () => {
  activeUse = getUse(useSelect.value);
  syncUseUi();
  resetPipeline();
  status.textContent = `${activeUse.name} selected. Measurement logic is still stubbed.`;
});
installUseOptions();
