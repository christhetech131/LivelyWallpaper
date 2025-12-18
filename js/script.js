/*
  Christian Wallpaper, Clock and Visualizer
  Reactive audio spectrum + configurable clock for Lively Wallpaper.

  Code License: MIT
    Copyright (c) 2020 NowbodyAnybody
    Copyright (c) 2025 Christopher Galati
    See LICENSE for the full text.

  Artwork License:
    Burning-bush background image & video
    © 2025 Christopher Galati — Creative Commons CC BY 4.0
    See ASSETS.md for permitted uses and attribution.

  Notes:
    - This script is intended to be loaded by index.html in Lively Wallpaper.
    - User-tunable options are defined in livelyproperties.json and passed in
      via livelyPropertyListener / livelyAudioListener.
*/
// --- Global visualizer configuration ---
var numberOfFrequencies = 1;

var inputColor1 = "255,214,107";   // default matches burning tree highlight
var inputColor2 = "255,139,043";   // warm orange
var glow = true;
var glowStrength = 10;
var textColor = "#FFFFFF";
var amplitude = 300;

// spectrumScale is 0.5–1.5 (50%–150% width)
var spectrumScale = 0.8;
var spectrumX = 0.5;       // 0–1
var spectrumY = 0.8;       // 0–1, near bottom
var opacity = 1.0;

var textScale = 1.0;       // for track text
var textX = 0.5;
var textY = 0.5;

var useImg = false;
var imgName = "images/background.png";
var useVideo = true;
var videoName = "video/background.mp4";

var showVisualizer = true;
var showTrackText = true;

// --- Clock configuration ---
var showClock = true;
var showClockDayOfWeek = true;
var showClockDate = true;
var showClockTime = true;
var showSeconds = true;
var timeFormat = "12-hour"; // or "24-hour"

// base font sizes
var baseDaySize = 30;
var baseDateSize = 20;
var baseTimeSize = 60;

// per-element scale and position (normalized 0–1)
var dayScale = 1.0,  dayX = 0.5,  dayY = 0.10;
var dateScale = 1.0, dateX = 0.5, dateY = 0.16;
var timeScale = 1.0, timeX = 0.5, timeY = 0.24;

// font options (10 commonly available fonts)
var fontOptions = [
  "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",         // 0
  "Arial, 'Helvetica Neue', Helvetica, sans-serif",          // 1
  "'Calibri', 'Segoe UI', sans-serif",                       // 2
  "'Times New Roman', Times, serif",                         // 3
  "'Georgia', 'Times New Roman', serif",                     // 4
  "Verdana, Geneva, sans-serif",                             // 5
  "Tahoma, Geneva, sans-serif",                              // 6
  "'Trebuchet MS', 'Segoe UI', sans-serif",                  // 7
  "'Courier New', Courier, monospace",                       // 8
  "Consolas, 'Courier New', monospace"                       // 9
];

var fontLabelToIndex = {
  "Segoe UI": 0,
  "Arial": 1,
  "Calibri": 2,
  "Times New Roman": 3,
  "Georgia": 4,
  "Verdana": 5,
  "Tahoma": 6,
  "Trebuchet MS": 7,
  "Courier New": 8,
  "Consolas": 9
};

var dayFontIndex = 0;
var dateFontIndex = 0;
var timeFontIndex = 0;

// --- DOM refs ---
var canvas = null;
var ctx = null;
var audioElement = null;
var backgroundImg = null;
var bgVideo = null;
var bgVideoSource = null;
var fallbackBg = null;
var clockContainer = null;
var dayText = null;
var dateText = null;
var timeText = null;
var consoleDiv = null;

function initDomRefs() {
  if (canvas) return; // already initialized

  canvas = document.getElementById("canvas");
  if (canvas) {
    ctx = canvas.getContext("2d");
  }
  audioElement = document.getElementById("audioData");
  backgroundImg = document.getElementById("backgroundImg");
  bgVideo = document.getElementById("bgVideo");
  bgVideoSource = document.getElementById("bgVideoSource");
  fallbackBg = document.getElementById("fallbackBg");
  clockContainer = document.getElementById("clockContainer");
  dayText = document.getElementById("dayText");
  dateText = document.getElementById("dateText");
  timeText = document.getElementById("timeText");
  consoleDiv = document.getElementById("console");

  resizeCanvas();
  applyClockLayout();
  applyClockFonts();
  updateClockVisibility();
  applyImageSource();
  applyVideoSource();
  updateBackgroundMode();
  updateVisualizerVisibility();
  updateTrackTextLayout();
  updateTrackTextVisibility();
}

