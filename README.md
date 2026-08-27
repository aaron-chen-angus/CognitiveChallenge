# Cognitive Performance Challenge — System, Data, Scientific & Analytical Manual

A science-informed, mobile-friendly web application that measures four cognitive domains through four sequential, gamified stations and produces a single combined **Cognitive Performance Profile**. Designed for health, wellness, community-care, education, and cognitive-engagement contexts.

> **Cognitive Challenge is a science-informed cognitive performance challenge, NOT a clinical diagnostic instrument.** It does not diagnose dementia, cognitive impairment, mental illness, or neurological disease, and produces no IQ, brain-age, or MMSE/MoCA-equivalent score. Results are descriptive individual performance data.

> **Quick access** — App: https://aaron-chen-angus.github.io/CognitiveChallenge/ · Live Results Sheet: https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA (details in §2).

---

## 1. Cognitive Challenge Overview

### Purpose
The application provides a structured, engaging way to measure and monitor performance across four cognitive domains using short, gamified tasks that run entirely in the browser. It generates an individual four-domain profile and can compare against a participant's own previous result.

### Intended users
- Health, wellness, and community-care programmes
- Educational and cognitive-engagement settings
- Individuals monitoring their own performance over time
- Facilitators/operators running group sessions

### Four sequential cognitive stations
1. **Processing Speed / Reaction Time** — simple visual reaction time (red → green stimulus, 3 valid attempts).
2. **Memory & Recall** — picture-sequence recall of 5 images (episodic/sequential memory paradigm).
3. **Attention & Calculation** — serial subtraction of 7, five times, from a random start (88–99).
4. **Visuospatial Processing** — reconstruct a shuffled 3×3 image puzzle by swapping tiles.

### Locked sequential progression
Stations must be completed in order (`reaction → memory → calculation → visuospatial`). `App.showStation()` blocks a station until the previous one is in `completedStations`, and the progress bar shows completed (✓), current (number), and locked (🔒) states. A `beforeunload` guard warns if the page is refreshed mid-assessment.

### Participant information collected
Entered on the Participant Details screen: `nickname` (required), `age` (required integer, form range 1–120), and `gender` (Male / Female / Others / Prefer not to say).

### Result metrics generated
Per station: raw task measurements plus derived statistics (see §5–§8). Reaction: best/mean/median/SD/range/slowest/false starts + the three attempts. Memory: exact-position correct, accuracy %, adjacent pairs, recall time, perfect-sequence flag, presented/submitted orders. Calculation: absolute correct, accuracy %, sequential consistency, total time, avg response time, first-error position, expected/submitted answers. Visuospatial: puzzle ID, completion time, moves, unproductive moves, first-move accuracy.

### Final four-domain cognitive performance profile
The results screen shows four domain cards (Processing Speed, Memory & Recall, Attention & Calculation, Visuospatial Processing) with each domain's own metrics and, where a prior saved record exists for the same nickname, a same-domain comparison. **There is no combined/overall score and no normalisation** (see §9).

### Local storage and Google Sheets data collection
On **SAVE RESULT**, the nested session record is appended to browser `localStorage` (key `cognitiveChallenge_history`) and, if a webhook is configured, a flattened payload is POSTed to a Google Apps Script Web App that appends a row to the Live Results Google Sheet.

### Application limitations
Timing depends on device/browser latency; tasks sample selected constructs, not all of cognition; puzzle images may differ in difficulty; there are no population norms; and repeated use can produce practice effects. See §17–§18.

---

## 2. Application and Data Access

**Application URL**
https://aaron-chen-angus.github.io/CognitiveChallenge/

**Live Results Dataset (Google Sheet)**
https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA

The Live Results Google Sheet contains assessment results submitted from the deployed application. When a participant taps **SAVE RESULT**, a flattened result object is POSTed to a Google Apps Script Web App that appends one row to the sheet.

**Submission is configurable, not mandatory.** Export is controlled by `CONFIG.googleSheetsWebhookUrl` in `config.js`. In the committed configuration this URL is populated, so saving also submits to the sheet. If the value is empty (`''`), the app saves to local storage only. The POST uses `fetch(..., { mode: 'no-cors' })`, so the browser cannot read the response — the app cannot confirm the write succeeded from the client side (it logs to console and always shows "Result saved successfully!" for the local save).

---

## 3. System and Data Pipeline

```
Participant
   │  (enters nickname, age, gender)
   ▼
Cognitive Challenge Web App (browser, static site)
   │
   ├─ Station 1 Reaction Time ─────► attempts[3], greenTimestamp via performance.now()
   ├─ Station 2 Memory & Recall ───► presented/submitted order, recall timing
   ├─ Station 3 Attention & Calc ──► expected/submitted answers, timing
   └─ Station 4 Visuospatial Puzzle► tile swaps, moves, completion timing
   │
   ▼
Metric Calculation (stations.js)  — best/mean/median/SD, accuracy %, sequential consistency, etc.
   │
   ▼
Cognitive Performance Profile (results.js renderFinalProfile) — 4 domain cards + own-history comparison
   │   (on SAVE RESULT)
   ├──► Local Storage (localStorage key: cognitiveChallenge_history)   [always]
   │
   └──► Google Apps Script Web App (flattened, fetch POST, no-cors)    [if webhook configured]
              │
              ▼
        Google Sheet (Live Results Dataset)
              │
              ▼
        Statistical Analysis / R / R Shiny (CSV/gviz or googlesheets4)
```

### Where each stage occurs
All station logic, timing (`performance.now()`), scoring, profile rendering, and local storage run **in the browser on the participant's device**. Only the flattened numeric/text result leaves the device, and only if a webhook is configured. No camera, microphone, or images of the participant are involved.

### Data classification

| Category | Fields |
|----------|--------|
| **User-entered** | `nickname`, `age`, `gender` |
| **Automatically generated metadata** | `timestamp` (from `completedAt`), `startNumber`, `subtractionValue`, `expectedAnswers`, `presentedOrder`, `puzzleId` (randomly generated task parameters) |
| **Raw task measurements** | reaction `attempts[]`, memory `submittedOrder`, calculation `submittedAnswers`, puzzle `moves`, recall/puzzle/calc timings |
| **Calculated / derived variables** | reaction best/mean/median/SD/range/slowest; memory exactCorrect/accuracy/adjacentPairs/perfectSequence; calc absoluteCorrect/accuracy/sequentialConsistency/avgResponseTime/firstErrorPosition; puzzle unproductiveMoves/firstMoveAccuracy |
| **Station-level scores** | best RT (ms), memory exact-correct (0–5), calc absolute-correct (0–5), puzzle completion time (s) |
| **Final domain metrics** | the four domain cards (no combined score) |
| **Google Sheets exported fields** | 36 flattened fields (see §4) |

---

## 4. Comprehensive Data Dictionary

This lists **every field in the `flat` object** built by `Results.sendToGoogleSheets()` in `results.js` — the exact payload POSTed to Google Sheets (`JSON.stringify(flat)`). The nested `localStorage` record contains the same values grouped under `participant`, `reaction`, `memory`, `calculation`, `visuospatial`, and `completedAt`. Fields whose source station is skipped export as `''` (empty string).

