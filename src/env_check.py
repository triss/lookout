#!/usr/bin/env python3
"""Smoke test: does this OpenCV build do everything speed_camera.py needs?
Pure in-memory where possible; only touches /tmp for the video I/O probe."""
import os
import tempfile

import numpy as np

ok = True


def check(name, cond, extra=""):
    global ok
    ok = ok and cond
    print(f"[{'PASS' if cond else 'FAIL'}] {name}{(' — ' + extra) if extra else ''}")


try:
    import cv2
except Exception as e:  # noqa
    print(f"[FAIL] import cv2 — {e}")
    raise SystemExit(1)

print(f"opencv {cv2.__version__} | numpy {np.__version__}\n")

# 1. FFmpeg backend present? (mp4 read/write depends on it)
info = cv2.getBuildInformation()
ffmpeg = "FFMPEG:" in info and "FFMPEG:                      YES" in info.replace("  ", " ")
ffmpeg = "FFMPEG" in info and "YES" in info.split("FFMPEG", 1)[1][:40]
check("FFmpeg backend (mp4 I/O)", ffmpeg,
      "without this, VideoCapture/Writer on .mp4 won't work")

# 2. MOG2 background subtractor
try:
    bg = cv2.createBackgroundSubtractorMOG2()
    for _ in range(5):
        bg.apply(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    check("createBackgroundSubtractorMOG2", True)
except Exception as e:  # noqa
    check("createBackgroundSubtractorMOG2", False, str(e))

# 3. homography + perspectiveTransform
try:
    src = np.array([[0, 0], [10, 0], [10, 5], [0, 5]], np.float32)
    dst = np.array([[0, 0], [100, 0], [90, 50], [10, 50]], np.float32)
    H, _ = cv2.findHomography(src, dst)
    pt = cv2.perspectiveTransform(np.array([[[5, 2.5]]], np.float32), H)
    check("findHomography + perspectiveTransform", H is not None and pt is not None)
except Exception as e:  # noqa
    check("findHomography + perspectiveTransform", False, str(e))

# 4. contours + morphology
try:
    m = np.zeros((64, 64), np.uint8)
    cv2.rectangle(m, (10, 10), (40, 40), 255, -1)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    check("findContours + morphology", len(cnts) == 1, f"{len(cnts)} contour(s)")
except Exception as e:  # noqa
    check("findContours + morphology", False, str(e))

# 5. actually write AND read back an mp4 (the real test)
try:
    path = os.path.join(tempfile.gettempdir(), "sc_probe.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(path, fourcc, 30.0, (64, 64))
    wrote = vw.isOpened()
    for _ in range(10):
        vw.write(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    vw.release()
    cap = cv2.VideoCapture(path)
    read_ok = cap.isOpened() and cap.read()[0]
    cap.release()
    check("VideoWriter mp4 (mp4v)", wrote)
    check("VideoCapture read mp4", read_ok)
    if os.path.exists(path):
        os.remove(path)
except Exception as e:  # noqa
    check("video I/O", False, str(e))

print("\n" + ("ALL GOOD — speed_camera.py should run here." if ok
             else "SOME CHECKS FAILED — see above (likely the mp4/FFmpeg ones)."))
raise SystemExit(0 if ok else 1)
