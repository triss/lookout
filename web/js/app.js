"use strict";

import { getUse, listUses } from "./uses/index.js";
import { toGray } from "./engine/gray.js";
import { createPipeline } from "./engine/pipeline.js";

// App scaffold. Live capture → grayscale → engine pipeline → overlay + readout.
// All pipeline logic now lives in the engine (gray/detect/track/locate/derive,
// composed by createPipeline). This file is just camera, canvas and UI, so the
// readout doubles as a live view of the engine API for the selected use.
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

// Off-screen buffer we read pixels from (downscaled — CV doesn't need full
// resolution, and old phones thank you for it).
const work = document.createElement("canvas");
const wctx = work.getContext("2d", { willReadFrequently: true });
const PROC_W = 320; // processing width; height derived from aspect
let procH = 240;

let stream = null, running = false, events = 0, findingsTimer = null;
let activeUse = getUse(new URLSearchParams(location.search).get("use")) || getUse("speed");
let pipeline = createPipeline(activeUse);

function selectUse(id) {
  const next = getUse(id);
  if (!next) return;
  activeUse = next;
  pipeline = createPipeline(activeUse);
  events = 0;
  syncUseUi();
  roEvents.textContent = "0";
  roMeasure.textContent = "awaiting detection…";
  showFindings(pipeline.findings()); // exercise the API now (empty obs → stub/empty)
}

function syncUseUi() {
  useSelect.value = activeUse.id;
  useDescription.textContent = activeUse.description;
  useLink.href = `${activeUse.id}.html`;
  roMode.textContent = activeUse.mode;
  roLocate.textContent = activeUse.locate;
  roMeasurements.textContent = activeUse.measurements.join(", ");
}

function showMeasure(res) {
  if (res.error) roMeasure.textContent = "stub — " + res.error;
  else if (res.measurement) roMeasure.textContent = "ok · " + JSON.stringify(res.measurement);
  // null measurement (e.g. detection but no crossing): leave prior status.
}

function showFindings(f) {
  roFindings.textContent = f.error
    ? "stub — " + f.error + " (" + pipeline.count() + " obs)"
    : pipeline.count() + " obs → " + JSON.stringify(f.value);
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
    const gray = toGray(wctx.getImageData(0, 0, PROC_W, procH));

    const res = pipeline.process(gray, { width: PROC_W, height: procH, t: Date.now() });
    if (res.bbox && res.energy > 0.012) { events++; roEvents.textContent = String(events); }
    showMeasure(res);
    drawOverlay(res.energy, res.bbox);
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
  pipeline.reset(); events = 0; roEvents.textContent = "0";
  document.getElementById("start").disabled = true;
  document.getElementById("stop").disabled = false;
  findingsTimer = setInterval(() => showFindings(pipeline.findings()), 1500);
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

function installUseOptions() {
  for (const use of listUses()) {
    const option = document.createElement("option");
    option.value = use.id;
    option.textContent = use.name;
    useSelect.appendChild(option);
  }
}

document.getElementById("start").addEventListener("click", start);
document.getElementById("stop").addEventListener("click", stop);
useSelect.addEventListener("change", () => {
  selectUse(useSelect.value);
  status.textContent = `${activeUse.name} selected. ${activeUse.mode === "change" ? "Change-mode use." : "Camera shows the live pipeline."}`;
});

installUseOptions();
selectUse(activeUse.id);
