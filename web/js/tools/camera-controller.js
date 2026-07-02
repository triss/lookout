const DEFAULT_RESOLUTION_WIDTHS = { low: 320, medium: 640, high: 1280 };

export function cameraConstraints(settings, resolutionWidths = DEFAULT_RESOLUTION_WIDTHS) {
  return {
    video: {
      facingMode: { ideal: settings.facing },
      width: { ideal: resolutionWidths[settings.resolution] },
      frameRate: { ideal: settings.targetFps },
    },
    audio: false,
  };
}

export function requestFullscreen(element = document.documentElement) {
  if (document.fullscreenElement) return Promise.resolve();
  if (element.requestFullscreen) {
    return element.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }
  if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  return Promise.resolve();
}

export function createCameraController({
  video,
  overlay,
  workCanvas,
  processingWidth,
  settings,
  statusLine,
  resolutionWidths = DEFAULT_RESOLUTION_WIDTHS,
  beforeStop = () => {},
  onResize = () => {},
}) {
  let stream = null;
  let cameraOn = false;

  function resizeOverlay() {
    overlay.width = overlay.clientWidth;
    overlay.height = overlay.clientHeight;
    const processingHeight = video.videoWidth
      ? Math.round(processingWidth * video.videoHeight / video.videoWidth)
      : Math.round(processingWidth * 9 / 16);
    if (workCanvas && (workCanvas.width !== processingWidth || workCanvas.height !== processingHeight)) {
      workCanvas.width = processingWidth;
      workCanvas.height = processingHeight;
    }
    onResize({ processingHeight });
    return processingHeight;
  }

  function stopStream() {
    beforeStop();
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  async function start() {
    stopStream();
    if (statusLine) statusLine.textContent = "requesting camera...";
    try {
      stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(settings, resolutionWidths));
    } catch (e) {
      if (statusLine) statusLine.textContent = "camera failed: " + e.name + " - " + e.message;
      return null;
    }
    video.srcObject = stream;
    video.classList.toggle("mirror", settings.mirror);
    video.play().catch(() => {});
    cameraOn = true;
    resizeOverlay();
    return stream;
  }

  function stopCamera() {
    cameraOn = false;
    stopStream();
  }

  function applyMirror() {
    video.classList.toggle("mirror", settings.mirror);
  }

  return {
    start,
    stopStream,
    stopCamera,
    resizeOverlay,
    requestFullscreen: () => requestFullscreen(),
    applyMirror,
    isOn: () => cameraOn,
    getStream: () => stream,
    setOn: (value) => { cameraOn = Boolean(value); },
  };
}
