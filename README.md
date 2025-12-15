# LivelyWallpaper
Christian Wallpaper for Lively
# Christian Wallpaper, Clock and Visualizer

A configurable **Lively Wallpaper** that combines:

- A burning-bush scene inspired by the Exodus story (ultrawide 3440×1440).
- A reactive audio visualizer bar that matches the colors of the flames.
- A highly customizable clock (day, date, time, 12/24-hour, fonts, positions, scaling).
- Optional track text display for the currently playing audio.

Built for Lively Wallpaper as an HTML/JS wallpaper.

---

## Features

- **Dynamic background**
  - Supports either a static image or a looping video background.
  - Default assets: `images/background.png` and `video/background.mp4`
    (burning bush + mountain range).

- **Audio visualizer**
  - Reacts to system audio in real time.
  - Adjustable bar height, width (scale), opacity, position (X/Y).
  - Two-color gradient that matches the burning-bush palette by default.
  - Optional neon glow effect with configurable strength.

- **Clock**
  - Toggle each component independently:
    - Day of week
    - Day & month
    - Time
    - Seconds
  - Choose 12-hour or 24-hour mode.
  - Per-element:
    - Font (using common system fonts)
    - Scale (size)
    - X/Y position (grid-based for easy alignment)

- **Track text**
  - Optional display of the current audio track.
  - Independent color, scale, and position.

- **User-friendly settings**
  - All options exposed through Lively’s UI using `livelyproperties.json`
    (colors, toggles, positions, scales, background selection, etc.).

---

## Requirements

- **OS:** Windows 10 or Windows 11  
- **Wallpaper engine:** [Lively Wallpaper](https://github.com/rocksdanister/lively)  
- **Hardware:** Any GPU/CPU that can comfortably handle HTML5 canvas animations and video playback.

---

## Installation

1. **Install Lively Wallpaper**

   Download and install Lively from its official site or GitHub releases.

2. **Get this wallpaper**

   - Clone the repository:

     ```bash
     git clone https://github.com/Christhetech131/LivelyWallpaper.git
     ```

   - or download it as a ZIP and extract it somewhere permanent
     (do not delete the folder after adding it to Lively).

3. **Add to Lively**

   - Open **Lively Wallpaper**.
   - Click **Add Wallpaper** → **Choose File**.
   - Browse to the folder and select `index.html`.
   - Give it a name if prompted (e.g. *Christian Wallpaper, Clock and Visualizer*).

4. **Set as wallpaper**

   - After adding, select the wallpaper in Lively and click **Set As Wallpaper**.

---

## Configuration

Open the wallpaper’s settings from within Lively (gear icon on the wallpaper card).  
You’ll see a set of controls mapped to `livelyproperties.json`. Key groups:

### Background

- **use image as background** (`useImg`)  
- **Image/Gif** (`imgPath`)
- **use video as background** (`useVideo`)
- **Video** (`videoPath`)
- **background color** (`background`)

Only one of *use image* or *use video* should normally be enabled.  
If both are off, the wallpaper falls back to a black “how to configure” screen.

### Visualizer

- **show visualizer** (`showVisualizer`)
- **starting color** / **finish color** (`color1`, `color2`)
- **spectrum opacity** (`opacity`)
- **bar height** (`amplitude`)
- **spectrum scale** (`spectrumScale`) – width of the bar
- **spectrum x position** / **spectrum y position** (`spectrumX`, `spectrumY`)
- **neon glow effect** / **neon effect strength** (`glow`, `glowStrength`)

### Clock

- **show clock** (`showClock`)
- **show day of week** (`showClockDayOfWeek`)
- **show day & month** (`showClockDate`)
- **show time** (`showClockTime`)
- **show seconds** (`showSeconds`)
- **time format** (`timeFormat`) – 12-hour / 24-hour

For each part of the clock:

- **day font / scale / x position / y position** (`dayFont`, `dayScale`, `dayX`, `dayY`)
- **date font / scale / x position / y position** (`dateFont`, `dateScale`, `dateX`, `dateY`)
- **time font / scale / x position / y position** (`timeFont`, `timeScale`, `timeX`, `timeY`)

These share a common positioning grid so the elements can align cleanly.

### Track text

- **show track text** (`showTrackText`)
- **audio track text color** (`textColor`)
- **track text scale / x position / y position** (`textScale`, `textX`, `textY`)

---

## Project structure

Key files:

- `index.html` – main HTML entry point for Lively.
- `js/script.js` – visualizer, clock logic, and Lively integration.
- `images/background.png` – default static background.
- `video/background.mp4` – default looping burning-bush video.
- `livelyinfo.json` – metadata for Lively.
- `livelyproperties.json` – exposes settings in Lively’s UI.
- `LICENSE` – MIT license for the code.
- `ASSETS.md` – licensing and attribution for images/video.

---

## Licensing

- **Code:** Licensed under the [MIT License](./LICENSE).  
  - Copyright © 2020 NowbodyAnybody  
  - Copyright © 2025 Christopher Galati

- **Artwork (burning-bush image & video):**  
  See [ASSETS.md](./ASSETS.md) for details. In short:
  - Burning-bush background (image & video) © 2025 Christopher Galati.  
  - Licensed under Creative Commons **CC BY 4.0** so others can reuse and remix
    it with attribution.

If you fork this project, please keep the license files and asset credits.

---

## Credits

- Original concept and base visualizer logic inspired by  
  **“Lively Audio Visualizer”** by *NowbodyAnybody* (MIT-licensed).
- Lively Wallpaper by [rocksdanister](https://github.com/rocksdanister/lively).

---

## Contributing

Issues and pull requests are welcome. If you add features or new assets:

- Keep the code under MIT.
- Document any additional images/video and their licenses in `ASSETS.md`.

Enjoy the wallpaper!