| Field Name | Data Type | Unit / Format | Description | Source / Calculation |
|------------|-----------|---------------|-------------|----------------------|
| `timestamp` | DateTime | ISO 8601 string | When the result was saved | `record.completedAt = new Date().toISOString()` |
| `nickname` | String | free text | Participant name/nickname | User-entered |
| `age` | Integer | years | Participant age | User-entered (`parseInt`, form 1–120) |
| `gender` | Categorical | Male / Female / Others / Prefer not to say | Participant gender | User-entered |
| `reactionBest` | Integer | ms | Fastest of 3 valid attempts | `Math.min(...attempts)` |
| `reactionMean` | Integer | ms | Mean of 3 attempts | `round(sum/n)` |
| `reactionMedian` | Integer | ms | Median of attempts | middle of sorted attempts (`sorted[floor(n/2)]`) |
| `reactionSD` | Numeric | ms | Std dev of attempts | sample SD (n−1), `calcStdDev`, 1 dp then `parseFloat` |
| `reactionRange` | Integer | ms | Slowest − fastest | `slowest − best` |
| `reactionSlowest` | Integer | ms | Slowest attempt | `Math.max(...attempts)` |
| `reactionFalseStarts` | Integer | count | Premature taps (during red) | incremented in `handleTap()` |
| `reactionAttempt1` | Integer | ms | Valid attempt 1 | `attempts[0]` |
| `reactionAttempt2` | Integer | ms | Valid attempt 2 | `attempts[1]` |
| `reactionAttempt3` | Integer | ms | Valid attempt 3 | `attempts[2]` |
| `memoryExactCorrect` | Integer | 0–5 | Items in exact correct position | count where `submitted[i].id === presented[i].id` |
| `memoryAccuracy` | Integer | 0–100 (%) | Exact-position accuracy | `round(exactCorrect/5 × 100)` |
| `memoryAdjacentPairs` | Integer | 0–4 | Correct adjacent-pair relations preserved | see adjacent-pair algorithm (§6) |
| `memoryRecallTime` | Numeric | seconds | Time to complete recall | `(performance.now() − recallStartTime)/1000`, 1 dp |
| `memoryPerfectSequence` | Categorical | Yes / No | All 5 exact | `exactCorrect === 5` → Yes/No on export |
| `memoryPresentedOrder` | String (from Array) | comma-separated item ids | Randomised order shown | `presentedOrder.map(id).join(', ')` |
| `memorySubmittedOrder` | String (from Array) | comma-separated item ids | Participant's order | `submittedOrder.join(', ')` |
| `calcStartNumber` | Integer | 88–99 | Random start number | `randomInt(88,99)` |
| `calcSubtractionValue` | Integer | — | Subtraction step (always 7) | `CONFIG.calculation.subtractionValue` |
| `calcAbsoluteCorrect` | Integer | 0–5 | Answers matching true sequence | count where `submitted[i] === expected[i]` |
| `calcAccuracy` | Integer | 0–100 (%) | Absolute accuracy | `round(absoluteCorrect/5 × 100)` |
| `calcSequentialConsistency` | Integer | 0–100 (%) | Answers consistent with previous answer − 7 | see §7 formula |
| `calcTotalTime` | Numeric | seconds | Time from render to submit | `(performance.now() − timerStart)/1000`, 1 dp |
| `calcAvgResponseTime` | Numeric | seconds | Mean time per answer | `totalTime / 5`, 1 dp |
| `calcFirstErrorPosition` | Integer or empty | 1–5 (position) | First incorrect answer position | first `i+1` where `submitted[i] !== expected[i]`; `null`→`''` |
| `calcExpectedAnswers` | String (from Array) | comma-separated integers | True answer sequence | `expectedAnswers.join(', ')` |
| `calcSubmittedAnswers` | String (from Array) | comma-separated (may contain blanks) | Submitted answers | `submittedAnswers.join(', ')` (null entries render as empty between commas) |
| `puzzleId` | Categorical | puzzle1–puzzle4 | Which puzzle image | `puzzle{index+1}` from random selection |
| `puzzleCompletionTime` | Numeric | seconds | Time to solve | `(performance.now() − timerStart)/1000`, 1 dp |
| `puzzleMoves` | Integer | count | Total tile swaps | incremented per swap |
| `puzzleUnproductiveMoves` | Integer | count | Swaps reducing correctly placed tiles | `correctAfter < correctBefore` |
| `puzzleFirstMoveAccuracy` | Categorical | Yes / No | First swap increased correct placements | `firstMoveAccuracy` boolean → Yes/No on export |

**Total exported fields: 36.**

### Data Dictionary Validation
- Checked field-by-field against the actual payload: `sendToGoogleSheets()` builds the `flat` object with exactly these 36 keys and sends `JSON.stringify(flat)`. The Google Apps Script (§20) writes them via a fixed-order `appendRow([...])` of the same 36 values.
- **Variables calculated by the app but NOT exported:**
  - Visuospatial correct-placement count (`getCorrectCount()` / `isSolved()`) — used to derive `unproductiveMoves`/`firstMoveAccuracy` but the count itself is not stored/exported.
  - Calculation per-answer `responseTimes[]` array — partially collected in `onInputFocus` but **not** used in the exported metrics and **not** exported (see §7 inconsistency note; `averageResponseTime` is derived from `totalTime/5`, not from this array).
  - Reaction `currentState`, `greenTimestamp`, and raw pre-round timing internals.
  - The on-screen own-history **comparison** values (e.g. "↑ 30 ms faster") are computed at render time from stored history, not exported as fields.
- **Variables exported but requiring interpretation:** `memoryPresentedOrder`, `memorySubmittedOrder`, `calcExpectedAnswers`, `calcSubmittedAnswers` are **stringified arrays** (comma-separated) and must be parsed/split before analysis; `calcSubmittedAnswers` can contain blank entries where an answer was left empty (`null`); `calcFirstErrorPosition` is blank when there is no error; the four "Yes/No" fields are categorical strings, not booleans.
- **Field-name mismatches between app payload and Google Sheet headers:** none in name; the Apps Script maps values **by key in a fixed column order** (not by matching header text). The documented header order (§20) matches the payload key order. Reordering sheet columns without editing the script will misalign labels and values.
- **Array/JSON fields requiring parsing:** `memoryPresentedOrder`, `memorySubmittedOrder`, `calcExpectedAnswers`, `calcSubmittedAnswers` (comma-separated; split on `", "`).

---

## 5. Station 1: Reaction Time — Methodology and Metrics

### Task flow (from `ReactionStation`)
- **Red waiting phase:** the screen shows red ("Wait for GREEN…").
- **Random delay:** `randomInt(CONFIG.reaction.minDelay, maxDelay)` = **2000–5000 ms** before green.
- **Green stimulus:** on green, `greenTimestamp = performance.now()`.
- **Response timing:** on tap during green, `responseTime = performance.now() − greenTimestamp`, rounded to the nearest ms and pushed to `attempts`.
- **False-start detection:** a tap during red increments `falseStarts`, cancels the pending timeout, shows "TOO EARLY!", and **restarts the same attempt** after `falseStartDelay` = 1500 ms (false starts do not count as valid attempts).
- **Valid attempts:** `requiredAttempts` = **3**. The station ends after 3 valid responses.
- **Primary score:** best (fastest) valid reaction time.

### Metrics

