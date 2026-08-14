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

## Google Sheets Integration

Every time a participant clicks **SAVE RESULT**, the app automatically sends all data to a Google Sheet for centralised collection.

### Live Results

View collected results here:
[https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA](https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA)

### How It Works

1. When "SAVE RESULT" is pressed, the app saves locally AND sends data to a Google Apps Script Web App
2. The Apps Script receives the JSON payload and appends a row to the spreadsheet
3. Uses `mode: 'no-cors'` so it works from GitHub Pages without CORS issues
4. If the webhook URL is empty or unreachable, local save still works — no errors shown to participants

### Spreadsheet Columns

| Column | Field | Description |
|--------|-------|-------------|
| A | timestamp | ISO date/time of completion |
| B | nickname | Participant name |
| C | age | Participant age |
| D | gender | Participant gender |
| E | reactionBest | Best reaction time (ms) |
| F | reactionMean | Average reaction time (ms) |
| G | reactionMedian | Median reaction time (ms) |
| H | reactionSD | Standard deviation (ms) |
| I | reactionRange | Range (ms) |
| J | reactionSlowest | Slowest attempt (ms) |
| K | reactionFalseStarts | Number of false starts |
| L | reactionAttempt1 | Attempt 1 time (ms) |
| M | reactionAttempt2 | Attempt 2 time (ms) |
| N | reactionAttempt3 | Attempt 3 time (ms) |
| O | memoryExactCorrect | Items in correct position (0–5) |
| P | memoryAccuracy | Accuracy percentage |
| Q | memoryAdjacentPairs | Correct adjacent pairs (0–4) |
| R | memoryRecallTime | Recall time (seconds) |
| S | memoryPerfectSequence | Yes/No |
| T | memoryPresentedOrder | Actual sequence shown |
| U | memorySubmittedOrder | Participant's sequence |
| V | calcStartNumber | Starting number (88–99) |
| W | calcSubtractionValue | Subtraction interval (3 or 7) |
| X | calcAbsoluteCorrect | Correct answers (0–5) |
| Y | calcAccuracy | Accuracy percentage |
| Z | calcSequentialConsistency | Sequential consistency % |
| AA | calcTotalTime | Total completion time (s) |
| AB | calcAvgResponseTime | Average per answer (s) |
| AC | calcFirstErrorPosition | Position of first error |
| AD | calcExpectedAnswers | Correct answer sequence |
| AE | calcSubmittedAnswers | Participant's answers |
| AF | puzzleId | Which puzzle used (puzzle1–4) |
| AG | puzzleCompletionTime | Completion time (s) |
| AH | puzzleMoves | Total tile swaps |
| AI | puzzleUnproductiveMoves | Unproductive swaps |
| AJ | puzzleFirstMoveAccuracy | First move productive (Yes/No) |

### Google Apps Script (Code.gs)

The following script is deployed as a Web App in the Google Sheet:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.nickname || '',
      data.age || '',
      data.gender || '',
      data.reactionBest || '',
      data.reactionMean || '',
      data.reactionMedian || '',
      data.reactionSD || '',
      data.reactionRange || '',
      data.reactionSlowest || '',
      data.reactionFalseStarts || '',
      data.reactionAttempt1 || '',
      data.reactionAttempt2 || '',
      data.reactionAttempt3 || '',
      data.memoryExactCorrect || '',
      data.memoryAccuracy || '',
      data.memoryAdjacentPairs || '',
      data.memoryRecallTime || '',
      data.memoryPerfectSequence || '',
      data.memoryPresentedOrder || '',
      data.memorySubmittedOrder || '',
      data.calcStartNumber || '',
      data.calcSubtractionValue || '',
      data.calcAbsoluteCorrect || '',
      data.calcAccuracy || '',
      data.calcSequentialConsistency || '',
      data.calcTotalTime || '',
      data.calcAvgResponseTime || '',
      data.calcFirstErrorPosition || '',
      data.calcExpectedAnswers || '',
      data.calcSubmittedAnswers || '',
      data.puzzleId || '',
      data.puzzleCompletionTime || '',
      data.puzzleMoves || '',
      data.puzzleUnproductiveMoves || '',
      data.puzzleFirstMoveAccuracy || ''
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Cognitive Challenge webhook is active.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### Redeploying

If you edit the Apps Script, you must create a **New deployment** (not just save) to get an updated URL. Update the URL in `config.js` accordingly.

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
