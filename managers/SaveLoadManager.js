// SaveLoadManager.js
// Handles save/load state management, undo/redo functionality

import { updateAllRoadPatterns } from "../helpers/connector.js";
import { updateAllRailPatterns } from "../helpers/connector_rail.js";
import { fixBeachTileFrames } from "../helpers/tileUtils.js";
import { GameConfig } from "../config/GameConfig.js";

const { setScale } = GameConfig;

export class SaveLoadManager {
    constructor(scene) {
        this.scene = scene;
        this.history = [];   // Array of snapshots for undo
        this.historyMax = 21; // Max history depth
        this.redoStack = []; // Stack for redo snapshots
    }

    /**
     * Save the current game state to history (for undo/redo)
     */
    saveState() {
        // Build a lightweight snapshot (NO live Phaser objects)
        const snap = this._captureSnapshot();

        // Push & trim (FIFO)
        this.history.push(snap);
        if (this.history.length > this.historyMax) {
            this.history.shift();
        }

        // Clear redo stack because a new change invalidates forward history
        this.redoStack.length = 0;
    }

    /**
     * Undo to previous state
     */
    undoState() {
        console.log("🟢 undoState() executing...");
        console.log("   History length:", this.history.length);

        // Need at least two snapshots (current + previous) to undo
        if (this.history.length < 2) return;

        // Only store snapshot for redo if this is NOT a rotation state
        if (!this.scene.isRotating) {
            const currentSnap = this._captureSnapshot();
            this.redoStack.push(currentSnap);
        }

        // Drop current, fetch previous
        this.history.pop();
        const snap = this.history[this.history.length - 1];

        // Restore the snapshot
        this._restoreSnapshot(snap);
    }

    /**
     * Redo to next state
     */
    redoState() {
        if (this.redoStack.length === 0) return; // Nothing to redo

        const snap = this.redoStack.pop();

        // Safety check: don't exceed history limit
        if (this.history.length >= this.historyMax) {
            this.history.shift(); // Remove oldest if at limit
        }

        this.history.push(snap);

        // Restore the snapshot
        this._restoreSnapshot(snap);
    }

    /**
     * Capture current game state as a snapshot
     * @private
     */
    _captureSnapshot() {
        return {
            tiles: this.scene.mapTiles.map(t => ({
                gridX: t.gridX,
                gridY: t.gridY,
                x: t.x,
                y: t.y,
                key: t.texture.key,
                frame: t.frame?.name ?? 0,
                type: t.type ?? null,
                id: t.id ?? null
            })),
            mapTilesPos: [...this.scene.mapTilesPos],
            mapTilesType: [...this.scene.mapTilesType],
            mapArray: [...this.scene.mapArray],
            tileChanges: JSON.parse(JSON.stringify(this.scene.tileChanges)),
            changedIdx: { ...(this.scene.changedIndexesMap || {}) },
            climateNum: this.scene.currentClimateScore || 0
        };
    }

    /**
     * Restore a snapshot to the game
     * @private
     */
    _restoreSnapshot(snap) {
        // 1. Destroy current sprites
        this.scene.mapTiles.forEach(s => s.destroy());
        this.scene.mapTiles.length = 0;

        // 2. Recreate sprites from snapshot
        snap.tiles.forEach(d => {
            const s = this.scene.add.sprite(d.x, d.y, d.key, d.frame)
                .setScale(setScale)
                .setOrigin(
                    d.key === "green_apartments" ? 0.25 : 0.5,
                    d.key === "green_apartments" ? 0.47 : 0.5
                )
                .setInteractive({ pixelPerfect: true, alphaTolerance: 1 });

            s.gridX = d.gridX;
            s.gridY = d.gridY;
            s.type = d.type;
            s.id = d.id;

            this.scene.mapContainer.add(s);
            this.scene.mapTiles.push(s);
        });

        // 3. Restore parallel structures
        this.scene.mapTilesPos = [...snap.mapTilesPos];
        this.scene.mapTilesType = [...snap.mapTilesType];
        this.scene.mapArray = [...snap.mapArray];
        this.scene.tileChanges = JSON.parse(JSON.stringify(snap.tileChanges));
        this.scene.changedIndexesMap = { ...snap.changedIdx };
        this.scene.currentClimateScore = snap.climateNum;

        // 4. Re-compute visuals / score
        this.scene.mapContainer.sort('y');

        if (this.scene.updateClimateScore) {
            this.scene.updateClimateScore();
        }

        updateAllRoadPatterns(this.scene);
        updateAllRailPatterns(this.scene);
        fixBeachTileFrames(this.scene);

        // 5. Re-attach tile listeners
        if (this.scene.addTileListeners) {
            this.scene.addTileListeners();
        }
    }

    /**
     * Save the current map to localStorage
     */
    saveMapToLocalStorage() {
        const mapData = {
            tiles: this.scene.mapTiles.map(tile => ({
                x: tile.x,
                y: tile.y,
                texture: tile.texture.key,
                frame: tile.frame?.name ?? 0,
                gridX: tile.gridX,
                gridY: tile.gridY,
                type: tile.type,
                id: tile.id
            })),
            tileChanges: this.scene.tileChanges,
            gridWidth: this.scene.mapTiles.length > 0 ?
                Math.max(...this.scene.mapTiles.map(t => t.gridX)) + 1 : 30,
            gridHeight: this.scene.mapTiles.length > 0 ?
                Math.max(...this.scene.mapTiles.map(t => t.gridY)) + 1 : 30,
            landUseInfo: this.scene.landUseInfo || {}
        };

        try {
            localStorage.setItem('savedMap', JSON.stringify(mapData));
            console.log("✅ Map saved to localStorage");
            return true;
        } catch (error) {
            console.error("❌ Failed to save map:", error);
            return false;
        }
    }

    /**
     * Load a saved map from localStorage
     * @returns {Object|null} The saved map data, or null if not found
     */
    loadMapFromLocalStorage() {
        try {
            const savedMapString = localStorage.getItem('savedMap');
            if (!savedMapString) {
                console.log("No saved map found");
                return null;
            }

            const savedData = JSON.parse(savedMapString);

            if (!savedData || !savedData.tiles || !Array.isArray(savedData.tiles)) {
                console.error("Invalid saved map data");
                return null;
            }

            return savedData;
        } catch (error) {
            console.error("Failed to load saved map:", error);
            return null;
        }
    }

    /**
     * Clear all history and redo stacks
     */
    clearHistory() {
        this.history.length = 0;
        this.redoStack.length = 0;
        console.log("🧹 History cleared");
    }

    /**
     * Get current history stats
     */
    getHistoryStats() {
        return {
            historyCount: this.history.length,
            redoCount: this.redoStack.length,
            canUndo: this.history.length >= 2,
            canRedo: this.redoStack.length > 0
        };
    }
}