| Metric (exported) | Purpose | Calculation | Unit | Interpretation | Limitations |
|-------------------|---------|-------------|------|----------------|-------------|
| `reactionBest` | Primary processing-speed score | `min(attempts)` | ms | Lower = faster | Single best trial; sensitive to one fast tap |
| `reactionMean` | Central tendency | `round(mean(attempts))` | ms | Lower = faster overall | Only 3 trials |
| `reactionMedian` | Robust central tendency | `sorted[floor(3/2)]` = middle value | ms | Lower = faster | With n=3, equals the middle of the sorted trio |
| `reactionSlowest` | Worst trial | `max(attempts)` | ms | Higher = slower | Single trial |
| `reactionRange` | Spread | `slowest − best` | ms | Lower = more stable | Only 3 trials |
| `reactionSD` | Variability | sample SD (n−1) of attempts | ms | Lower = more consistent | Unstable with n=3 |
| `reactionFalseStarts` | Impulsivity/anticipation | count of red-phase taps | count | Higher = more anticipatory errors | — |
| `reactionAttempt1/2/3` | Raw trials | stored per attempt | ms | For within-session analysis | — |

### Timing limitations (important)
Reaction time here is measured with `performance.now()` in the browser, but the value reflects **display latency, input/pointer-event latency, and browser/OS scheduling** in addition to neural/psychomotor time. Web-based reaction times are **not equivalent to laboratory psychophysics hardware** and typically include tens of milliseconds of device-dependent overhead. Treat values as relative within the same device, and avoid cross-device comparison without calibration.

---

## 6. Station 2: Memory & Recall — Methodology and Metrics

### Task flow (from `MemoryStation`)
- **Memory item assets:** 5 fixed items in `CONFIG.memory.items` (apple, duck, hat, pen, pineapple), each a PNG in `assets/memory/`.
- **Item randomisation:** `presentedOrder = fisherYatesShuffle(items)`.
- **Presentation sequence:** items shown one at a time; each for `displayDuration` = **2000 ms**; then `postEncodingDelay` = **500 ms** before recall.
- **Recall/reconstruction phase:** a shuffled pool (`recallPool = fisherYatesShuffle(presentedOrder)`) plus 5 ordered slots.
- **Interaction:** tap an item to auto-place it in the first empty slot (or select/deselect); tap a slot to place the selected item or to remove an item. **Tap-based, not drag** (works with touch/mouse/stylus via pointer events). Submit is enabled only when all 5 slots are filled.
- **Recall timer:** `recallStartTime = performance.now()` at the start of recall; `recallTime = (now − recallStartTime)/1000` (1 dp) on submit.

### Metrics

| Metric (exported) | Purpose | Calculation | Unit | Interpretation |
|-------------------|---------|-------------|------|----------------|
| `memoryExactCorrect` | Exact-position accuracy (primary) | count of `submitted[i].id === presented[i].id` over i=0..4 | 0–5 | Higher = better |
| `memoryAccuracy` | Percentage form | `round(exactCorrect/5 × 100)` | 0–100% | Higher = better |
| `memoryAdjacentPairs` | Relational/sequence memory | see formula below | 0–4 | Higher = better order retention |
| `memoryPerfectSequence` | Perfect recall flag | `exactCorrect === 5` | Yes/No | — |
| `memoryRecallTime` | Reconstruction speed | `(now − recallStartTime)/1000` | s | Interpret with accuracy (§10.5) |
| `memoryPresentedOrder` | Ground-truth order | ids joined by ", " | array→string | For scoring/audit |
| `memorySubmittedOrder` | Response order | ids joined by ", " | array→string | For scoring/audit |

### Adjacent-pair scoring formula (exact, from code)
For each of the 4 consecutive pairs in the **presented** order, form the string `presented[i].id + '->' + presented[i+1].id`. For each such correct pair, scan all 4 consecutive pairs in the **submitted** order (`submitted[j].id + '->' + submitted[j+1].id`); if any submitted pair string equals the correct pair string, increment `adjacentPairsCorrect` and stop scanning that pair. This counts how many presented adjacent orderings appear as adjacent (in the same direction) anywhere in the submitted sequence (max 4).

### Scientific framing
This is a **custom picture-sequence memory task inspired by episodic/sequential-memory paradigms** (notably the NIH Toolbox Picture Sequence Memory Test). It uses a fixed 5-item single-trial format and is **not** equivalent to, nor validated against, that instrument (which uses variable-length sequences and multiple trials). Interpret descriptively.

---

## 7. Station 3: Attention & Calculation — Methodology and Metrics

### Task flow (from `CalculationStation`)
- **Starting number:** `randomInt(88, 99)` (`CONFIG.calculation.startMin/startMax`).
- **Subtraction value:** fixed **7** (`subtractionValue`).
- **Number of serial subtractions:** **5** (`totalQuestions`); `expectedAnswers` are computed by repeatedly subtracting 7 from the start.
- **Answer collection:** 5 numeric inputs; typing 2+ digits auto-advances focus; the participant can edit earlier answers before submitting.
- **Timing:** `timerStart = performance.now()` when the challenge renders; `totalTime = (now − timerStart)/1000` on submit.
- **Delayed feedback:** no correctness feedback is shown until submission; results appear only on the station results screen.

### Metrics

| Metric (exported) | Purpose | Calculation | Unit | Interpretation |
|-------------------|---------|-------------|------|----------------|
| `calcAbsoluteCorrect` | True-sequence accuracy (primary) | count `submitted[i] === expected[i]` | 0–5 | Higher = better |
| `calcAccuracy` | Percentage form | `round(absoluteCorrect/5 × 100)` | 0–100% | Higher = better |
| `calcSequentialConsistency` | Self-consistent subtraction | see formula below | 0–100% | Higher = more internally consistent |
| `calcTotalTime` | Completion time | `(now − timerStart)/1000` | s | Interpret with accuracy |
| `calcAvgResponseTime` | Mean per-answer time | `totalTime / 5` | s | Derived from total, not per-item |
| `calcFirstErrorPosition` | Where accuracy first breaks | first position (1–5) with a wrong answer; else blank | position / '' | Earlier = earlier breakdown |
| `calcStartNumber` | Task parameter | random 88–99 | integer | For audit |
| `calcSubtractionValue` | Task parameter | 7 | integer | For audit |
| `calcExpectedAnswers` | Ground truth | joined by ", " | array→string | For audit |
| `calcSubmittedAnswers` | Responses (may contain blanks) | joined by ", " | array→string | Blank = unanswered (`null`) |

### Absolute Correctness vs Sequential Consistency
- **Absolute Correctness (`calcAbsoluteCorrect`):** compares each submitted answer to the **mathematically correct** value (`submitted[i] === expected[i]`). An early mistake that propagates lowers this score even if subsequent subtractions are internally consistent.
- **Sequential Consistency (`calcSequentialConsistency`):** for each position, checks whether the answer equals **the previous value minus 7**, where the "previous value" is the start number for the first item and the participant's **own previous submitted answer** thereafter (`prev − 7 === submitted[i]`, with `prev = i===0 ? startNumber : submitted[i-1]`). This **credits propagated errors** — if the participant correctly subtracts 7 from their own (wrong) previous answer, it counts as consistent. Blank answers (`null`) on either side are not counted as consistent.

This distinction separates *arithmetic accuracy* from *procedural/attentional consistency*.

> **Implementation note:** `onInputFocus` pushes to a `responseTimes[]` array, but this array is **not** used to compute `averageResponseTime` (which is `totalTime/5`) and is **not** exported. Per-answer response times are therefore not available in the dataset.

