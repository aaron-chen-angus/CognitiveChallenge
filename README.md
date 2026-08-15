# Cognitive Performance Challenge

A science-informed, mobile-friendly web application assessing four domains of cognitive performance through sequential gamified stations. Designed for use in health, wellness, community care, education, and cognitive engagement contexts.

---

## Purpose & Scope

This application provides a structured cognitive engagement tool that measures:

1. **Processing Speed** — Simple visual reaction time
2. **Memory & Recall** — Episodic / sequential memory
3. **Attention & Calculation** — Serial subtraction (sustained attention and mental manipulation)
4. **Visuospatial Processing** — Spatial perception and visuoconstruction

The application generates a **four-domain cognitive performance profile**. It is explicitly **not** a diagnostic tool — it does not diagnose dementia, cognitive impairment, mental illness, or neurological disease.

---

## Scientific Rationale

Each station is adapted from established cognitive assessment paradigms used in clinical neuropsychology and cognitive neuroscience research.

### Station 1: Processing Speed (Reaction Time)

Measures simple visual processing speed and psychomotor response latency. The participant responds to a colour-change stimulus (red → green) across three valid trials. This is a well-established paradigm for measuring basic neural processing speed.

**Key reference:** Woods DL, Wyma JM, Yund EW, Herron TJ, Reed B. Factors influencing the latency of simple reaction time. *Frontiers in Human Neuroscience*. 2015;9:131.

### Station 2: Memory & Recall (Picture Sequence Memory)

Uses a picture-sequence recall paradigm to assess episodic and sequential memory. Five images are presented individually in a randomised order; the participant must reconstruct the original sequence from memory. This is directly informed by the NIH Toolbox Picture Sequence Memory Test.

**Key references:**
- Dikmen SS, Bauer PJ, Weintraub S, et al. Measuring episodic memory across the lifespan: NIH Toolbox Picture Sequence Memory Test. *Journal of the International Neuropsychological Society*. 2014;20(6):611–619.
- Bauer PJ, Dikmen SS, Heaton RK, et al. NIH Toolbox Cognition Battery: Measuring Episodic Memory. *Monographs of the Society for Research in Child Development*. 2013;78(4):34–48.

### Station 3: Attention & Calculation (Serial Sevens)

Uses serial subtraction by 7 from a randomised starting number (88–99) to challenge sustained attention, working memory, and mental arithmetic. The serial sevens procedure is one of the most widely used brief cognitive tests in clinical practice.

**Key reference:** Karzmark P. Validity of the serial seven procedure. *International Journal of Geriatric Psychiatry*. 2000;15(8):677–679.

### Station 4: Visuospatial Processing (Jigsaw Puzzle)

Uses 3×3 jigsaw reconstruction to engage spatial perception, visuoconstruction, and mental rotation. Jigsaw puzzling has been shown to tap multiple cognitive abilities including visual search, mental rotation, working memory, and cognitive flexibility.

**Key reference:** Fissler P, Küster OC, Schlee W, Kolassa IT. Jigsaw puzzling taps multiple cognitive abilities and is a potential protective factor for cognitive aging. *Frontiers in Aging Neuroscience*. 2018;10:299.

---

## Technical Specifications

### Stack

- HTML5, CSS3, Vanilla JavaScript
- No frameworks, build tools, package managers, or API keys required
- Deployable directly on GitHub Pages as a static site
- Timing via `performance.now()` for sub-millisecond precision

### Project Structure

```
CognitiveChallenge/
├── index.html          # HTML shell with progress bar
├── styles.css          # Complete styling and responsive layout
├── config.js           # Configuration, webhook URL, reference data architecture
├── app.js              # Application controller, navigation, state management
├── stations.js         # Four station implementations (logic, UI, scoring)
├── results.js          # Final profile, Google Sheets integration, history, export
├── README.md           # This document
└── assets/
    ├── memory/         # Five square PNG images
    │   ├── apple.png
    │   ├── duck.png
    │   ├── hat.png
    │   ├── pen.png
    │   └── pineapple.png
    ├── puzzles/        # Four square puzzle source images
    │   ├── puzzle1.png
    │   ├── puzzle2.png
    │   ├── puzzle3.png
    │   └── puzzle4.png
    └── icons/          # Reserved for future use
```

---

## Application Flow

```
HOME → PARTICIPANT DETAILS → STATION 1 → RESULTS 1 → STATION 2 → RESULTS 2 → STATION 3 → RESULTS 3 → STATION 4 → FINAL PROFILE
```

Stations are locked sequentially — participants cannot skip ahead.

---

## Scoring Summary

