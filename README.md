# Cognitive Performance Challenge

A polished, mobile-friendly web application that assesses four domains of cognitive performance through gamified stations completed in a fixed sequence.

## Purpose

This application provides a science-informed cognitive engagement tool suitable for health, wellness, community care, education, and cognitive engagement contexts.

**Important:** This is NOT a diagnostic tool. It does not diagnose dementia, cognitive impairment, mental illness, or neurological disease. It generates a four-domain cognitive performance profile.

## Four Domains

| Station | Domain | Colour | Method |
|---------|--------|--------|--------|
| 1 | Processing Speed | Orange/Coral | Simple visual reaction time (3 trials) |
| 2 | Memory & Recall | Purple | Picture-sequence recall (5 items) |
| 3 | Attention & Calculation | Teal | Serial subtraction (5 calculations) |
| 4 | Visuospatial Ability | Blue | 3×3 jigsaw puzzle reconstruction |

## Scientific Rationale

- **Reaction Time** — Measures simple visual processing speed and psychomotor response, adapted from standard reaction time paradigms (Woods et al., 2015).
- **Memory & Recall** — Uses a picture-sequence recall paradigm to assess episodic/sequential memory, informed by NIH Toolbox Picture Sequence Memory Test (Dikmen et al., 2014; Bauer et al., 2013).
- **Attention & Calculation** — Uses serial subtraction to challenge sustained attention, working mental manipulation and calculation, based on established serial seven procedures (Karzmark, 2000).
- **Visuospatial Ability** — Uses jigsaw reconstruction to engage spatial perception, visuoconstruction and mental manipulation (Fissler et al., 2018).

## Project Structure

```
CognitiveChallenge/
├── index.html          # Main HTML shell
├── styles.css          # Complete styling
├── config.js           # Configuration, reference data architecture
├── app.js              # Main application controller & navigation
├── stations.js         # All four station logic (reaction, memory, calculation, puzzle)
├── results.js          # Final profile, history, download
├── README.md           # This file
└── assets/
    ├── memory/         # Memory station images
    │   ├── apple.png
    │   ├── duck.png
    │   ├── hat.png
    │   ├── pen.png
    │   └── pineapple.png
    ├── puzzles/        # Visuospatial puzzle images
    │   ├── puzzle1.png
    │   ├── puzzle2.png
    │   ├── puzzle3.png
    │   └── puzzle4.png
    └── icons/          # (reserved for future use)
```

## Asset Requirements

### Memory Images
- 5 square PNG images with transparent (or black) backgrounds
- Filenames: `apple.png`, `duck.png`, `hat.png`, `pen.png`, `pineapple.png`
- Place in: `assets/memory/`

### Puzzle Images
- 4 square images (any content)
- Filenames: `puzzle1.png`, `puzzle2.png`, `puzzle3.png`, `puzzle4.png`
- Place in: `assets/puzzles/`
- The app dynamically divides each into a 3×3 grid using CSS `background-position`

## How to Run Locally

1. Clone or download this folder
2. Place image assets in the appropriate `assets/` subdirectories
3. Open `index.html` in any modern browser
4. No build process, package manager, or server required

Alternatively, use a simple local server:
```bash
npx serve .
# or
python -m http.server 8000
```

## How to Deploy on GitHub Pages

1. Push this folder to a GitHub repository (as root or subfolder)
2. Go to Repository Settings → Pages
3. Deploy from branch: `main` → `/root` (or the subfolder path)
4. All file paths are relative — works directly on GitHub Pages

## Scoring

### Reaction Time
- **Primary:** Best reaction time (ms) across 3 valid attempts
- **Additional:** Mean, median, SD, range, false starts

### Memory & Recall
- **Exact Position Score:** Items in correct position (0–5)
- **Adjacent Pairs:** Correct sequential relationships preserved (0–4)
- **Recall Time:** Seconds to complete recall
- **Perfect Sequence:** Boolean

### Attention & Calculation
- **Absolute Accuracy:** Correct answers vs mathematically correct sequence (0–5)
- **Sequential Consistency:** Whether each answer correctly subtracts from the previous answer
- **Completion Time & Average per Answer**

### Visuospatial
- **Completion Time:** Primary metric
- **Moves:** Total tile swaps
- **Unproductive Moves:** Swaps that reduced correct tile count

## localStorage

Results are saved to browser localStorage when the user clicks "SAVE RESULT."

Stored data includes:
- Participant nickname, age, gender
- All derived scores and timing
- Station configuration (start number, subtraction value, puzzle ID)
- Completion timestamp

No sensitive medical information is stored.

Use "DELETE HISTORY" to clear all saved data.

## Reference Data Architecture

`config.js` contains empty reference data structures for future population norms:

```js
const REFERENCE_DATA = {
    reaction: {},   // age categories: 18-29, 30-39, ... 80+
    memory: {},
    calculation: {},
    visuospatial: {}
};
```

Functions like `getReactionReference(age, reactionTime)` return `null` until real reference datasets are entered.

## Replacing Images

### Memory Images
Replace any file in `assets/memory/` with a same-named PNG. The app reads from `config.js` paths.

### Puzzle Images
Replace any file in `assets/puzzles/` with a square image. The app will automatically divide it into 9 tiles using CSS background positioning.

## Limitations

- No clinical validation — performance data is descriptive only
- No population norms yet — comparison is self-referenced
- Timing relies on `performance.now()` — accurate to sub-millisecond on modern browsers
- Puzzle difficulty may vary between images
- localStorage is per-browser/device

## Disclaimer

These tasks are science-informed adaptations of established cognitive assessment paradigms. The application itself is not a validated clinical cognitive assessment.