### Scientific framing
Serial subtraction ("serial sevens") engages sustained attention, working memory, and mental arithmetic, but performance is heavily influenced by basic arithmetic skill. It should **not** be interpreted as a standalone diagnostic measure of attention.

---

## 8. Station 4: Visuospatial Puzzle — Methodology and Metrics

### Task flow (from `VisuospatialStation`)
- **Puzzle assets:** 4 images in `CONFIG.visuospatial.puzzles` (`puzzle1–4.png`).
- **Random selection:** `randomInt(0, 3)`; `puzzleId = puzzle{index+1}`.
- **3×3 tile generation:** `gridSize = 3` → 9 tiles, each `{ correctIndex, currentIndex }`; rendered via CSS `background-position` from a single source image.
- **Shuffle algorithm:** `fisherYatesShuffle` of tile positions, repeated until `isSolved()` is false (guarantees a scrambled start).
- **Interaction:** tap one tile then another to **swap** their positions (tap-based; pointer events).
- **Solved-state detection:** `isSolved()` = every tile `currentIndex === correctIndex`.
- **Timing:** `timerStart = performance.now()` at render; `completionTime = (now − timerStart)/1000` (1 dp) when solved. A 100 ms interval updates the on-screen timer.

### Metrics

| Metric (exported) | Purpose | Calculation | Unit | Interpretation |
|-------------------|---------|-------------|------|----------------|
| `puzzleId` | Which image (difficulty control) | `puzzle{index+1}` | categorical | Group/adjust by image |
| `puzzleCompletionTime` | Primary visuospatial metric | `(now − timerStart)/1000` | s | Lower = faster |
| `puzzleMoves` | Effort/efficiency | count of swaps | count | Fewer (for a solve) = more efficient |
| `puzzleUnproductiveMoves` | Error/efficiency | swaps where correct-count decreased (`correctAfter < correctBefore`) | count | Fewer = more efficient |
| `puzzleFirstMoveAccuracy` | Initial strategy | first swap increased correct-count (`correctAfter > correctBefore`) | Yes/No | Yes = productive first move |

Internal `getCorrectCount()` (tiles currently in the correct position) is used to derive unproductive moves and first-move accuracy but is **not** exported.

### Limitations
The four puzzle images differ in visual complexity, contrast, and familiarity, which can materially affect completion time and moves. **Do not treat the four images as psychometrically equivalent** unless validated; when analysing, control for `puzzleId` (e.g. group or adjust by image).

---

## 9. Final Cognitive Performance Profile

The profile screen (`Results.renderFinalProfile`) presents **four independent domain cards**:

- **Processing Speed** — `reactionBest` ms headline; average, median, variability (SD), false starts.
- **Memory & Recall** — `exactCorrect / 5` (accuracy %); adjacent pairs / 4; recall time; perfect-sequence flag.
- **Attention & Calculation** — `absoluteCorrect / 5` (accuracy %); completion time; avg per answer; sequential consistency %.
- **Visuospatial Processing** — `completionTime` s headline; moves; unproductive moves.

Where a previous saved record exists for the same nickname, each card shows a **same-domain** comparison (e.g. reaction best faster/slower, memory exact-correct improvement, calculation improvement, puzzle time faster/slower).

### No combined score and no normalisation
The four domains are measured on **different scales and units** (ms, counts out of 5, %, seconds). The code does **not** compute any overall/combined score and does **not** apply any 0–100 normalisation. There is **no** total, index, or composite. Do not sum or average across domains without a separately justified standardisation method (see §10.3/§11).

### No reference/normative comparison
`config.js` defines a `REFERENCE_DATA` architecture and `getReactionReference` / `getMemoryReference` / `getCalculationReference` / `getVisuospatialReference` functions, but these are **empty and return `null`**. The profile explicitly displays "Reference comparison not yet available." No age/sex norms are applied.

### Explicitly NOT produced
The application does not create or imply an IQ score, brain age, dementia score, cognitive-impairment diagnosis, or MMSE/MoCA-equivalent score. Language is deliberately descriptive (performance, domain, current vs previous result).

---

## 10. Statistical Analysis Opportunities

All suggestions use only the 36 exported fields (§4). Coerce numeric columns as needed; split the four array-string columns before analysis.

### 10.1 Descriptive Statistics

| Analysis | Field(s) |
|----------|----------|
| Number of participants / sessions | row count (`timestamp`) |
| Age distribution | `age` |
| Gender distribution | `gender` |
| Mean / median reaction time | `reactionMean`, `reactionMedian`, `reactionBest` |
| Reaction-time variability | `reactionSD`, `reactionRange` |
| False starts | `reactionFalseStarts` |
| Memory accuracy | `memoryExactCorrect`, `memoryAccuracy` |
| Adjacent-pair score | `memoryAdjacentPairs` |
| Recall time | `memoryRecallTime` |
| Calculation accuracy | `calcAbsoluteCorrect`, `calcAccuracy` |
| Sequential consistency | `calcSequentialConsistency` |
| Calculation completion time | `calcTotalTime`, `calcAvgResponseTime` |
| Puzzle completion time | `puzzleCompletionTime` |
| Puzzle moves / unproductive moves | `puzzleMoves`, `puzzleUnproductiveMoves` |

Report central tendency and spread for continuous fields; frequencies for `gender`, `puzzleId`, `memoryPerfectSequence`, `puzzleFirstMoveAccuracy`.

### 10.2 Distribution Analysis
Explore the shape of `reactionBest`/`reactionMean` (reaction-time distributions are typically right-skewed), `memoryExactCorrect`/`memoryAccuracy`, `calcAbsoluteCorrect`/`calcAccuracy`, and `puzzleCompletionTime`. Use **mean/SD** for approximately normal data and **median/IQR** for skewed data. Use **histograms** and **Q–Q plots** to assess normality (especially for reaction and puzzle times).

### 10.3 Group Comparisons
Available grouping variables: `gender`, age groups derived from `age`, `puzzleId`.

| Comparison | Outcome | Suggested test |
|------------|---------|----------------|
| Reaction time by age group | `reactionBest`/`reactionMean` | One-way ANOVA (if normal) or Kruskal–Wallis |
| Memory accuracy by age group | `memoryExactCorrect`/`memoryAccuracy` | ANOVA / Kruskal–Wallis |
| Calculation accuracy by age group | `calcAbsoluteCorrect` | ANOVA / Kruskal–Wallis |
| Puzzle time by age group | `puzzleCompletionTime` | ANOVA / Kruskal–Wallis |
| Performance by gender | any metric | Independent t-test or Mann–Whitney U |
| Puzzle time by `puzzleId` | `puzzleCompletionTime` | ANOVA / Kruskal–Wallis (checks image difficulty) |

Use t-test/ANOVA when normality and roughly equal variances hold; otherwise Mann–Whitney U / Kruskal–Wallis. Only analyse by a grouping variable that is actually collected (do not, e.g., analyse by education — it is not collected).

### 10.4 Correlation and Association Analysis

| Relationship | Fields | Method |
|--------------|--------|--------|
| Age vs reaction time | `age`, `reactionBest`/`reactionMean` | Pearson (if linear/normal) or Spearman |
| Age vs memory accuracy | `age`, `memoryAccuracy` | Spearman |
| Age vs calculation accuracy | `age`, `calcAccuracy` | Spearman |
| Age vs puzzle time | `age`, `puzzleCompletionTime` | Pearson/Spearman |
| Reaction vs memory | `reactionMean`, `memoryAccuracy` | Spearman |
| Reaction vs calculation time | `reactionMean`, `calcTotalTime` | Pearson/Spearman |
| Memory vs calculation accuracy | `memoryAccuracy`, `calcAccuracy` | Spearman |
| Puzzle time vs memory | `puzzleCompletionTime`, `memoryAccuracy` | Spearman |

