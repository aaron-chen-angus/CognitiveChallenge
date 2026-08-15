/* ============================================================
   Cognitive Performance Challenge - Station Logic
   ============================================================ */

// ---- Utility Functions ----
function fisherYatesShuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcStdDev(values) {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    return Math.sqrt(variance);
}

// ============================================================
// STATION 1: REACTION TIME
// ============================================================
const ReactionStation = {
    attempts: [],
    falseStarts: 0,
    currentState: 'waiting', // waiting, red, green, responded
    greenTimestamp: 0,
    delayTimeout: null,

    renderInstructions() {
        return `
            <div class="screen screen-center">
                <div>
                    <div class="station-complete-badge">⚡ Station 1</div>
                    <h1 class="screen-title">Reaction Time</h1>
                </div>
                <div class="instructions-box">
                    <ol>
                        <li>The screen will begin <strong>RED</strong>.</li>
                        <li>Wait until it turns <strong>GREEN</strong>.</li>
                        <li>Tap the screen as quickly as possible when it turns GREEN.</li>
                        <li>Do not tap before the colour changes.</li>
                        <li>You will complete <strong>THREE</strong> valid attempts.</li>
                        <li>Your fastest valid reaction time will be your main score.</li>
                    </ol>
                </div>
                <button class="btn btn-primary btn-station btn-full" onclick="ReactionStation.start()">
                    BEGIN STATION
                </button>
            </div>
        `;
    },

    start() {
        this.attempts = [];
        this.falseStarts = 0;
        this.startTrial();
    },

    startTrial() {
        this.currentState = 'red';
        const delay = randomInt(CONFIG.reaction.minDelay, CONFIG.reaction.maxDelay);

        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="reaction-screen reaction-red" id="reaction-area">
                <div class="reaction-text">
                    <p>Wait for GREEN...</p>
                    <p style="font-size:14px; margin-top:12px; opacity:0.8;">Attempt ${this.attempts.length + 1} of ${CONFIG.reaction.requiredAttempts}</p>
                </div>
            </div>
        `;

        const area = document.getElementById('reaction-area');
        area.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handleTap();
        });

        this.delayTimeout = setTimeout(() => {
            this.showGreen();
        }, delay);
    },

    showGreen() {
        this.currentState = 'green';
        this.greenTimestamp = performance.now();
        const area = document.getElementById('reaction-area');
        if (area) {
            area.classList.remove('reaction-red');
            area.classList.add('reaction-green');
            area.innerHTML = `
                <div class="reaction-text">
                    <p>TAP NOW!</p>
                </div>
            `;
        }
    },

    handleTap() {
        if (this.currentState === 'red') {
            // False start
            this.falseStarts++;
            clearTimeout(this.delayTimeout);
            this.showFalseStart();
        } else if (this.currentState === 'green') {
            const responseTime = performance.now() - this.greenTimestamp;
            this.currentState = 'responded';
            this.attempts.push(Math.round(responseTime));
            this.showAttemptResult(Math.round(responseTime));
        }
    },

    showFalseStart() {
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="false-start-overlay">
                <h2>TOO EARLY!</h2>
                <p>Wait until the screen turns green.<br>This attempt will restart.</p>
            </div>
        `;
        setTimeout(() => {
            this.startTrial();
        }, CONFIG.reaction.falseStartDelay);
    },

    showAttemptResult(time) {
        const container = document.getElementById('screen-container');
        if (this.attempts.length < CONFIG.reaction.requiredAttempts) {
            container.innerHTML = `
                <div class="reaction-screen reaction-green" id="reaction-area">
                    <div class="reaction-text">
                        <div class="reaction-time">${time} ms</div>
                        <p style="margin-top:12px;">Tap to continue...</p>
                    </div>
                </div>
            `;
            const area = document.getElementById('reaction-area');
            area.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.startTrial();
            });
        } else {
            this.showResults();
        }
    },

    showResults() {
        const best = Math.min(...this.attempts);
        const mean = Math.round(this.attempts.reduce((a, b) => a + b, 0) / this.attempts.length);
        const sorted = [...this.attempts].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const slowest = Math.max(...this.attempts);
        const stdDev = calcStdDev(this.attempts).toFixed(1);
        const range = slowest - best;

        // Store results
        App.sessionData.reaction = {
            attempts: [...this.attempts],
            best,
            mean,
            median,
            standardDeviation: parseFloat(stdDev),
            range,
            slowest,
            falseStarts: this.falseStarts
        };

        App.completeStation('reaction');

        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen">
                <div class="result-hero">
                    <div class="station-complete-badge">✓ Station 1 Complete</div>
                    <h2 style="color: var(--reaction-color);">BEST REACTION TIME</h2>
                    <div class="big-value" style="color: var(--reaction-color);">${best} <span class="big-unit">ms</span></div>
                </div>
                <ul class="attempts-list">
                    ${this.attempts.map((t, i) => `
                        <li>
                            <span>Attempt ${i + 1}</span>
                            <span class="time">${t} ms</span>
                        </li>
                    `).join('')}
                </ul>
                <div class="result-metrics">
                    <div class="metric-card">
                        <div class="metric-value">${mean} ms</div>
                        <div class="metric-label">Average</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${median} ms</div>
                        <div class="metric-label">Median</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${stdDev} ms</div>
                        <div class="metric-label">Variability (SD)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.falseStarts}</div>
                        <div class="metric-label">False Starts</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-memory btn-full mt-24" onclick="App.showStation('memory')">
                    PROCEED TO MEMORY & RECALL
                </button>
            </div>
        `;
        triggerCelebration();
    }
};

// ============================================================
// STATION 2: MEMORY & RECALL
// ============================================================
const MemoryStation = {
    presentedOrder: [],
    submittedOrder: [],
    recallPool: [],
    recallStartTime: 0,
    selectedItem: null,
    placedItems: [],

    renderInstructions() {
        return `
            <div class="screen screen-center">
                <div>
                    <div class="station-complete-badge">🧠 Station 2</div>
                    <h1 class="screen-title">Memory & Recall</h1>
                </div>
                <div class="instructions-box">
                    <ol>
                        <li>You will see <strong>FIVE</strong> pictures.</li>
                        <li>Each picture will appear one at a time.</li>
                        <li>Remember the <strong>order</strong> carefully.</li>
                        <li>After all five have been shown, arrange the items back into the original sequence.</li>
                    </ol>
                </div>
                <button class="btn btn-primary btn-memory btn-full" onclick="MemoryStation.start()">
                    BEGIN MEMORY CHALLENGE
                </button>
            </div>
        `;
    },

    start() {
        this.presentedOrder = fisherYatesShuffle(CONFIG.memory.items);
        this.submittedOrder = [];
        this.placedItems = [];
        this.selectedItem = null;
        this.showEncodingPhase(0);
    },

    showEncodingPhase(index) {
        if (index >= this.presentedOrder.length) {
            setTimeout(() => this.showRecallPhase(), CONFIG.memory.postEncodingDelay);
            return;
        }

        const item = this.presentedOrder[index];
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen memory-display">
                <div class="memory-progress">Item ${index + 1} of ${this.presentedOrder.length}</div>
                <div class="memory-image-container">
                    <img src="${item.image}" alt="Memory item">
                </div>
                <div class="memory-progress" style="font-size:14px; color: var(--text-light);">Remember this item</div>
            </div>
        `;

        setTimeout(() => {
            this.showEncodingPhase(index + 1);
        }, CONFIG.memory.displayDuration);
    },

    showRecallPhase() {
        this.recallStartTime = performance.now();
        this.recallPool = fisherYatesShuffle(this.presentedOrder);
        this.placedItems = new Array(5).fill(null);
        this.selectedItem = null;

        this.renderRecall();
    },

    renderRecall() {
        const pool = this.recallPool;
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen">
                <h2 class="text-center mb-16" style="font-size:18px;">Arrange items in the order shown</h2>
                <div class="recall-slots" id="recall-slots">
                    ${this.placedItems.map((item, i) => `
                        <div class="recall-slot ${item ? 'filled' : ''}" data-slot="${i}" onclick="MemoryStation.handleSlotTap(${i})">
                            <span class="slot-number">${i + 1}</span>
                            ${item ? `<img src="${item.image}" alt="${item.label}">` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="memory-items-pool" id="memory-pool">
                    ${pool.map(item => {
                        const placed = this.placedItems.includes(item);
                        const selected = this.selectedItem === item;
                        return `
                            <div class="memory-item-card ${placed ? 'placed' : ''} ${selected ? 'selected' : ''}" 
                                 data-id="${item.id}" 
                                 onclick="MemoryStation.handleItemTap('${item.id}')">
                                <img src="${item.image}" alt="${item.label}">
                                <span class="item-label">${item.label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button class="btn btn-primary btn-memory btn-full mt-16" 
                        onclick="MemoryStation.submit()"
                        ${this.placedItems.filter(x => x).length < 5 ? 'disabled style="opacity:0.5"' : ''}>
                    SUBMIT ANSWER
                </button>
            </div>
        `;
    },

    handleItemTap(itemId) {
        const item = CONFIG.memory.items.find(i => i.id === itemId);
        if (this.placedItems.includes(item)) return;

        if (this.selectedItem === item) {
            this.selectedItem = null;
        } else {
            this.selectedItem = item;
            // Auto-place in first empty slot
            const emptySlot = this.placedItems.indexOf(null);
            if (emptySlot !== -1) {
                this.placedItems[emptySlot] = item;
                this.selectedItem = null;
            }
        }
        this.renderRecall();
    },

    handleSlotTap(slotIndex) {
        if (this.placedItems[slotIndex]) {
            // Remove item from slot
            this.placedItems[slotIndex] = null;
            this.renderRecall();
        } else if (this.selectedItem) {
            this.placedItems[slotIndex] = this.selectedItem;
            this.selectedItem = null;
            this.renderRecall();
        }
    },

    submit() {
        if (this.placedItems.filter(x => x).length < 5) return;

        const recallTime = ((performance.now() - this.recallStartTime) / 1000).toFixed(1);
        this.submittedOrder = [...this.placedItems];

        // Scoring
        let exactCorrect = 0;
        for (let i = 0; i < 5; i++) {
            if (this.submittedOrder[i].id === this.presentedOrder[i].id) {
                exactCorrect++;
            }
        }

        // Adjacent pairs
        let adjacentPairsCorrect = 0;
        for (let i = 0; i < 4; i++) {
            const correctPair = this.presentedOrder[i].id + '->' + this.presentedOrder[i + 1].id;
            for (let j = 0; j < 4; j++) {
                const submittedPair = this.submittedOrder[j].id + '->' + this.submittedOrder[j + 1].id;
                if (correctPair === submittedPair) {
                    adjacentPairsCorrect++;
                    break;
                }
            }
        }

        const accuracyPercent = Math.round((exactCorrect / 5) * 100);
        const perfectSequence = exactCorrect === 5;

        // Store results
        App.sessionData.memory = {
            presentedOrder: this.presentedOrder.map(i => i.id),
            submittedOrder: this.submittedOrder.map(i => i.id),
            exactCorrect,
            accuracyPercent,
            adjacentPairsCorrect,
            recallTime: parseFloat(recallTime),
            perfectSequence
        };

        App.completeStation('memory');
        this.showResults();
    },

    showResults() {
        const data = App.sessionData.memory;
        const container = document.getElementById('screen-container');

        // Build image sequences for display
        const correctImgSequence = data.presentedOrder.map(id => {
            const item = CONFIG.memory.items.find(i => i.id === id);
            return `<div class="sequence-img-item">
                <img src="${item.image}" alt="${item.label}">
                <span>${item.label}</span>
            </div>`;
        }).join('<span class="sequence-img-arrow">→</span>');

        const submittedImgSequence = data.submittedOrder.map((id, idx) => {
            const item = CONFIG.memory.items.find(i => i.id === id);
            const isCorrect = id === data.presentedOrder[idx];
            return `<div class="sequence-img-item ${isCorrect ? 'correct' : 'incorrect'}">
                <img src="${item.image}" alt="${item.label}">
                <span>${item.label}</span>
            </div>`;
        }).join('<span class="sequence-img-arrow">→</span>');

        container.innerHTML = `
            <div class="screen">
                <div class="result-hero">
                    <div class="station-complete-badge">✓ Station 2 Complete</div>
                    <h2 style="color: var(--memory-color);">MEMORY ACCURACY</h2>
                    <div class="big-value" style="color: var(--memory-color);">${data.exactCorrect} / 5</div>
                    <div class="big-unit">${data.accuracyPercent}%</div>
                </div>
                <div class="result-metrics">
                    <div class="metric-card">
                        <div class="metric-value">${data.adjacentPairsCorrect} / 4</div>
                        <div class="metric-label">Adjacent Pairs</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.recallTime}s</div>
                        <div class="metric-label">Recall Time</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.perfectSequence ? 'Yes' : 'No'}</div>
                        <div class="metric-label">Perfect Sequence</div>
                    </div>
                </div>
                <div class="card mt-16">
                    <h3 style="font-size:14px; font-weight:600; margin-bottom:10px;">Correct Order</h3>
                    <div class="sequence-img-row">${correctImgSequence}</div>
                    <h3 style="font-size:14px; font-weight:600; margin-bottom:10px; margin-top:16px;">Your Order</h3>
                    <div class="sequence-img-row">${submittedImgSequence}</div>
                </div>
                <button class="btn btn-primary btn-calc btn-full mt-24" onclick="App.showStation('calculation')">
                    PROCEED TO ATTENTION & CALCULATION
                </button>
            </div>
        `;
        triggerCelebration();
    }
};

// ============================================================
// STATION 3: ATTENTION & CALCULATION
// ============================================================
const CalculationStation = {
    startNumber: 0,
    subtractionValue: 0,
    expectedAnswers: [],
    timerStart: 0,
    responseTimes: [],

    renderInstructions() {
        return `
            <div class="screen screen-center">
                <div>
                    <div class="station-complete-badge">🔢 Station 3</div>
                    <h1 class="screen-title">Attention & Calculation</h1>
                </div>
                <div class="instructions-box">
                    <ol>
                        <li>You will begin with a number between <strong>88 and 99</strong>.</li>
                        <li>Subtract <strong>7</strong> each time.</li>
                        <li>Complete <strong>FIVE</strong> subtractions as quickly and accurately as possible.</li>
                        <li>After entering each answer, the cursor will move to the next box automatically.</li>
                        <li>You can go back and change earlier answers before submitting.</li>
                    </ol>
                </div>
                <button class="btn btn-primary btn-calc btn-full" onclick="CalculationStation.start()">
                    BEGIN CALCULATION
                </button>
            </div>
        `;
    },

    start() {
        this.startNumber = randomInt(CONFIG.calculation.startMin, CONFIG.calculation.startMax);
        this.subtractionValue = CONFIG.calculation.subtractionValue;
        this.expectedAnswers = [];
        this.responseTimes = [];

        let current = this.startNumber;
        for (let i = 0; i < CONFIG.calculation.totalQuestions; i++) {
            current -= this.subtractionValue;
            this.expectedAnswers.push(current);
        }

        this.renderChallenge();
    },

    renderChallenge() {
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen">
                <div class="calc-header">
                    <div class="start-number">${this.startNumber}</div>
                    <div class="instruction">Subtract <strong>7</strong> each time</div>
                </div>
                <div class="calc-inputs">
                    ${Array.from({length: CONFIG.calculation.totalQuestions}, (_, i) => `
                        <div class="calc-row">
                            <span class="calc-number">${i + 1}.</span>
                            <input type="text" inputmode="numeric" id="calc-input-${i}" 
                                   placeholder="?" autocomplete="off"
                                   onfocus="CalculationStation.onInputFocus(${i})"
                                   oninput="CalculationStation.onInputChange(${i})">
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary btn-calc btn-full" onclick="CalculationStation.submit()">
                    SUBMIT ANSWERS
                </button>
            </div>
        `;

        this.timerStart = performance.now();
        // Focus first input
        setTimeout(() => {
            const first = document.getElementById('calc-input-0');
            if (first) first.focus();
        }, 100);
    },

    onInputFocus(index) {
        if (index > 0 && this.responseTimes.length < index) {
            this.responseTimes.push(performance.now());
        } else if (index === 0 && this.responseTimes.length === 0) {
            // First focus - mark start
        }
    },

    onInputChange(index) {
        const input = document.getElementById(`calc-input-${index}`);
        const val = input.value.trim();
        // Auto-advance when a reasonable number is entered (2+ digits or negative)
        if (val.length >= 2 && !val.endsWith('-')) {
            const nextIndex = index + 1;
            if (nextIndex < CONFIG.calculation.totalQuestions) {
                const nextInput = document.getElementById(`calc-input-${nextIndex}`);
                if (nextInput) nextInput.focus();
            }
        }
    },

    submit() {
        const totalTime = ((performance.now() - this.timerStart) / 1000).toFixed(1);
        const submittedAnswers = [];

        for (let i = 0; i < CONFIG.calculation.totalQuestions; i++) {
            const input = document.getElementById(`calc-input-${i}`);
            const val = input.value.trim();
            submittedAnswers.push(val === '' ? null : parseInt(val, 10));
        }

        // Absolute correctness
        let absoluteCorrect = 0;
        let firstErrorPosition = null;
        for (let i = 0; i < CONFIG.calculation.totalQuestions; i++) {
            if (submittedAnswers[i] === this.expectedAnswers[i]) {
                absoluteCorrect++;
            } else if (firstErrorPosition === null) {
                firstErrorPosition = i + 1;
            }
        }

        // Sequential consistency
        let sequentialCorrect = 0;
        for (let i = 0; i < CONFIG.calculation.totalQuestions; i++) {
            const prev = i === 0 ? this.startNumber : submittedAnswers[i - 1];
            if (prev !== null && submittedAnswers[i] !== null) {
                if (prev - this.subtractionValue === submittedAnswers[i]) {
                    sequentialCorrect++;
                }
            }
        }

        const accuracyPercent = Math.round((absoluteCorrect / CONFIG.calculation.totalQuestions) * 100);
        const sequentialConsistency = Math.round((sequentialCorrect / CONFIG.calculation.totalQuestions) * 100);
        const avgResponseTime = (parseFloat(totalTime) / CONFIG.calculation.totalQuestions).toFixed(1);

        // Store results
        App.sessionData.calculation = {
            startNumber: this.startNumber,
            subtractionValue: this.subtractionValue,
            expectedAnswers: [...this.expectedAnswers],
            submittedAnswers,
            absoluteCorrect,
            accuracyPercent,
            sequentialConsistency,
            totalTime: parseFloat(totalTime),
            averageResponseTime: parseFloat(avgResponseTime),
            firstErrorPosition
        };

        App.completeStation('calculation');
        this.showResults();
    },

    showResults() {
        const data = App.sessionData.calculation;
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen">
                <div class="result-hero">
                    <div class="station-complete-badge">✓ Station 3 Complete</div>
                    <h2 style="color: var(--calculation-color);">CALCULATION ACCURACY</h2>
                    <div class="big-value" style="color: var(--calculation-color);">${data.absoluteCorrect} / 5</div>
                    <div class="big-unit">${data.accuracyPercent}%</div>
                </div>
                <div class="result-metrics">
                    <div class="metric-card">
                        <div class="metric-value">${data.totalTime}s</div>
                        <div class="metric-label">Completion Time</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.averageResponseTime}s</div>
                        <div class="metric-label">Avg per Answer</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.sequentialConsistency}%</div>
                        <div class="metric-label">Sequential Consistency</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${data.firstErrorPosition || '—'}</div>
                        <div class="metric-label">First Error At</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-visual btn-full mt-24" onclick="App.showStation('visuospatial')">
                    PROCEED TO VISUOSPATIAL CHALLENGE
                </button>
            </div>
        `;
        triggerCelebration();
    }
};

