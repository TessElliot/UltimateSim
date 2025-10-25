// managers/ClimateManager.js
// Centralized climate score calculation and management

import { findClimateNumber } from '../helpers/tileUtils.js';

export class ClimateManager {
    constructor(scene) {
        this.scene = scene;
        this.currentScore = 0;
        this.scoreHistory = [];

        // Reference to the climate text display (will be set by GameScene)
        this.climateText = null;
    }

    /**
     * Initialize the manager and set up event listeners
     * @param {Phaser.Events.EventEmitter} emitter - Event emitter for tile changes
     */
    initialize(emitter) {
        // Get reference to DOM element
        this.climateScoreElement = document.getElementById('climate-score');
        this.processingInterval = null;
        this.processingIndex = 0;
        this.hasShownIntro = false; // Track if intro animation has been shown

        // Listen for tile change events
        if (emitter) {
            emitter.on('TILE_PLACED', this.handleTilePlaced, this);
            emitter.on('TILE_REMOVED', this.handleTileRemoved, this);
            emitter.on('TILES_LOADED', this.recalculateScore, this);
        }

        // Show the climate score display in top-left, start with processing animation
        if (this.climateScoreElement) {
            this.climateScoreElement.classList.add('show');
            // Start with processing animation (score is 0 at start)
            this.startProcessingAnimation();
        }
    }

    /**
     * Start the "processing map..." animation
     */
    startProcessingAnimation() {
        if (!this.climateScoreElement) return;

        const textIterations = [
            "processing map",
            "processing map.",
            "processing map..",
            "processing map..."
        ];

        this.processingIndex = 0;
        this.processingInterval = setInterval(() => {
            if (this.climateScoreElement) {
                this.climateScoreElement.textContent = textIterations[this.processingIndex];
                this.processingIndex = (this.processingIndex + 1) % textIterations.length;
            }
        }, 1000);
    }

    /**
     * Handle when a tile is placed via UI or directly
     * @param {Object} data - {oldTileType, newTileType}
     */
    handleTilePlaced(data) {
        console.log(`🌍 ClimateManager: Tile placed - ${data.oldTileType} → ${data.newTileType}`);

        // Use delta calculation: subtract old score, add new score
        const oldScore = findClimateNumber(data.oldTileType);
        const newScore = findClimateNumber(data.newTileType);
        const delta = newScore - oldScore;

        console.log(`   📊 Old score: ${oldScore}, New score: ${newScore}, Delta: ${delta}`);

        // Update current score by delta
        const updatedScore = this.currentScore + delta;
        this.updateScore(updatedScore);
    }

    /**
     * Handle when a tile is removed (bulldozed)
     * @param {Object} data - {tileType}
     */
    handleTileRemoved(data) {
        console.log(`🌍 ClimateManager: Tile removed - ${data.tileType}`);

        // Use delta calculation: subtract the removed tile's score
        const removedScore = findClimateNumber(data.tileType);
        const delta = -removedScore;

        console.log(`   📊 Removed score: ${removedScore}, Delta: ${delta}`);

        // Update current score by delta
        const updatedScore = this.currentScore + delta;
        this.updateScore(updatedScore);
    }

    /**
     * Recalculate the entire climate score from all tiles
     */
    recalculateScore() {
        if (!this.scene.mapTiles || this.scene.mapTiles.length === 0) {
            this.updateScore(0);
            return;
        }

        let score = 0;
        const scores = [];

        // Calculate total score from all tiles
        for (let tile of this.scene.mapTiles) {
            const tileScore = findClimateNumber(tile.texture.key);
            score += tileScore;
            scores.push(tileScore);
        }

        // Store score history for debugging/analytics
        this.scoreHistory.push({
            score,
            tileCount: this.scene.mapTiles.length,
            timestamp: Date.now()
        });

        // Keep only last 10 scores
        if (this.scoreHistory.length > 10) {
            this.scoreHistory.shift();
        }

        this.updateScore(score);
    }

    /**
     * Update the displayed score
     * @param {number} newScore - The new climate score
     */
    updateScore(newScore) {
        const oldScore = this.currentScore;
        this.currentScore = newScore;

        // Update the DOM element with label
        if (this.climateScoreElement) {
            // If score is 0, show "processing map" animation
            if (newScore === 0) {
                if (!this.processingInterval) {
                    this.startProcessingAnimation();
                }
            } else {
                // Stop processing animation if it's running
                if (this.processingInterval) {
                    clearInterval(this.processingInterval);
                    this.processingInterval = null;
                }

                this.climateScoreElement.textContent = `Total Regional Climate Impact: ${newScore}`;

                // First time score becomes non-zero: trigger intro animation
                if (!this.hasShownIntro && oldScore === 0) {
                    this.hasShownIntro = true;

                    // Add intro class to move to center with rainbow animation
                    this.climateScoreElement.classList.add('intro');

                    // After 4 seconds, transition to positioned state (top-right)
                    setTimeout(() => {
                        if (this.climateScoreElement) {
                            this.climateScoreElement.classList.remove('intro');
                            this.climateScoreElement.classList.add('positioned');
                        }
                    }, 4000);
                }
                // Subsequent score changes: just trigger rainbow animation
                else if (oldScore !== newScore) {
                    // Remove and re-add the class to restart animation
                    this.climateScoreElement.classList.remove('score-update');
                    // Force reflow to restart animation
                    void this.climateScoreElement.offsetWidth;
                    this.climateScoreElement.classList.add('score-update');
                }
            }
        }

        // Debug logging
        if (oldScore !== newScore) {
            //console.log(`✅ Climate score changed: ${oldScore} → ${newScore} (${this.scene.mapTiles.length} tiles)`);
        }

        // Emit event so other systems can react to score changes
        if (this.scene.emitter) {
            this.scene.emitter.emit('CLIMATE_SCORE_UPDATED', {
                oldScore,
                newScore,
                tileCount: this.scene.mapTiles.length
            });
        }

        return newScore;
    }

    /**
     * Get the current climate score
     * @returns {number} Current score
     */
    getCurrentScore() {
        return this.currentScore;
    }

    /**
     * Get score history for debugging
     * @returns {Array} Score history
     */
    getScoreHistory() {
        return this.scoreHistory;
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.scene.emitter) {
            this.scene.emitter.off('TILE_PLACED', this.handleTilePlaced, this);
            this.scene.emitter.off('TILE_REMOVED', this.handleTileRemoved, this);
            this.scene.emitter.off('TILES_LOADED', this.recalculateScore, this);
        }
    }
}