Use Pearson when both variables are continuous, linear, and normal; Spearman otherwise. **Correlation does not imply causation.**

### 10.5 Speed–Accuracy Trade-Off Analysis
Important for this app. Examine:
- **Memory:** `memoryAccuracy` vs `memoryRecallTime`.
- **Calculation:** `calcAccuracy` vs `calcTotalTime` (and `calcAvgResponseTime`).
- **Puzzle:** move efficiency (`puzzleUnproductiveMoves`, `puzzleMoves`) vs `puzzleCompletionTime`.

Faster is not necessarily better: a fast, inaccurate response differs from a slow, accurate one. Plot accuracy against time and interpret jointly rather than ranking on speed alone.

### 10.6 Regression Analysis
With adequate sample size (≈ 10–15 observations per predictor), using only real fields:
- `reactionBest ~ age + gender`
- `memoryAccuracy ~ age + reactionMean`
- `calcAccuracy ~ age + reactionMean`
- `puzzleCompletionTime ~ age + memoryAccuracy`

Counts (e.g. `memoryExactCorrect`, `puzzleMoves`) may warrant Poisson/negative-binomial or ordinal models rather than plain linear regression. Avoid using mechanically dependent variables together (e.g. `calcTotalTime` and `calcAvgResponseTime`, which is `totalTime/5`).

### 10.7 Repeated Measures / Longitudinal Analysis
The only participant identifier is the free-text `nickname` (plus `timestamp`); the app itself links a participant's previous result by case-insensitive nickname match. **This identifier is weak** (collisions, typos, shared nicknames), so repeated-measures linkage is unreliable without a controlled ID scheme. Where linkage is trustworthy, suggested analyses:
- Change in `reactionBest`, `memoryExactCorrect`, `calcAbsoluteCorrect`, `puzzleCompletionTime` between sessions.
- Paired t-test / Wilcoxon signed-rank across two sessions.
- Repeated-measures ANOVA or linear mixed-effects models (random intercept per participant) for ≥ 3 sessions.

Explicitly report the identifier limitation when doing any longitudinal analysis.

### 10.8 Reliability / Within-Session Consistency
Reaction stores all three attempts (`reactionAttempt1/2/3`), enabling within-session:
- **Range** (`reactionRange`, already exported), **SD** (`reactionSD`, already exported), and **coefficient of variation** (`reactionSD / reactionMean`).
- **Trial-to-trial variability** from the three attempts.

These describe within-session consistency only. Do **not** claim formal test–retest reliability without repeated-session data under a controlled design.

### 10.9 Data Quality and Assumption Checking
Screen for: missing values (blank exported fields when a station is skipped), impossible ages, duplicate submissions (same `nickname` + near-identical `timestamp`), unfinished stations, false starts (`reactionFalseStarts`), extremely low reaction times (anticipation/guessing), implausibly long response/puzzle times, puzzle interruptions, blank arithmetic answers (empty entries in `calcSubmittedAnswers`), repeated participant records (nickname), outliers, normality (Shapiro–Wilk/Q–Q), heteroscedasticity, small samples, and multiple-testing inflation (Bonferroni/BH).

---

## 11. Recommended Data Visualisations

All use real exported field names (§4). Split array-string fields first; coerce numerics.

| Visualisation | Variables / Fields | Chart Type | Purpose / Interpretation |
|---------------|--------------------|------------|--------------------------|
| Participant age distribution | `age` | Histogram | Sample composition |
| Reaction-time distribution | `reactionBest` (or `reactionMean`) | Histogram | Spread/skew of processing speed |
| Three-attempt comparison | `reactionAttempt1`, `reactionAttempt2`, `reactionAttempt3` | Grouped bar / parallel lines | Within-session trial pattern |
| Best vs mean reaction | `reactionBest` (x), `reactionMean` (y) | Scatter | Consistency vs peak speed |
| Memory-accuracy distribution | `memoryExactCorrect` / `memoryAccuracy` | Histogram / bar | Distribution of recall accuracy |
| Recall-time histogram | `memoryRecallTime` | Histogram | Recall speed spread |
| Memory accuracy vs recall time | `memoryRecallTime` (x), `memoryAccuracy` (y) | Scatter | Speed–accuracy trade-off (§10.5) |
| Adjacent-pair distribution | `memoryAdjacentPairs` | Bar | Order-retention distribution |
| Calculation-accuracy distribution | `calcAbsoluteCorrect` / `calcAccuracy` | Histogram / bar | Accuracy spread |
| Calculation accuracy vs time | `calcTotalTime` (x), `calcAccuracy` (y) | Scatter | Speed–accuracy trade-off |
| Sequential-consistency distribution | `calcSequentialConsistency` | Histogram | Procedural consistency spread |
| Puzzle completion-time distribution | `puzzleCompletionTime` | Histogram | Visuospatial speed spread |
| Puzzle moves vs completion time | `puzzleMoves` (x), `puzzleCompletionTime` (y) | Scatter | Efficiency vs speed |
| Puzzle time by image | `puzzleId`, `puzzleCompletionTime` | Boxplot | Image-difficulty check |
| Performance by age group | age group (from `age`), any metric | Boxplot | Age relationships |
| Repeated assessment | `timestamp` (x), a metric (y), group by `nickname` | Line chart | Change over sessions (if IDs reliable) |
| Individual four-domain profile | `reactionBest`, `memoryAccuracy`, `calcAccuracy`, `puzzleCompletionTime` | Small-multiples (per-domain) | Individual snapshot |
| Correlation heatmap | numeric fields (reaction/memory/calc/puzzle) | Heatmap | Overview of associations |

For scatterplots: **x** = explanatory field, **y** = outcome; optional grouping by `gender`, age group, or `puzzleId` (colour). Grouped boxplots put the categorical field on x and the continuous outcome on y.

> **Radar/spider chart caution:** do **not** build a radar chart from raw domain values (ms, /5, %, s) — the axes are on different scales/units. Only use a radar chart after an appropriate, separately justified normalisation (e.g. within-sample z-scores or percentiles per domain), and label it as descriptive, not normative.

---

## 12. Direct Integration with R

Live Sheet ID:
```
153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA
```

### Method A: Google Sheets CSV / GViz (public sheet)

```r
library(readr)

cognitive_data <- read_csv(
  "https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA/gviz/tq?tqx=out:csv"
)

head(cognitive_data)
str(cognitive_data)
summary(cognitive_data)
```

Works when the sheet is shared as "Anyone with the link can view".

### Method B: googlesheets4

```r
library(googlesheets4)

gs4_deauth()   # public sheet — no login needed

cognitive_data <- read_sheet(
  "https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA"
)
```

**Authentication:** If the sheet is private, remove `gs4_deauth()` and use `gs4_auth()` (OAuth) or a service-account token (`gs4_auth(path = "service-account.json")`), sharing the sheet with that account.