| Station | Primary Metric | Additional Metrics |
|---------|---------------|-------------------|
| Reaction Time | Best RT (ms) | Mean, median, SD, range, false starts |
| Memory | Exact positions correct (0–5) | Adjacent pairs, recall time, perfect sequence |
| Calculation | Absolute accuracy (0–5) | Sequential consistency, total time, avg per answer |
| Visuospatial | Completion time (s) | Total moves, unproductive moves, first move accuracy |

---

## Data Collection — Google Sheets Integration

Results are automatically sent to Google Sheets when participants click **SAVE RESULT**.

### Live Results Spreadsheet

[https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA](https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA)

### How It Works

1. Participant completes all four stations and views their profile
2. On clicking "SAVE RESULT", data is saved to browser localStorage AND sent via `fetch` (POST, `mode: 'no-cors'`) to a Google Apps Script Web App
3. The Apps Script parses the JSON payload and appends a row to the spreadsheet
4. If the webhook URL is empty or unreachable, local save still works without errors

### Webhook URL

Configured in `config.js`:
```javascript
googleSheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbwzR2nWXPy9nfwYk0tFnSUJqe6a6DuUF5Zt7_ZjdzIQ7oPU9STMXIHxAAkSFAV2XHC0SQ/exec',
```

---

## Data Dictionary (Codebook)

All variables collected per assessment session. This serves as the definitive reference for data analysis.

| Column | Variable Name | Type | Description |
|--------|--------------|------|-------------|
| A | `timestamp` | String (ISO 8601) | Date and time of assessment completion |
| B | `nickname` | String | Participant's name or nickname |
| C | `age` | Integer | Participant's age in years |
| D | `gender` | String (categorical) | Male / Female / Others / Prefer not to say |
| **Reaction Time** | | | |
| E | `reactionBest` | Integer (ms) | Best (fastest) reaction time across 3 valid attempts |
| F | `reactionMean` | Integer (ms) | Arithmetic mean of 3 valid attempts |
| G | `reactionMedian` | Integer (ms) | Median of 3 valid attempts |
| H | `reactionSD` | Float (ms) | Standard deviation of 3 valid attempts |
| I | `reactionRange` | Integer (ms) | Range (slowest minus fastest) |
| J | `reactionSlowest` | Integer (ms) | Slowest valid reaction time |
| K | `reactionFalseStarts` | Integer (count) | Number of premature responses (taps before green) |
| L | `reactionAttempt1` | Integer (ms) | Reaction time for valid attempt 1 |
| M | `reactionAttempt2` | Integer (ms) | Reaction time for valid attempt 2 |
| N | `reactionAttempt3` | Integer (ms) | Reaction time for valid attempt 3 |
| **Memory & Recall** | | | |
| O | `memoryExactCorrect` | Integer (0–5) | Number of items placed in exact correct position |
| P | `memoryAccuracy` | Integer (0–100) | Percentage accuracy (exactCorrect / 5 × 100) |
| Q | `memoryAdjacentPairs` | Integer (0–4) | Number of correct adjacent item relationships preserved |
| R | `memoryRecallTime` | Float (seconds) | Time taken to complete recall phase |
| S | `memoryPerfectSequence` | String (Yes/No) | Whether all 5 items were in perfect order |
| T | `memoryPresentedOrder` | String (comma-separated) | The actual randomised sequence shown to participant |
| U | `memorySubmittedOrder` | String (comma-separated) | The sequence submitted by participant |
| **Attention & Calculation** | | | |
| V | `calcStartNumber` | Integer (88–99) | Randomly generated starting number |
| W | `calcSubtractionValue` | Integer | Subtraction interval (always 7) |
| X | `calcAbsoluteCorrect` | Integer (0–5) | Answers matching the mathematically correct sequence |
| Y | `calcAccuracy` | Integer (0–100) | Percentage accuracy (absoluteCorrect / 5 × 100) |
| Z | `calcSequentialConsistency` | Integer (0–100) | Percentage of answers that correctly subtract from the previous answer (even if prior answer was wrong) |
| AA | `calcTotalTime` | Float (seconds) | Total time from first input available to submission |
| AB | `calcAvgResponseTime` | Float (seconds) | Average time per answer (totalTime / 5) |
| AC | `calcFirstErrorPosition` | Integer (1–5) or empty | Position of first incorrect answer in the sequence |
| AD | `calcExpectedAnswers` | String (comma-separated) | Mathematically correct answer sequence |
| AE | `calcSubmittedAnswers` | String (comma-separated) | Participant's submitted answers |
| **Visuospatial Processing** | | | |
| AF | `puzzleId` | String (categorical) | Which puzzle image was used (puzzle1–puzzle4) |
| AG | `puzzleCompletionTime` | Float (seconds) | Time to solve the puzzle |
| AH | `puzzleMoves` | Integer (count) | Total number of tile swaps performed |
| AI | `puzzleUnproductiveMoves` | Integer (count) | Swaps that reduced the number of correctly placed tiles |
| AJ | `puzzleFirstMoveAccuracy` | String (Yes/No) | Whether the first swap increased correctly placed tiles |

