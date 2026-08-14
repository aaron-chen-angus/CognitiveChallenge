/* ============================================================
   Cognitive Performance Challenge - Results & History
   ============================================================ */

const Results = {

    // Render final cognitive performance profile
    renderFinalProfile() {
        const data = App.sessionData;
        const participant = data.participant;
        const dateStr = new Date().toLocaleDateString('en-AU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Get previous result for comparison
        const previous = this.getPreviousResult(participant.nickname);

        let html = `
            <div class="screen">
                <div class="profile-header">
                    <h1>YOUR COGNITIVE PERFORMANCE PROFILE</h1>
                    <div class="participant-info">
                        ${participant.nickname} • Age ${participant.age} • ${participant.gender} • ${dateStr}
                    </div>
                </div>
        `;

        // Reaction Card
        if (data.reaction) {
            const r = data.reaction;
            let comparison = '';
            if (previous && previous.reaction) {
                const diff = previous.reaction.best - r.best;
                if (diff > 0) comparison = `<div class="comparison-row"><span class="improved">↑ ${diff} ms faster than previous</span></div>`;
                else if (diff < 0) comparison = `<div class="comparison-row"><span class="declined">↓ ${Math.abs(diff)} ms slower than previous</span></div>`;
            }
            html += `
                <div class="profile-card reaction-card">
                    <div class="card-header">
                        <span class="card-icon">⚡</span>
                        <span class="card-title">Processing Speed</span>
                    </div>
                    <div class="card-main" style="color:var(--reaction-color);">${r.best} ms</div>
                    <div class="card-details">
                        Best Reaction Time<br>
                        Average: ${r.mean} ms • Median: ${r.median} ms<br>
                        Variability: ${r.standardDeviation} ms • False Starts: ${r.falseStarts}
                    </div>
                    ${comparison}
                </div>
            `;
        }

        // Memory Card
        if (data.memory) {
            const m = data.memory;
            let comparison = '';
            if (previous && previous.memory) {
                const diff = m.exactCorrect - previous.memory.exactCorrect;
                if (diff > 0) comparison = `<div class="comparison-row"><span class="improved">↑ +${diff} improvement</span></div>`;
                else if (diff < 0) comparison = `<div class="comparison-row"><span class="declined">↓ ${diff} from previous</span></div>`;
            }
            html += `
                <div class="profile-card memory-card">
                    <div class="card-header">
                        <span class="card-icon">🧠</span>
                        <span class="card-title">Memory & Recall</span>
                    </div>
                    <div class="card-main" style="color:var(--memory-color);">${m.exactCorrect} / 5 <span style="font-size:20px;">(${m.accuracyPercent}%)</span></div>
                    <div class="card-details">
                        Accuracy<br>
                        Adjacent Pairs: ${m.adjacentPairsCorrect} / 4<br>
                        Recall Time: ${m.recallTime}s • Perfect: ${m.perfectSequence ? 'Yes' : 'No'}
                    </div>
                    ${comparison}
                </div>
            `;
        }

        // Calculation Card
        if (data.calculation) {
            const c = data.calculation;
            let comparison = '';
            if (previous && previous.calculation) {
                const diff = c.absoluteCorrect - previous.calculation.absoluteCorrect;
                if (diff > 0) comparison = `<div class="comparison-row"><span class="improved">↑ +${diff} improvement</span></div>`;
                else if (diff < 0) comparison = `<div class="comparison-row"><span class="declined">↓ ${diff} from previous</span></div>`;
            }
            html += `
                <div class="profile-card calculation-card">
                    <div class="card-header">
                        <span class="card-icon">🔢</span>
                        <span class="card-title">Attention & Calculation</span>
                    </div>
                    <div class="card-main" style="color:var(--calculation-color);">${c.absoluteCorrect} / 5 <span style="font-size:20px;">(${c.accuracyPercent}%)</span></div>
                    <div class="card-details">
                        Accuracy<br>
                        Completion Time: ${c.totalTime}s • Avg: ${c.averageResponseTime}s per answer<br>
                        Sequential Consistency: ${c.sequentialConsistency}%
                    </div>
                    ${comparison}
                </div>
            `;
        }

        // Visuospatial Card
        if (data.visuospatial) {
            const v = data.visuospatial;
            let comparison = '';
            if (previous && previous.visuospatial) {
                const diff = previous.visuospatial.completionTime - v.completionTime;
                if (diff > 0) comparison = `<div class="comparison-row"><span class="improved">↑ ${diff.toFixed(1)}s faster than previous</span></div>`;
                else if (diff < 0) comparison = `<div class="comparison-row"><span class="declined">↓ ${Math.abs(diff).toFixed(1)}s slower than previous</span></div>`;
            }
            html += `
                <div class="profile-card visuospatial-card">
                    <div class="card-header">
                        <span class="card-icon">🧩</span>
                        <span class="card-title">Visuospatial Processing</span>
                    </div>
                    <div class="card-main" style="color:var(--visuospatial-color);">${v.completionTime}s</div>
                    <div class="card-details">
                        Completion Time<br>
                        Moves: ${v.moves} • Unproductive Moves: ${v.unproductiveMoves}
                    </div>
                    ${comparison}
                </div>
            `;
        }

        // Reference note
        html += `
            <div class="card mt-16" style="background: var(--bg); text-align:center;">
                <p style="font-size:12px; color:var(--text-light);">Reference comparison not yet available.<br>Performance shown is your individual result.</p>
            </div>
        `;

        // Action buttons
        html += `
            <div class="action-row mt-24">
                <button class="btn btn-primary" onclick="Results.saveResult()">SAVE RESULT</button>
                <button class="btn btn-secondary" onclick="Results.downloadResults()">DOWNLOAD</button>
            </div>
            <div class="action-row">
                <button class="btn btn-secondary" onclick="Results.showHistory()">VIEW HISTORY</button>
                <button class="btn btn-secondary" onclick="App.reset()">NEW ASSESSMENT</button>
            </div>
        `;

        // About section
        html += `
            <div class="about-section mt-24">
                <details class="collapsible">
                    <summary>About the Challenges</summary>
                    <div class="ref-list">
                        <p><strong>Reaction Time</strong> — Measures simple visual processing speed and psychomotor response.</p>
                        <p><strong>Memory & Recall</strong> — Uses a picture-sequence recall paradigm to assess episodic/sequential memory.</p>
                        <p><strong>Attention & Calculation</strong> — Uses serial subtraction to challenge sustained attention, working mental manipulation and calculation.</p>
                        <p><strong>Visuospatial Ability</strong> — Uses jigsaw reconstruction to engage spatial perception, visuoconstruction and mental manipulation.</p>
                        <p style="margin-top:12px; font-style:italic;">These tasks are science-informed adaptations of established cognitive assessment paradigms. The application itself is not a validated clinical cognitive assessment.</p>
                    </div>
                </details>
                <details class="collapsible">
                    <summary>Scientific References</summary>
                    <div class="ref-list">
                        <p>Dikmen SS, Bauer PJ, Weintraub S, et al. Measuring episodic memory across the lifespan: NIH Toolbox Picture Sequence Memory Test. <em>Journal of the International Neuropsychological Society</em>. 2014;20(6):611–619.</p>
                        <p>Bauer PJ, Dikmen SS, Heaton RK, et al. NIH Toolbox Cognition Battery: Measuring Episodic Memory. <em>Monographs of the Society for Research in Child Development</em>. 2013;78(4):34–48.</p>
                        <p>Woods DL, Wyma JM, Yund EW, Herron TJ, Reed B. Factors influencing the latency of simple reaction time. <em>Frontiers in Human Neuroscience</em>. 2015;9:131.</p>
                        <p>Karzmark P. Validity of the serial seven procedure. <em>International Journal of Geriatric Psychiatry</em>. 2000;15(8):677–679.</p>
                        <p>Fissler P, Küster OC, Schlee W, Kolassa IT. Jigsaw puzzling taps multiple cognitive abilities and is a potential protective factor for cognitive aging. <em>Frontiers in Aging Neuroscience</em>. 2018;10:299.</p>
                    </div>
                </details>
            </div>
            <div class="disclaimer mt-16">
                This application is designed for cognitive engagement and performance monitoring. It is not a diagnostic or medical assessment tool.
            </div>
        </div>
        `;

        return html;
    },

    // Save current result to localStorage
    saveResult() {
        const data = App.sessionData;
        const record = {
            participant: { ...data.participant },
            reaction: data.reaction ? { ...data.reaction } : null,
            memory: data.memory ? { ...data.memory } : null,
            calculation: data.calculation ? { ...data.calculation } : null,
            visuospatial: data.visuospatial ? { ...data.visuospatial } : null,
            completedAt: new Date().toISOString()
        };

        let history = this.getHistory();
        history.push(record);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(history));

        // Send to Google Sheets if configured
        if (CONFIG.googleSheetsWebhookUrl) {
            this.sendToGoogleSheets(record);
        }

        alert('Result saved successfully!');
    },

    // Send result to Google Sheets via Apps Script webhook
    async sendToGoogleSheets(record) {
        const url = CONFIG.googleSheetsWebhookUrl;
        if (!url) return { sent: false, reason: 'No webhook URL configured' };

        try {
            // Flatten the nested result into spreadsheet-friendly columns
            const flat = {
                timestamp: record.completedAt,
                nickname: record.participant.nickname,
                age: record.participant.age,
                gender: record.participant.gender,
                // Reaction Time
                reactionBest: record.reaction ? record.reaction.best : '',
                reactionMean: record.reaction ? record.reaction.mean : '',
                reactionMedian: record.reaction ? record.reaction.median : '',
                reactionSD: record.reaction ? record.reaction.standardDeviation : '',
                reactionRange: record.reaction ? record.reaction.range : '',
                reactionSlowest: record.reaction ? record.reaction.slowest : '',
                reactionFalseStarts: record.reaction ? record.reaction.falseStarts : '',
                reactionAttempt1: record.reaction && record.reaction.attempts[0] ? record.reaction.attempts[0] : '',
                reactionAttempt2: record.reaction && record.reaction.attempts[1] ? record.reaction.attempts[1] : '',
                reactionAttempt3: record.reaction && record.reaction.attempts[2] ? record.reaction.attempts[2] : '',
                // Memory
                memoryExactCorrect: record.memory ? record.memory.exactCorrect : '',
                memoryAccuracy: record.memory ? record.memory.accuracyPercent : '',
                memoryAdjacentPairs: record.memory ? record.memory.adjacentPairsCorrect : '',
                memoryRecallTime: record.memory ? record.memory.recallTime : '',
                memoryPerfectSequence: record.memory ? (record.memory.perfectSequence ? 'Yes' : 'No') : '',
                memoryPresentedOrder: record.memory ? record.memory.presentedOrder.join(', ') : '',
                memorySubmittedOrder: record.memory ? record.memory.submittedOrder.join(', ') : '',
                // Calculation
                calcStartNumber: record.calculation ? record.calculation.startNumber : '',
                calcSubtractionValue: record.calculation ? record.calculation.subtractionValue : '',
                calcAbsoluteCorrect: record.calculation ? record.calculation.absoluteCorrect : '',
                calcAccuracy: record.calculation ? record.calculation.accuracyPercent : '',
                calcSequentialConsistency: record.calculation ? record.calculation.sequentialConsistency : '',
                calcTotalTime: record.calculation ? record.calculation.totalTime : '',
                calcAvgResponseTime: record.calculation ? record.calculation.averageResponseTime : '',
                calcFirstErrorPosition: record.calculation ? (record.calculation.firstErrorPosition || '') : '',
                calcExpectedAnswers: record.calculation ? record.calculation.expectedAnswers.join(', ') : '',
                calcSubmittedAnswers: record.calculation ? record.calculation.submittedAnswers.join(', ') : '',
                // Visuospatial
                puzzleId: record.visuospatial ? record.visuospatial.puzzleId : '',
                puzzleCompletionTime: record.visuospatial ? record.visuospatial.completionTime : '',
                puzzleMoves: record.visuospatial ? record.visuospatial.moves : '',
                puzzleUnproductiveMoves: record.visuospatial ? record.visuospatial.unproductiveMoves : '',
                puzzleFirstMoveAccuracy: record.visuospatial ? (record.visuospatial.firstMoveAccuracy ? 'Yes' : 'No') : ''
            };

            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(flat)
            });

            console.log('Result sent to Google Sheets');
            return { sent: true };
        } catch (error) {
            console.error('Google Sheets export failed:', error);
            return { sent: false, reason: error.message };
        }
    },

    // Get history from localStorage
    getHistory() {
        try {
            const raw = localStorage.getItem(CONFIG.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    // Get most recent result for a nickname
    getPreviousResult(nickname) {
        const history = this.getHistory();
        const matches = history.filter(h => 
            h.participant && h.participant.nickname && 
            h.participant.nickname.toLowerCase() === nickname.toLowerCase()
        );
        if (matches.length === 0) return null;
        return matches[matches.length - 1];
    },

    // Show history screen
    showHistory() {
        const history = this.getHistory();
        const container = document.getElementById('screen-container');

        if (history.length === 0) {
            container.innerHTML = `
                <div class="screen screen-center">
                    <h2 class="screen-title">No History</h2>
                    <p class="screen-subtitle">Complete an assessment and save the result to see your history here.</p>
                    <button class="btn btn-secondary" onclick="App.showFinalProfile()">Back to Profile</button>
                </div>
            `;
            return;
        }

        let html = `
            <div class="screen">
                <h2 class="screen-title text-center mb-16">Result History</h2>
        `;

        history.slice().reverse().forEach((record, idx) => {
            const date = new Date(record.completedAt).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            html += `
                <div class="history-item">
                    <div class="history-date">${date} — ${record.participant.nickname}</div>
                    <div class="history-scores">
                        ${record.reaction ? `<span style="color:var(--reaction-color);">⚡ ${record.reaction.best}ms</span>` : ''}
                        ${record.memory ? `<span style="color:var(--memory-color);">🧠 ${record.memory.exactCorrect}/5</span>` : ''}
                        ${record.calculation ? `<span style="color:var(--calculation-color);">🔢 ${record.calculation.absoluteCorrect}/5</span>` : ''}
                        ${record.visuospatial ? `<span style="color:var(--visuospatial-color);">🧩 ${record.visuospatial.completionTime}s</span>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
            <div class="action-row mt-24">
                <button class="btn btn-secondary" onclick="App.showFinalProfile()">Back to Profile</button>
                <button class="btn btn-secondary" onclick="Results.deleteHistory()" style="color:var(--error);border-color:var(--error);">Delete History</button>
            </div>
            </div>
        `;

        container.innerHTML = html;
    },

    // Delete all history
    deleteHistory() {
        if (confirm('Delete all saved results? This cannot be undone.')) {
            localStorage.removeItem(CONFIG.storageKey);
            alert('History deleted.');
            this.showHistory();
        }
    },

    // Download results as printable HTML
    downloadResults() {
        const data = App.sessionData;
        const participant = data.participant;
        const dateStr = new Date().toLocaleDateString('en-AU', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Cognitive Performance Profile - ${participant.nickname}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1E293B; }
h1 { text-align: center; color: #6366F1; margin-bottom: 4px; }
.info { text-align: center; color: #64748B; margin-bottom: 32px; }
.card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.card h3 { margin: 0 0 8px; }
.card .value { font-size: 28px; font-weight: 800; margin: 8px 0; }
.card .details { font-size: 14px; color: #64748B; line-height: 1.8; }
.reaction .value { color: #FF6B4A; }
.memory .value { color: #8B5CF6; }
.calculation .value { color: #14B8A6; }
.visuospatial .value { color: #3B82F6; }
.disclaimer { text-align: center; font-size: 12px; color: #94A3B8; margin-top: 32px; }
@media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>Cognitive Performance Profile</h1>
<p class="info">${participant.nickname} • Age ${participant.age} • ${participant.gender} • ${dateStr}</p>

${data.reaction ? `<div class="card reaction"><h3>⚡ Processing Speed</h3><div class="value">${data.reaction.best} ms</div><div class="details">Best Reaction Time<br>Average: ${data.reaction.mean} ms • Median: ${data.reaction.median} ms • SD: ${data.reaction.standardDeviation} ms<br>False Starts: ${data.reaction.falseStarts}</div></div>` : ''}

${data.memory ? `<div class="card memory"><h3>🧠 Memory & Recall</h3><div class="value">${data.memory.exactCorrect} / 5 (${data.memory.accuracyPercent}%)</div><div class="details">Adjacent Pairs: ${data.memory.adjacentPairsCorrect} / 4 • Recall Time: ${data.memory.recallTime}s • Perfect: ${data.memory.perfectSequence ? 'Yes' : 'No'}</div></div>` : ''}

${data.calculation ? `<div class="card calculation"><h3>🔢 Attention & Calculation</h3><div class="value">${data.calculation.absoluteCorrect} / 5 (${data.calculation.accuracyPercent}%)</div><div class="details">Time: ${data.calculation.totalTime}s • Avg: ${data.calculation.averageResponseTime}s • Sequential Consistency: ${data.calculation.sequentialConsistency}%</div></div>` : ''}

${data.visuospatial ? `<div class="card visuospatial"><h3>🧩 Visuospatial Processing</h3><div class="value">${data.visuospatial.completionTime}s</div><div class="details">Moves: ${data.visuospatial.moves} • Unproductive: ${data.visuospatial.unproductiveMoves}</div></div>` : ''}

<p class="disclaimer">This application is designed for cognitive engagement and performance monitoring. It is not a diagnostic or medical assessment tool.</p>
</body>
</html>`;

        const blob = new Blob([printHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cognitive-profile-${participant.nickname}-${new Date().toISOString().slice(0,10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