// ============================================================
// STATION 4: VISUOSPATIAL PUZZLE
// ============================================================
const VisuospatialStation = {
    puzzleId: '',
    puzzleImage: '',
    tiles: [],         // array of { correctIndex, currentIndex }
    selectedTile: null,
    moves: 0,
    unproductiveMoves: 0,
    firstMoveAccuracy: null,
    timerStart: 0,
    solved: false,

    renderInstructions() {
        return `
            <div class="screen screen-center">
                <div>
                    <div class="station-complete-badge">🧩 Station 4</div>
                    <h1 class="screen-title">Visuospatial Challenge</h1>
                </div>
                <div class="instructions-box">
                    <ol>
                        <li>A picture has been divided into <strong>NINE</strong> pieces.</li>
                        <li>Reconstruct the picture as quickly and accurately as possible.</li>
                        <li>Tap one piece, then tap another to <strong>swap</strong> them.</li>
                    </ol>
                </div>
                <button class="btn btn-primary btn-visual btn-full" onclick="VisuospatialStation.start()">
                    BEGIN PUZZLE
                </button>
            </div>
        `;
    },

    start() {
        const puzzleIndex = randomInt(0, CONFIG.visuospatial.puzzles.length - 1);
        this.puzzleImage = CONFIG.visuospatial.puzzles[puzzleIndex];
        this.puzzleId = `puzzle${puzzleIndex + 1}`;
        this.moves = 0;
        this.unproductiveMoves = 0;
        this.firstMoveAccuracy = null;
        this.selectedTile = null;
        this.solved = false;

        // Create tiles
        this.tiles = [];
        const total = CONFIG.visuospatial.gridSize * CONFIG.visuospatial.gridSize;
        for (let i = 0; i < total; i++) {
            this.tiles.push({ correctIndex: i, currentIndex: i });
        }

        // Shuffle until not solved
        do {
            this.shuffleTiles();
        } while (this.isSolved());

        this.timerStart = performance.now();
        this.render();
    },

    shuffleTiles() {
        const indices = this.tiles.map(t => t.currentIndex);
        const shuffled = fisherYatesShuffle(indices);
        for (let i = 0; i < this.tiles.length; i++) {
            this.tiles[i].currentIndex = shuffled[i];
        }
    },

    isSolved() {
        return this.tiles.every(t => t.correctIndex === t.currentIndex);
    },

    getCorrectCount() {
        return this.tiles.filter(t => t.correctIndex === t.currentIndex).length;
    },

    render() {
        const container = document.getElementById('screen-container');
        const size = CONFIG.visuospatial.gridSize;
        const elapsed = ((performance.now() - this.timerStart) / 1000).toFixed(1);

        // Build grid - position tiles by their currentIndex
        // tiles[i] is the tile that belongs at position tiles[i].correctIndex,
        // currently displayed at position tiles[i].currentIndex
        // We need to show: at grid position p, show the tile whose currentIndex === p
        let gridCells = '';
        for (let pos = 0; pos < size * size; pos++) {
            const tile = this.tiles.find(t => t.currentIndex === pos);
            const correctIdx = tile.correctIndex;
            const row = Math.floor(correctIdx / size);
            const col = correctIdx % size;
            const bgPosX = col * 50; // 0%, 50%, 100%
            const bgPosY = row * 50;
            const isSelected = this.selectedTile !== null && this.tiles[this.selectedTile].currentIndex === pos;

            gridCells += `
                <div class="puzzle-tile ${isSelected ? 'selected' : ''}" 
                     style="background-image: url('${this.puzzleImage}'); background-position: ${bgPosX}% ${bgPosY}%;"
                     onclick="VisuospatialStation.handleTileTap(${pos})">
                </div>
            `;
        }

        container.innerHTML = `
            <div class="screen">
                <div class="puzzle-container">
                    <div class="puzzle-stats">
                        <span>Moves: ${this.moves}</span>
                        <span id="puzzle-timer">Time: ${elapsed}s</span>
                    </div>
                    <div class="puzzle-grid">
                        ${gridCells}
                    </div>
                    <img src="${this.puzzleImage}" class="puzzle-reference" alt="Reference image">
                </div>
            </div>
        `;

        // Start timer update
        if (!this.solved) {
            this.startTimerUpdate();
        }
    },

    startTimerUpdate() {
        if (this._timerInterval) clearInterval(this._timerInterval);
        this._timerInterval = setInterval(() => {
            const el = document.getElementById('puzzle-timer');
            if (el && !this.solved) {
                const elapsed = ((performance.now() - this.timerStart) / 1000).toFixed(1);
                el.textContent = `Time: ${elapsed}s`;
            } else {
                clearInterval(this._timerInterval);
            }
        }, 100);
    },

    handleTileTap(position) {
        if (this.solved) return;

        // Find which tile index is at this position
        const tileIdx = this.tiles.findIndex(t => t.currentIndex === position);

        if (this.selectedTile === null) {
            this.selectedTile = tileIdx;
            this.render();
        } else if (this.selectedTile === tileIdx) {
            this.selectedTile = null;
            this.render();
        } else {
            // Swap
            const correctBefore = this.getCorrectCount();

            const temp = this.tiles[this.selectedTile].currentIndex;
            this.tiles[this.selectedTile].currentIndex = this.tiles[tileIdx].currentIndex;
            this.tiles[tileIdx].currentIndex = temp;

            this.moves++;

            const correctAfter = this.getCorrectCount();

            // First move accuracy
            if (this.firstMoveAccuracy === null) {
                this.firstMoveAccuracy = correctAfter > correctBefore;
            }

            // Unproductive move check
            if (correctAfter < correctBefore) {
                this.unproductiveMoves++;
            }

            this.selectedTile = null;

            if (this.isSolved()) {
                this.solved = true;
                clearInterval(this._timerInterval);
                this.showComplete();
            } else {
                this.render();
            }
        }
    },

    showComplete() {
        const completionTime = ((performance.now() - this.timerStart) / 1000).toFixed(1);

        App.sessionData.visuospatial = {
            puzzleId: this.puzzleId,
            completionTime: parseFloat(completionTime),
            moves: this.moves,
            unproductiveMoves: this.unproductiveMoves,
            firstMoveAccuracy: this.firstMoveAccuracy
        };

        App.completeStation('visuospatial');

        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen screen-center">
                <div>
                    <div class="station-complete-badge">✓ Puzzle Complete!</div>
                    <div class="big-value" style="color: var(--visuospatial-color);">${completionTime}<span class="big-unit">s</span></div>
                </div>
                <div class="result-metrics" style="width:100%;">
                    <div class="metric-card">
                        <div class="metric-value">${this.moves}</div>
                        <div class="metric-label">Total Moves</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${this.unproductiveMoves}</div>
                        <div class="metric-label">Unproductive Moves</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-full mt-24" onclick="App.showFinalProfile()">
                    VIEW MY COGNITIVE PROFILE
                </button>
            </div>
        `;
        triggerCelebration();
    }
};

// ---- Celebration Effect ----
function triggerCelebration() {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    document.body.appendChild(overlay);

    const colors = ['#FF6B4A', '#8B5CF6', '#14B8A6', '#3B82F6', '#F59E0B', '#10B981'];
    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.animationDuration = (2 + Math.random() * 2) + 's';
        overlay.appendChild(piece);
    }

    setTimeout(() => overlay.remove(), 4000);
}