### Variable Types for Statistical Analysis

| Category | Variables | Recommended Analysis |
|----------|-----------|---------------------|
| **Continuous (ratio)** | reactionBest, reactionMean, reactionMedian, reactionSD, reactionRange, reactionSlowest, reactionAttempt1–3, memoryRecallTime, calcTotalTime, calcAvgResponseTime, puzzleCompletionTime | Mean, SD, t-tests, regression |
| **Discrete count** | reactionFalseStarts, memoryExactCorrect, memoryAdjacentPairs, calcAbsoluteCorrect, puzzleMoves, puzzleUnproductiveMoves | Frequencies, chi-square, Poisson |
| **Percentage** | memoryAccuracy, calcAccuracy, calcSequentialConsistency | Descriptive, correlations |
| **Categorical (nominal)** | gender, puzzleId, memoryPerfectSequence, puzzleFirstMoveAccuracy | Frequencies, cross-tabs |
| **Ordinal** | calcFirstErrorPosition | Non-parametric tests |
| **Demographic** | age (continuous), nickname (identifier) | Grouping variable, covariate |

---

## Google Apps Script (Code.gs)

The following script is deployed as a Web App in the connected Google Sheet:

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

### Deployment Steps

1. In Google Sheet → **Extensions → Apps Script**
2. Paste the script above into `Code.gs`
3. **Deploy → New deployment → Web app**
4. Execute as: Me | Who has access: Anyone
5. Copy the URL and place in `config.js`

### Redeployment

If the script is edited, create a **New deployment** to generate a fresh URL. Update `config.js` accordingly.

---

## Local Storage

In addition to Google Sheets export, results are stored in browser `localStorage` (key: `cognitiveChallenge_history`). This enables:

- Viewing past results on the same device
- Comparing current performance against previous attempts (same nickname)
- Offline use when Google Sheets is unavailable

No sensitive medical information is stored. Use "DELETE HISTORY" to clear all local data.

---

## Reference Data Architecture

`config.js` contains empty structures for future population reference norms:

```javascript
const REFERENCE_DATA = {
    reaction: {},    // Age categories: 18–29, 30–39, 40–49, 50–59, 60–69, 70–79, 80+
    memory: {},
    calculation: {},
    visuospatial: {}
};
```

Functions like `getReactionReference(age, reactionTime)` currently return `null`. When validated reference datasets become available, they can be populated without modifying application logic.

---

## Asset Management

### Memory Images
- 5 square PNG files with transparent or solid backgrounds
- Filenames must match: `apple.png`, `duck.png`, `hat.png`, `pen.png`, `pineapple.png`
- Location: `assets/memory/`

### Puzzle Images
- 4 square images (any content)
- Filenames: `puzzle1.png`, `puzzle2.png`, `puzzle3.png`, `puzzle4.png`
- Location: `assets/puzzles/`
- Dynamically divided into 3×3 grid via CSS `background-size: 300% 300%` and `background-position`

### Replacing Images
Replace files in the respective `assets/` folder. Maintain square aspect ratio. No code changes required.

---

## Deployment

### GitHub Pages
1. Push entire `CognitiveChallenge/` contents to the repository root
2. Repository Settings → Pages → Deploy from branch → `main` → `/ (root)`
3. All paths are relative — works directly without configuration

### Local Development
Open `index.html` directly in a browser, or use a simple server:
```bash
npx serve .
```

---

## Accessibility

- Body text ≥ 16px
- Minimum touch target 48px
- High contrast text (WCAG AA)
- Responsive: portrait phone, tablet, desktop
- No hover-only interactions
- Pointer events (works with touch, stylus, and mouse)

---

## Limitations

- No clinical validation — performance data is descriptive only
- No population norms available yet
- Timing precision depends on device hardware and browser
- Puzzle difficulty may vary between the four images
- localStorage is per-browser/device
- Google Sheets sync requires internet connectivity

---

## Ethical Positioning

This application deliberately avoids clinical or diagnostic language. It does not use terms such as:

- ~~Normal / Abnormal brain~~
- ~~Dementia detected~~
- ~~Cognitive impairment~~
- ~~IQ / Brain age / Mental illness~~

Instead it uses: Performance, Cognitive domain, Processing speed, Memory performance, Attention & calculation, Visuospatial processing, Current result, Previous result, Reference comparison.

---

## Disclaimer

These tasks are science-informed adaptations of established cognitive assessment paradigms. The application itself is not a validated clinical cognitive assessment. It is designed for cognitive engagement and performance monitoring purposes only.
