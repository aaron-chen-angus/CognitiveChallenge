/* ============================================================
   Cognitive Performance Challenge - Main Application Controller
   ============================================================ */

const App = {
    currentScreen: 'home',
    completedStations: [],
    sessionData: {
        participant: null,
        reaction: null,
        memory: null,
        calculation: null,
        visuospatial: null
    },

    init() {
        this.showHome();
        this.setupBeforeUnload();
    },

    // Prevent accidental refresh during challenge
    setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.completedStations.length > 0 && this.completedStations.length < 4) {
                e.preventDefault();
                e.returnValue = 'Your current assessment is not complete. Leaving this page will reset the current station.';
            }
        });
    },

    // Navigation
    showScreen(screenName) {
        this.currentScreen = screenName;
        this.updateProgressBar();
    },

    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        const hideOnScreens = ['home', 'details'];
        
        if (hideOnScreens.includes(this.currentScreen)) {
            progressBar.classList.add('hidden');
        } else {
            progressBar.classList.remove('hidden');
        }

        const steps = progressBar.querySelectorAll('.progress-step');
        const stationOrder = ['reaction', 'memory', 'calculation', 'visuospatial'];

        steps.forEach((step, idx) => {
            const stationId = stationOrder[idx];
            step.classList.remove('completed', 'current', 'locked');

            if (this.completedStations.includes(stationId)) {
                step.classList.add('completed');
                step.querySelector('.progress-icon').textContent = '✓';
            } else if (this.isCurrentStation(stationId)) {
                step.classList.add('current');
                step.querySelector('.progress-icon').textContent = idx + 1;
            } else {
                step.classList.add('locked');
                step.querySelector('.progress-icon').textContent = '🔒';
            }
        });
    },

    isCurrentStation(stationId) {
        const stationOrder = ['reaction', 'memory', 'calculation', 'visuospatial'];
        const currentIdx = stationOrder.indexOf(stationId);
        const completedCount = this.completedStations.length;
        return currentIdx === completedCount;
    },

    completeStation(stationId) {
        if (!this.completedStations.includes(stationId)) {
            this.completedStations.push(stationId);
        }
        this.updateProgressBar();
    },

    // ---- Screens ----

    showHome() {
        this.showScreen('home');
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen">
                <div class="home-hero">
                    <h1>Cognitive Performance Challenge</h1>
                    <p>Four short challenges. Four cognitive domains. One performance profile.</p>
                </div>
                <div class="domain-cards">
                    <div class="domain-card reaction">
                        <div class="icon">⚡</div>
                        <div class="label">Reaction Time</div>
                    </div>
                    <div class="domain-card memory">
                        <div class="icon">🧠</div>
                        <div class="label">Memory & Recall</div>
                    </div>
                    <div class="domain-card calculation">
                        <div class="icon">🔢</div>
                        <div class="label">Attention & Calculation</div>
                    </div>
                    <div class="domain-card visuospatial">
                        <div class="icon">🧩</div>
                        <div class="label">Visuospatial Ability</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-full" onclick="App.showDetails()">
                    START
                </button>
                <p class="disclaimer">
                    This application is designed for cognitive engagement and performance monitoring. It is not a diagnostic or medical assessment tool.
                </p>
            </div>
        `;
    },

    showDetails() {
        this.showScreen('details');
        const container = document.getElementById('screen-container');
        container.innerHTML = `
            <div class="screen">
                <h1 class="screen-title text-center mb-16">Participant Details</h1>
                <div class="card">
                    <div class="form-group">
                        <label for="nickname">Name / Nickname</label>
                        <input type="text" id="nickname" placeholder="Enter your name or nickname" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label for="age">Age</label>
                        <input type="number" id="age" placeholder="Enter your age" inputmode="numeric" min="1" max="120">
                    </div>
                    <div class="form-group">
                        <label for="gender">Gender</label>
                        <select id="gender">
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Others">Others</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary btn-full mt-16" onclick="App.submitDetails()">
                    START COGNITIVE CHALLENGE
                </button>
            </div>
        `;
    },

    submitDetails() {
        const nickname = document.getElementById('nickname').value.trim();
        const age = document.getElementById('age').value.trim();
        const gender = document.getElementById('gender').value;

        if (!nickname) {
            alert('Please enter a name or nickname.');
            return;
        }
        if (!age || isNaN(age) || parseInt(age) < 1) {
            alert('Please enter a valid age.');
            return;
        }
        if (!gender) {
            alert('Please select a gender option.');
            return;
        }

        this.sessionData.participant = {
            nickname,
            age: parseInt(age),
            gender
        };

        this.completedStations = [];
        this.sessionData.reaction = null;
        this.sessionData.memory = null;
        this.sessionData.calculation = null;
        this.sessionData.visuospatial = null;

        this.showStation('reaction');
    },

    showStation(stationId) {
        this.showScreen(stationId);
        const container = document.getElementById('screen-container');

        switch (stationId) {
            case 'reaction':
                container.innerHTML = ReactionStation.renderInstructions();
                break;
            case 'memory':
                if (!this.completedStations.includes('reaction')) {
                    alert('Please complete the Reaction Time station first.');
                    return;
                }
                container.innerHTML = MemoryStation.renderInstructions();
                break;
            case 'calculation':
                if (!this.completedStations.includes('memory')) {
                    alert('Please complete the Memory & Recall station first.');
                    return;
                }
                container.innerHTML = CalculationStation.renderInstructions();
                break;
            case 'visuospatial':
                if (!this.completedStations.includes('calculation')) {
                    alert('Please complete the Attention & Calculation station first.');
                    return;
                }
                container.innerHTML = VisuospatialStation.renderInstructions();
                break;
        }
    },

    showFinalProfile() {
        this.showScreen('profile');
        const container = document.getElementById('screen-container');
        container.innerHTML = Results.renderFinalProfile();
    },

    reset() {
        if (confirm('Start a new assessment? Your current results will be lost unless saved.')) {
            this.completedStations = [];
            this.sessionData = {
                participant: null,
                reaction: null,
                memory: null,
                calculation: null,
                visuospatial: null
            };
            this.showHome();
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