> Column names match the 36 exported fields (§4), e.g. `timestamp`, `nickname`, `age`, `gender`, `reactionBest`, `memoryExactCorrect`, `calcAbsoluteCorrect`, `puzzleCompletionTime`. The four order/answer columns (`memoryPresentedOrder`, `memorySubmittedOrder`, `calcExpectedAnswers`, `calcSubmittedAnswers`) are comma-separated strings — split with e.g. `strsplit(x, ",\\s*")`.

---

## 13. R Shiny Integration

GitHub does **not** need to act as an intermediate data repository. Recommended pipeline:

```
Cognitive Challenge → Google Sheets → R Shiny → Data Cleaning → Statistical Analysis → Interactive Visualisation
```

### Live-refresh data source

```r
cognitive_data <- reactive({
  invalidateLater(60000, session)   # refresh every 60 s
  readr::read_csv(
    "https://docs.google.com/spreadsheets/d/153FqhzifEQqk-jJsS67DKIy7HeK9fHBn8AYU5GcS0DA/gviz/tq?tqx=out:csv",
    show_col_types = FALSE
  )
})
```

### Example ggplot2 outputs (real field names)

```r
library(ggplot2)

# Age vs reaction time
output$reactionPlot <- renderPlot({
  df <- cognitive_data()
  ggplot(df, aes(x = age, y = reactionBest)) +
    geom_point() +
    geom_smooth(method = "lm") +
    labs(x = "Age (years)", y = "Best reaction time (ms)")
})

# Memory speed-accuracy trade-off
output$memoryPlot <- renderPlot({
  df <- cognitive_data()
  ggplot(df, aes(x = memoryRecallTime, y = memoryAccuracy, colour = gender)) +
    geom_point()
})

# Puzzle completion time by puzzle image
output$puzzlePlot <- renderPlot({
  df <- cognitive_data()
  ggplot(df, aes(x = puzzleId, y = puzzleCompletionTime)) + geom_boxplot()
})
```

Use **GitHub** for source control, app code, R Shiny code, and documentation; use **Google Sheets** as the live data source read directly by Shiny at runtime.

---

## 14. Suggested R Shiny Dashboard Architecture

> Conceptual design for **future analytics development**, built on the 36 exported fields. Not part of the current Cognitive Challenge app.

**TAB 1 — Overview**
- Total participants/sessions (`timestamp`)
- Mean / median reaction time (`reactionMean`, `reactionMedian`)
- Mean memory accuracy (`memoryAccuracy`)
- Mean calculation accuracy (`calcAccuracy`)
- Mean puzzle completion time (`puzzleCompletionTime`)

**TAB 2 — Processing Speed**
- Reaction-time distribution (`reactionBest`)
- Attempt-by-attempt analysis (`reactionAttempt1/2/3`)
- False starts (`reactionFalseStarts`)
- Age relationships (`age`)

**TAB 3 — Memory & Recall**
- Exact-position score (`memoryExactCorrect`)
- Adjacent-pair score (`memoryAdjacentPairs`)
- Recall time (`memoryRecallTime`)
- Speed–accuracy relationship

**TAB 4 — Attention & Calculation**
- Accuracy (`calcAbsoluteCorrect`/`calcAccuracy`)
- Sequential consistency (`calcSequentialConsistency`)
- Completion time (`calcTotalTime`)
- First-error position (`calcFirstErrorPosition`)

**TAB 5 — Visuospatial Processing**
- Completion time (`puzzleCompletionTime`)
- Moves (`puzzleMoves`) / unproductive moves (`puzzleUnproductiveMoves`)
- Puzzle-difficulty comparison (`puzzleId`)

**TAB 6 — Cognitive Profile**
- Individual participant profile
- Repeated-test comparison (nickname; note identifier limitation §10.7)
- Normalised domain visualisation only where methodologically justified (§11)

**TAB 7 — Statistical Analysis**
- Descriptive statistics, correlations, group comparisons, speed–accuracy analysis

**TAB 8 — Live Data Explorer**
- Interactive, filterable table of the live Google Sheet (all 36 fields)

---

## 15. Key Scientific References Supporting Cognitive Challenge

Peer-reviewed journal articles, APA 7th edition, each verified against its source. These references support the **underlying constructs and paradigms**; they do **not** validate this custom application.

### Simple Visual Reaction Time / Processing Speed
- Woods, D. L., Wyma, J. M., Yund, E. W., Herron, T. J., & Reed, B. (2015). Factors influencing the latency of simple reaction time. *Frontiers in Human Neuroscience, 9*, 131. https://doi.org/10.3389/fnhum.2015.00131
  *Relevance:* Characterises simple reaction time, its age dependence, and — critically — the hardware/software timing corrections that motivate this app's browser-timing caveats (§5, §17).

### Episodic and Picture-Sequence Memory
- Dikmen, S. S., Bauer, P. J., Weintraub, S., Mungas, D., Slotkin, J., Beaumont, J. L., Gershon, R., Temkin, N. R., & Heaton, R. K. (2014). Measuring episodic memory across the lifespan: NIH Toolbox Picture Sequence Memory Test. *Journal of the International Neuropsychological Society, 20*(6), 611–619. https://doi.org/10.1017/S1355617714000472
  *Relevance:* The picture-sequence memory paradigm that inspired Station 2's design (order reconstruction of images).
- Bauer, P. J., Dikmen, S. S., Heaton, R. K., Mungas, D., Slotkin, J., & Beaumont, J. L. (2013). III. NIH Toolbox Cognition Battery (CB): Measuring episodic memory. *Monographs of the Society for Research in Child Development, 78*(4), 34–48. https://doi.org/10.1111/mono.12033
  *Relevance:* Details the episodic-memory measurement approach and scoring logic underpinning picture-sequence recall.

### Attention and Serial Subtraction
- Karzmark, P. (2000). Validity of the serial seven procedure. *International Journal of Geriatric Psychiatry, 15*(8), 677–679. https://doi.org/10.1002/1099-1166(200008)15:8<677::AID-GPS177>3.0.CO;2-4
  *Relevance:* Directly supports Station 3's construct and the app's caution that serial-sevens performance is influenced by arithmetic skill and should not be read as a pure attention measure (§7, §17).

### Visuospatial Processing / Jigsaw-Based Tasks
- Fissler, P., Küster, O. C., Schlee, W., & Kolassa, I.-T. (2018). Jigsaw puzzling taps multiple cognitive abilities and is a potential protective factor for cognitive aging. *Frontiers in Aging Neuroscience, 10*, 299. https://doi.org/10.3389/fnagi.2018.00299
  *Relevance:* Establishes that jigsaw puzzling engages multiple visuospatial abilities, supporting Station 4's use of jigsaw reconstruction.

### Digital Cognitive Assessment and Measurement Considerations
- Needham, L., Evans, M., Cosker, D. P., Wade, L., McGuigan, P. M., Bilzon, J. L., & Colyer, S. L. (2021). The accuracy of several pose estimation methods for 3D joint centre localisation. *Scientific Reports, 11*, 20673. https://doi.org/10.1038/s41598-021-00212-x
  *Relevance:* Although about pose estimation, it exemplifies the broader principle that device/method-dependent measurement error must be quantified before interpreting digitally captured performance — relevant to browser-timing caveats. *(General measurement-limitation support; not specific to reaction-time software.)*

> Additional canonical sources on device/browser reaction-time timing should be consulted before formal reporting (see §16). Only include a reference where it genuinely supports the specific claim.

---

## 16. Scientific Topics and Sources to Verify