window.addEventListener("load", function () {
  initDomRefs();
  setInterval(updateClockText, 1000);
});

window.addEventListener("resize", function () {
  resizeCanvas();
  applyClockLayout();
  updateSpectrumPosition();
  updateTrackTextLayout();
});

// --- Utility helpers ---

function log(msg) {
  if (!consoleDiv) return;
  consoleDiv.innerHTML = String(msg);
}

function clamp01(v) {
  v = Number(v);
  if (isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

// Map a slider value where JSON says min=1, max=100
// so value 1 -> -0.05 (5% above top), value 100 -> 1.0 (bottom)
function normalizeYSlider(val, defaultVal) {
  var min = 1;
  var max = 100;
  var raw = Number(val);
  if (isNaN(raw)) raw = defaultVal;
  if (raw < min) raw = min;
  if (raw > max) raw = max;

  var normalized = (raw - min) / (max - min);  // 0..1
  var topOffset = -0.05;                      // 5% of screen above top
  // Map 0..1 -> topOffset..1.0
  return topOffset + normalized * (1 - topOffset);
}

function pad(n) {
  n = Number(n) || 0;
  return n < 10 ? "0" + n : String(n);
}

function hexToRGB(hex) {
  if (!hex) return "255,255,255";
  hex = String(hex).trim();
  if (hex[0] === "#") hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  var r = parseInt(hex.slice(0, 2), 16);
  var g = parseInt(hex.slice(2, 4), 16);
  var b = parseInt(hex.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "255,255,255";
  return r + "," + g + "," + b;
}

// --- Background helpers ---

function formatImagePath(val) {
  if (!val) return "images/background.png";
  val = String(val).replace(/\\/g, "/");
  if (!val.includes("/")) {
    return "images/" + val;
  }
  return val;
}

function formatVideoPath(val) {
  if (!val) return "video/background.mp4";
  val = String(val).replace(/\\/g, "/");
  if (!val.includes("/")) {
    return "video/" + val;
  }
  return val;
}

function applyImageSource() {
  if (!backgroundImg) return;
  backgroundImg.src = formatImagePath(imgName);
}

function applyVideoSource() {
  if (!bgVideoSource) return;
  var src = formatVideoPath(videoName);
  if (bgVideoSource.getAttribute("src") !== src) {
    bgVideoSource.setAttribute("src", src);
    if (bgVideo && bgVideo.load) {
      try {
        bgVideo.load();
        bgVideo.play().catch(function () { });
      } catch (e) { }
    }
  }
}

function updateBackgroundMode() {
  if (!backgroundImg || !bgVideo || !fallbackBg) return;

  if (useVideo) {
    fallbackBg.style.display = "none";
    backgroundImg.style.display = "none";
    bgVideo.style.display = "block";
  } else if (useImg) {
    fallbackBg.style.display = "none";
    bgVideo.style.display = "none";
    backgroundImg.style.display = "inline";
  } else {
    bgVideo.style.display = "none";
    backgroundImg.style.display = "none";
    fallbackBg.style.display = "block";
  }
}

// --- Canvas / spectrum layout ---

function resizeCanvas() {
  if (!canvas) return;
  // internal resolution
  canvas.width = window.innerWidth;
  canvas.height = amplitude + 40;
  updateSpectrumPosition();
}

function updateSpectrumPosition() {
  if (!canvas) return;

  // visible size
  var displayWidth = window.innerWidth * spectrumScale;
  var displayHeight = canvas.height;

  var cx = window.innerWidth * spectrumX;
  var cy = window.innerHeight * spectrumY;

  canvas.style.position = "absolute";
  canvas.style.width = displayWidth + "px";
  canvas.style.height = displayHeight + "px";
  canvas.style.left = (cx - displayWidth / 2) + "px";
  canvas.style.top = (cy - displayHeight / 2) + "px";
}

// --- Track text layout/visibility ---

function updateTrackTextLayout() {
  if (!audioElement) return;
  var scale = textScale;
  audioElement.style.fontSize = (50 * scale) + "px";

  var x = window.innerWidth * textX - (audioElement.clientWidth + 1) / 2;
  var y = window.innerHeight * textY - (audioElement.clientHeight + 1) / 2;
  audioElement.style.left = x + "px";
  audioElement.style.top = y + "px";
}

function updateTrackTextVisibility() {
  if (!audioElement) return;
  audioElement.style.display = (showVisualizer && showTrackText) ? "block" : "none";
}

// --- Clock formatting/layout ---

function formatTime(now) {
  var h = now.getHours();
  var m = now.getMinutes();
  var s = now.getSeconds();

  if (timeFormat === "24-hour") {
    var base24 = pad(h) + ":" + pad(m);
    return showSeconds ? base24 + ":" + pad(s) : base24;
  } else {
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    var base12 = pad(h12) + ":" + pad(m);
    return showSeconds ? base12 + ":" + pad(s) + " " + ampm : base12 + " " + ampm;
  }
}

function updateClockText() {
  if (!dayText || !dateText || !timeText) {
    initDomRefs();
  }
  var now = new Date();

  if (dayText) {
    dayText.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
  }

  if (dateText) {
	const month = now.toLocaleDateString("en-US", { month: "long" });
	dateText.textContent =
	  pad(now.getDate()) + " " +
	  month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

  }

  if (timeText) {
    timeText.textContent = formatTime(now);
  }
}

function applyClockLayout() {
  if (!dayText || !dateText || !timeText) return;

  var h = window.innerHeight;

  // Y positions in pixels; X as %
  dayText.style.left = (dayX * 100) + "%";
  dayText.style.top = (h * dayY) + "px";
  dayText.style.fontSize = (baseDaySize * dayScale) + "px";

  dateText.style.left = (dateX * 100) + "%";
  dateText.style.top = (h * dateY) + "px";
  dateText.style.fontSize = (baseDateSize * dateScale) + "px";

  timeText.style.left = (timeX * 100) + "%";
  timeText.style.top = (h * timeY) + "px";
  timeText.style.fontSize = (baseTimeSize * timeScale) + "px";
}

function applyClockFonts() {
  if (!dayText || !dateText || !timeText) return;

  dayText.style.fontFamily = fontOptions[dayFontIndex] || fontOptions[0];
  dateText.style.fontFamily = fontOptions[dateFontIndex] || fontOptions[0];
  timeText.style.fontFamily = fontOptions[timeFontIndex] || fontOptions[0];
}

function updateClockVisibility() {
  if (!clockContainer || !dayText || !dateText || !timeText) return;

  clockContainer.style.display = showClock ? "block" : "none";

  dayText.style.display = (showClock && showClockDayOfWeek) ? "block" : "none";
  dateText.style.display = (showClock && showClockDate) ? "block" : "none";
  timeText.style.display = (showClock && showClockTime) ? "block" : "none";
}

// --- Lively integration ---

function livelyAudioListener(audioArray) {
  initDomRefs();
  if (!showVisualizer || !canvas || !ctx || !audioArray) return;
  drawSpectrum(audioArray);
}

function livelyCurrentTrack(trackText) {
  initDomRefs();
  if (!audioElement) return;
  audioElement.style.color = textColor;
  audioElement.innerHTML = trackText || "";
}

function resolveFontIndex(val, currentIndex) {
  if (typeof val === "number") {
    if (val >= 0 && val < fontOptions.length) return val;
  } else if (typeof val === "string") {
    var n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0 && n < fontOptions.length) {
      return n;
    }
    if (fontLabelToIndex.hasOwnProperty(val)) {
      return fontLabelToIndex[val];
    }
  }
  return currentIndex;
}

function livelyPropertyListener(name, val) {
  initDomRefs();

  if (name === "color1") {
    inputColor1 = hexToRGB(val);
  } else if (name === "color2") {
    inputColor2 = hexToRGB(val);
  } else if (name === "background") {
    document.body.style.backgroundColor = val;
  } else if (name === "glow") {
    glow = !!val;
  } else if (name === "glowStrength") {
    glowStrength = Number(val) || 0;
  } else if (name === "textColor") {
    textColor = val;
    if (audioElement) audioElement.style.color = val;
  } else if (name === "amplitude") {
    amplitude = Number(val) || 300;
    resizeCanvas();
  } else if (name === "spectrumScale") {
    var raw = Number(val);
    if (isNaN(raw)) raw = 80;
    if (raw < 50) raw = 50;
    if (raw > 150) raw = 150;
    spectrumScale = raw / 100; // 0.5–1.5 width
    updateSpectrumPosition();
  } else if (name === "spectrumX") {
    spectrumX = clamp01((Number(val) || 50) / 100);
    updateSpectrumPosition();
  } else if (name === "spectrumY") {
    spectrumY = clamp01((Number(val) || 80) / 100);
    updateSpectrumPosition();
  } else if (name === "textScale") {
    textScale = (Number(val) || 100) / 100 * 1.0;
    updateTrackTextLayout();
  } else if (name === "textX") {
    textX = clamp01((Number(val) || 50) / 100);
    updateTrackTextLayout();
  } else if (name === "textY") {
    textY = clamp01((Number(val) || 50) / 100);
    updateTrackTextLayout();
  } else if (name === "useImg") {
    useImg = !!val;
    updateBackgroundMode();
  } else if (name === "imgPath") {
    imgName = val;
    applyImageSource();
    updateBackgroundMode();
  } else if (name === "useVideo") {
    useVideo = !!val;
    updateBackgroundMode();
  } else if (name === "videoPath") {
    videoName = val;
    applyVideoSource();
    updateBackgroundMode();
  } else if (name === "opacity") {
    opacity = (Number(val) || 100) / 100;
  } else if (name === "showVisualizer") {
    showVisualizer = !!val;
    updateVisualizerVisibility();
    updateTrackTextVisibility();
  } else if (name === "showTrackText") {
    showTrackText = !!val;
    updateTrackTextVisibility();
  } else if (name === "showClock") {
    showClock = !!val;
    updateClockVisibility();
  } else if (name === "showClockDayOfWeek") {
    showClockDayOfWeek = !!val;
    updateClockVisibility();
  } else if (name === "showClockDate") {
    showClockDate = !!val;
    updateClockVisibility();
  } else if (name === "showClockTime") {
    showClockTime = !!val;
    updateClockVisibility();
  } else if (name === "showSeconds") {
    showSeconds = !!val;
    updateClockText();
  } else if (name === "timeFormat") {
    var fmt = "12-hour";
    if (typeof val === "number") {
      fmt = (val === 1) ? "24-hour" : "12-hour";
    } else if (typeof val === "string") {
      if (val === "24-hour" || val === "1") {
        fmt = "24-hour";
      }
    }
    timeFormat = fmt;
    updateClockText();
  } else if (name === "dayFont") {
    dayFontIndex = resolveFontIndex(val, dayFontIndex);
    applyClockFonts();
  } else if (name === "dateFont") {
    dateFontIndex = resolveFontIndex(val, dateFontIndex);
    applyClockFonts();
  } else if (name === "timeFont") {
    timeFontIndex = resolveFontIndex(val, timeFontIndex);
    applyClockFonts();
  } else if (name === "dayScale") {
    dayScale = (Number(val) || 100) / 100 * 2.0;
    applyClockLayout();
  } else if (name === "dayX") {
    dayX = clamp01((Number(val) || 50) / 100);
    applyClockLayout();
  } else if (name === "dayY") {
    dayY = normalizeYSlider(val, 10);
    applyClockLayout();
  } else if (name === "dateScale") {
    dateScale = (Number(val) || 100) / 100 * 2.0;
    applyClockLayout();
  } else if (name === "dateX") {
    dateX = clamp01((Number(val) || 50) / 100);
    applyClockLayout();
  } else if (name === "dateY") {
    dateY = normalizeYSlider(val, 16);
    applyClockLayout();
  } else if (name === "timeScale") {
    timeScale = (Number(val) || 100) / 100 * 2.0;
    applyClockLayout();
  } else if (name === "timeX") {
    timeX = clamp01((Number(val) || 50) / 100);
    applyClockLayout();
  } else if (name === "timeY") {
    timeY = normalizeYSlider(val, 24);
    applyClockLayout();
  }
}

// --- Spectrum drawing ---

function updateVisualizerVisibility() {
  if (!canvas) return;
  canvas.style.display = showVisualizer ? "block" : "none";
}

function drawSpectrum(audioArray) {
  if (!canvas || !ctx || !audioArray || audioArray.length === 0) return;

  var width = canvas.width;
  var height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.globalAlpha = opacity;

  var grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "rgba(" + inputColor1 + "," + opacity + ")");
  grad.addColorStop(1, "rgba(" + inputColor2 + "," + opacity + ")");
  ctx.fillStyle = grad;

  if (glow) {
    ctx.shadowBlur = glowStrength;
    ctx.shadowColor = "rgba(" + inputColor2 + ",1)";
  } else {
    ctx.shadowBlur = 0;
  }

  var barCount = audioArray.length;
  var barWidth = width / barCount;
  var midY = height / 2;

  for (var i = 0; i < barCount; i++) {
    var v = audioArray[i];
    if (typeof v !== "number") continue;

    var norm = v;
    if (norm > 1.0) {
      norm = norm / 255.0;
    }
    if (norm < 0) norm = 0;
    if (norm > 1) norm = 1;

    var barHeight = Math.max(1, norm * amplitude);
    var x = i * barWidth;
    var y = midY - barHeight / 2;
    ctx.fillRect(x, y, barWidth * 0.9, barHeight);
  }
}
