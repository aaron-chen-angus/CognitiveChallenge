/* ============================================================
   Cognitive Performance Challenge - Configuration
   ============================================================ */

const CONFIG = {
    // Application metadata
    appName: 'Cognitive Performance Challenge',
    version: '1.0.0',

    // Google Sheets integration
    // Set this to your Google Apps Script Web App URL to enable auto-export
    googleSheetsWebhookUrl: 'https://script.google.com/macros/s/AKfycbwzR2nWXPy9nfwYk0tFnSUJqe6a6DuUF5Zt7_ZjdzIQ7oPU9STMXIHxAAkSFAV2XHC0SQ/exec',

    // Station definitions
    stations: [
        { id: 'reaction', name: 'Reaction Time', icon: '⚡', color: '#FF6B4A' },
        { id: 'memory', name: 'Memory & Recall', icon: '🧠', color: '#8B5CF6' },
        { id: 'calculation', name: 'Attention & Calculation', icon: '🔢', color: '#14B8A6' },
        { id: 'visuospatial', name: 'Visuospatial', icon: '🧩', color: '#3B82F6' }
    ],

    // Reaction Time settings
    reaction: {
        minDelay: 2000,         // Minimum wait before green (ms)
        maxDelay: 5000,         // Maximum wait before green (ms)
        requiredAttempts: 3,    // Valid attempts needed
        falseStartDelay: 1500  // Delay after false start (ms)
    },

    // Memory settings
    memory: {
        items: [
            { id: 'apple', label: 'Apple', image: 'assets/memory/apple.png' },
            { id: 'duck', label: 'Duck', image: 'assets/memory/duck.png' },
            { id: 'hat', label: 'Hat', image: 'assets/memory/hat.png' },
            { id: 'pen', label: 'Pen', image: 'assets/memory/pen.png' },
            { id: 'pineapple', label: 'Pineapple', image: 'assets/memory/pineapple.png' }
        ],
        displayDuration: 2000,   // Time each image shown (ms)
        postEncodingDelay: 500   // Delay before recall phase (ms)
    },

    // Calculation settings
    calculation: {
        startMin: 88,
        startMax: 99,
        subtractionValue: 7,
        totalQuestions: 5
    },

    // Visuospatial settings
    visuospatial: {
        puzzles: [
            'assets/puzzles/puzzle1.png',
            'assets/puzzles/puzzle2.png',
            'assets/puzzles/puzzle3.png',
            'assets/puzzles/puzzle4.png'
        ],
        gridSize: 3  // 3x3 grid
    },

    // localStorage key
    storageKey: 'cognitiveChallenge_history'
};

// Reference data architecture (empty until real norms available)
const REFERENCE_DATA = {
    reaction: {},
    memory: {},
    calculation: {},
    visuospatial: {}
};

// Reference functions - return null until populated
function getReactionReference(age, reactionTime) {
    return null;
}

function getMemoryReference(age, accuracy, time) {
    return null;
}

function getCalculationReference(age, accuracy, time) {
    return null;
}

function getVisuospatialReference(age, time, moves) {
    return null;
}