Before formal/programme use, verify current peer-reviewed literature on:

### Reaction Time
- Simple visual reaction-time norms and age-related change.
- Browser/JavaScript timing precision and latency (e.g. studies on web-based RT measurement error vs dedicated hardware) — verify a specific methodological source before citing.

### Memory
- NIH Toolbox Picture Sequence Memory Test (Bauer; Dikmen; Weintraub) — verified above; confirm any additional editions/validation papers.
- Episodic memory and sequential picture recall; smartphone/digital picture-sequence memory tests — verify specific validation studies before citing.

### Attention & Calculation
- Serial Sevens / serial subtraction, MMSE Attention & Calculation construct, and validity/limitations (Karzmark — verified above). Confirm any additional normative sources before applying thresholds.

### Visuospatial Processing
- Jigsaw-puzzle performance and visuospatial cognition (Fissler et al. — verified above); visuoconstruction, mental rotation, and cognitive ageing — verify specific papers before citing.

Do not transfer published norms from any of these instruments to this custom implementation without a verified, protocol-matched source.

---

## 17. Scientific Interpretation and Limitations

- The four tasks represent **selected cognitive constructs**, not the entirety of cognition.
- The app is **not equivalent** to the MMSE, MoCA, NIH Toolbox, or any validated battery.
- **Published norms cannot be transferred** to this custom implementation; the app applies none (reference functions return `null`).
- **Reaction time** reflects device/browser latency in addition to neural/psychomotor time (§5); avoid cross-device comparison.
- **Picture-sequence memory** performance depends on the fixed 5-item single-trial protocol used here, which differs from validated multi-trial variable-length tests.
- **Serial subtraction** is influenced by arithmetic ability independent of attention; absolute vs sequential-consistency scoring separates these partially (§7).
- **Jigsaw performance** is affected by image complexity and familiarity; the four images are not established as equivalent (§8).
- **Repeated use** may produce learning/practice effects.
- Scoring should be interpreted **descriptively** unless validation data exist.

### Age-reference architecture note
`config.js` contains a `REFERENCE_DATA` structure and reference functions, but they hold **no validated values** and return `null`. No age/sex normative comparison is performed; any future norms must come from verified sources and matched protocols.

---

## 18. Data Quality Considerations

Based on the implementation and export payload:

- **Incomplete assessments:** a result is only saved from the final profile after all four stations; a station that produced no data exports as blank fields. Filter/flag rows with blank station blocks.
- **False-start trials:** captured as `reactionFalseStarts`; high counts may indicate anticipation/misunderstanding.
- **Missing answers:** `calcSubmittedAnswers` can contain blank entries (unanswered `null`); check for empty positions.
- **Duplicate submissions:** `no-cors` prevents delivery confirmation, so re-taps of SAVE can create duplicate rows — de-duplicate on `nickname` + near-identical `timestamp`.
- **Extremely low reaction times:** implausibly small `reactionBest` (e.g. < ~120 ms) suggests anticipation/guessing rather than genuine response.
- **Unusually long times:** very large `reactionSlowest`, `calcTotalTime`, `memoryRecallTime`, or `puzzleCompletionTime` may indicate distraction/interruption.
- **Puzzle abandonment:** a result is written only when the puzzle is solved; abandoned puzzles never reach the profile/sheet (so they are absent rather than partial).
- **Zero scores:** `memoryExactCorrect = 0` / `calcAbsoluteCorrect = 0` may be genuine or reflect misunderstanding.
- **Repeated sessions / inconsistent identifiers:** only free-text `nickname` links records; typos/collisions undermine linkage (§10.7).
- **Timestamp integrity:** ISO 8601 UTC; convert consistently to local time.
- **Array/JSON parsing:** split the four comma-separated order/answer fields before analysis.
- **Categorical consistency:** `gender` includes "Others"/"Prefer not to say"; the Yes/No fields are strings.

Recommended cleaning before analysis: coerce types; split array-string fields; de-duplicate on nickname+timestamp; range-check `age` and reaction times; flag zero/blank stations; decide nickname-linkage rules; and handle outliers explicitly.

---

## 19. Privacy and Ethical Considerations

Derived strictly from the source code:

- **Participant fields collected:** `nickname`, `age`, `gender` only.
- **Camera/microphone:** **not used** at all.
- **Images collected:** **none** of the participant; the app only displays fixed memory/puzzle image assets.
- **Cognitive responses stored:** task results and derived metrics (the 36 fields) are stored — no free-text beyond nickname.
- **Local storage:** results are saved to `localStorage` (`cognitiveChallenge_history`) on the device; a "DELETE HISTORY" action clears it.
- **Google Sheets:** if a webhook is configured, the 36-field flattened result is sent to the shared sheet; anyone with sheet access can view submitted rows.
- **Identifier recommendation:** use a nickname or coded identifier rather than a full legal name, since a nickname is sufficient for the app's own history matching.
- **Consent (school/community/research):** obtain informed consent covering what is measured, that results are stored locally and (if enabled) sent to a shared Google Sheet, and how data will be used/retained; control the sheet's sharing settings.

These statements match the code (no camera/mic, no images of the user, local + optional sheet storage, descriptive/non-diagnostic language).

---

## 20. Google Sheets Integration

Results are sent to Google Sheets on **SAVE RESULT** when the webhook is configured.

### Architecture
```
Cognitive Challenge (browser) → fetch POST (no-cors, JSON) → Google Apps Script Web App (doPost) → Google Sheet row
```
`Results.sendToGoogleSheets()` builds the 36-field `flat` object and sends `JSON.stringify(flat)`. Because Apps Script requires `mode: 'no-cors'` from a browser, the client cannot read the response.

### Endpoint configuration (`config.js`)
```javascript
googleSheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbwzR2nWXPy9nfwYk0tFnSUJqe6a6DuUF5Zt7_ZjdzIQ7oPU9STMXIHxAAkSFAV2XHC0SQ/exec',
```
Empty string disables export (local-only). This is pre-configured in the current deployment.

### Payload structure and field mapping (fixed-order appendRow)
The Apps Script appends a row by reading each key explicitly and placing it in a **fixed column order** — it does **not** match by header text. The header row is for human readability and must be in the **same order** as the script's `appendRow([...])` array (36 values).

> ⚠️ **Column-order warning:** the sheet's columns must remain in the expected order. Reordering or inserting columns without editing the Apps Script will misalign every value from that point on, because the script writes positionally, not by header name.

### Expected headers (Row 1, in order — 36 columns, A→AJ)
```
A timestamp | B nickname | C age | D gender |
E reactionBest | F reactionMean | G reactionMedian | H reactionSD | I reactionRange | J reactionSlowest | K reactionFalseStarts | L reactionAttempt1 | M reactionAttempt2 | N reactionAttempt3 |
O memoryExactCorrect | P memoryAccuracy | Q memoryAdjacentPairs | R memoryRecallTime | S memoryPerfectSequence | T memoryPresentedOrder | U memorySubmittedOrder |
V calcStartNumber | W calcSubtractionValue | X calcAbsoluteCorrect | Y calcAccuracy | Z calcSequentialConsistency | AA calcTotalTime | AB calcAvgResponseTime | AC calcFirstErrorPosition | AD calcExpectedAnswers | AE calcSubmittedAnswers |
AF puzzleId | AG puzzleCompletionTime | AH puzzleMoves | AI puzzleUnproductiveMoves | AJ puzzleFirstMoveAccuracy
```

### Apps Script (Code.gs)
```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.nickname || '', data.age || '', data.gender || '',
      data.reactionBest || '', data.reactionMean || '', data.reactionMedian || '',
      data.reactionSD || '', data.reactionRange || '', data.reactionSlowest || '',
      data.reactionFalseStarts || '', data.reactionAttempt1 || '', data.reactionAttempt2 || '', data.reactionAttempt3 || '',
      data.memoryExactCorrect || '', data.memoryAccuracy || '', data.memoryAdjacentPairs || '',
      data.memoryRecallTime || '', data.memoryPerfectSequence || '', data.memoryPresentedOrder || '', data.memorySubmittedOrder || '',
      data.calcStartNumber || '', data.calcSubtractionValue || '', data.calcAbsoluteCorrect || '', data.calcAccuracy || '',
      data.calcSequentialConsistency || '', data.calcTotalTime || '', data.calcAvgResponseTime || '',
      data.calcFirstErrorPosition || '', data.calcExpectedAnswers || '', data.calcSubmittedAnswers || '',
      data.puzzleId || '', data.puzzleCompletionTime || '', data.puzzleMoves || '',
      data.puzzleUnproductiveMoves || '', data.puzzleFirstMoveAccuracy || ''
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function doGet(e) {
  return ContentService.createTextOutput('Cognitive Challenge webhook is active.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

> Note: the Apps Script uses `data.field || ''`, so a genuine `0` (e.g. `reactionFalseStarts = 0`, `memoryExactCorrect = 0`, `puzzleUnproductiveMoves = 0`, `calcAccuracy = 0`) is written as an **empty cell** rather than `0`. Treat blank numeric cells accordingly during cleaning (they may represent zero or a skipped station — disambiguate using other fields in the row).

### Save-results workflow
1. Complete all four stations → view profile. 2. Tap **SAVE RESULT** → `saveResult()` appends to `localStorage` and calls `sendToGoogleSheets()`. 3. A new row should appear in the sheet within seconds (verify manually; the client cannot confirm due to `no-cors`).

### Deployment
Extensions → Apps Script → paste code → Deploy → New deployment → Web app → Execute as **Me**, Access **Anyone** → authorise → copy the `/exec` URL into `config.js`. Editing the script requires a **New deployment** (or new version) to take effect.

### Testing & troubleshooting
- **No new rows:** confirm the webhook URL is set and deployment access is **Anyone**; the client cannot detect failures (no-cors).
- **Blank cells for zeros:** expected due to `|| ''` (see note above).
- **Misaligned columns:** ensure Row-1 header order matches the script's `appendRow` order.

---

## 21. Technical Documentation

### Project structure
```
CognitiveChallenge/
├── index.html          Progress bar + screen container; loads config → stations → results → app
├── styles.css          Styling and responsive layout
├── config.js           App metadata, webhook URL, station configs, empty REFERENCE_DATA + reference fns
├── stations.js         Four stations (logic, UI, scoring) + shuffle/stats utilities + celebration
├── results.js          Final profile, history, Google Sheets export, HTML download
├── app.js              Controller: navigation, locked progression, session state
├── README.md           This manual
└── assets/
    ├── memory/          apple.png, duck.png, hat.png, pen.png, pineapple.png
    ├── puzzles/         puzzle1.png … puzzle4.png (square)
    └── icons/           reserved
```
Load order (from `index.html`): `config.js` → `stations.js` → `results.js` → `app.js` (all plain scripts exposing globals `CONFIG`, station objects, `Results`, `App`).

### Assets
- **Memory:** 5 square PNGs; filenames must match `CONFIG.memory.items`.
- **Puzzles:** 4 square images; divided into a 3×3 grid via CSS `background-position` (0/50/100%). Replace files in place (keep square aspect ratio); no code change needed.

### Running locally
Open `index.html` directly, or serve statically (`npx serve .`). No build step, frameworks, or API keys.

### GitHub Pages deployment
Push `CognitiveChallenge/` to the repo; Settings → Pages → Deploy from branch → `main` → `/root` (or the folder containing `index.html`). All paths are relative. Live app: https://aaron-chen-angus.github.io/CognitiveChallenge/

### Configuration (`config.js`)
- `reaction`: `minDelay` 2000, `maxDelay` 5000, `requiredAttempts` 3, `falseStartDelay` 1500 (ms).
- `memory`: 5 items, `displayDuration` 2000, `postEncodingDelay` 500 (ms).
- `calculation`: `startMin` 88, `startMax` 99, `subtractionValue` 7, `totalQuestions` 5.
- `visuospatial`: 4 puzzles, `gridSize` 3.
- `storageKey`: `cognitiveChallenge_history`; `googleSheetsWebhookUrl` (empty = local only).
- `REFERENCE_DATA` + reference functions: empty / return `null`.

### localStorage
`cognitiveChallenge_history` — array of nested session records (`participant`, `reaction`, `memory`, `calculation`, `visuospatial`, `completedAt`). Used for own-history comparison and the History screen; cleared via "DELETE HISTORY".

### Browser compatibility
Modern browsers supporting pointer events, `performance.now()`, and ES5+ JS (Chrome, Edge, Safari, Firefox; desktop or mobile). No camera/mic/WebGL required.

### Troubleshooting & limitations
See §17 (interpretation limits), §18 (data quality), and §20 (Sheets). Key limits: browser timing precision, unvalidated scoring, no norms, image-difficulty variation, weak nickname identifier.

---

## 22. Final Validation (performed before saving this README)

1. **Google Sheets submission payload inspected** — `results.js` `sendToGoogleSheets()` builds the `flat` object and sends `JSON.stringify(flat)`.
2. **Every exported field listed** — 36 fields catalogued in §4.
3. **Each exported field compared** to the Data Dictionary — 1:1 match with the payload and the Apps Script `appendRow` order.
4. **No exported field missing** — confirmed (36/36).
5. **Fields calculated but not exported identified** — visuospatial correct-placement count, calculation `responseTimes[]`, reaction timing internals, and render-time comparison values (§4).
6. **Array/JSON fields identified** — `memoryPresentedOrder`, `memorySubmittedOrder`, `calcExpectedAnswers`, `calcSubmittedAnswers` (comma-separated).
7. **Formulas verified against source** — reaction best/mean/median/SD/range; memory exact-position and adjacent-pair algorithm; calculation absolute vs sequential-consistency logic; puzzle unproductive-move and first-move-accuracy logic; all match `stations.js`.
8. **Units verified** — ms, seconds, counts, %, categorical, DateTime, integer age.
9. **Statistics use real fields** (§10).
10. **Visualisations use real fields** (§11).
11. **References verified** — each APA reference checked against its source (Woods 2015; Dikmen 2014; Bauer 2013; Karzmark 2000; Fissler 2018; Needham 2021).
12. **APA 7th edition** formatting with DOIs.
13–16. **No application source code, station logic, scoring, or Google Sheets submission logic was modified.**
17–18. **Only `CognitiveChallenge/README.md` was changed;** prior useful documentation (data dictionary, Apps Script, references, deployment) was preserved and expanded.

---

## Disclaimer

These tasks are science-informed adaptations of established cognitive assessment paradigms. The application itself is not a validated clinical cognitive assessment. It is designed for cognitive engagement and performance monitoring only, and must not be used for diagnosis.

## License

MIT
