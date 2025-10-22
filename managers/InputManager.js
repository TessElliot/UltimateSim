// InputManager.js
// Handles all keyboard and UI input for the game

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.emitter = null;

        // Store bound methods for proper cleanup
        this.boundHandlers = {
            moveMap: this.handleMoveMap.bind(this),
            zoomMap: this.handleZoomMap.bind(this),
            rotateMap: this.handleRotateMap.bind(this),
            infoMap: this.handleInfoMap.bind(this),
            destroy: this.handleDestroy.bind(this),
            plantTrees: this.handlePlantTrees.bind(this),
            buildMedium: this.handleBuildMedium.bind(this),
            buildLarge: this.handleBuildLarge.bind(this),
            buildRoad: this.handleBuildRoad.bind(this),
            buildBikeLane: this.handleBuildBikeLane.bind(this),
            buildWind: this.handleBuildWind.bind(this),
            buildSolar: this.handleBuildSolar.bind(this),
            goHome: this.handleGoHome.bind(this),
            undo: this.handleUndo.bind(this),
            saveGame: this.handleSaveGame.bind(this)
        };
    }

    /**
     * Initialize the input manager with the event emitter
     */
    initialize(emitter) {
        this.emitter = emitter;
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    /**
     * Set up all event listeners (emitter-based UI events)
     */
    setupEventListeners() {
        if (!this.emitter) return;

        // Remove any existing listeners first
        this.removeEventListeners();

        // Register event listeners
        this.emitter.on("MOVE MAP", this.boundHandlers.moveMap);
        this.emitter.on("ZOOM MAP", this.boundHandlers.zoomMap);
        this.emitter.on("ROTATE MAP", this.boundHandlers.rotateMap);
        this.emitter.on("INFO MAP", this.boundHandlers.infoMap);
        this.emitter.on("DESTROY", this.boundHandlers.destroy);
        this.emitter.on("PLANT TREES", this.boundHandlers.plantTrees);
        this.emitter.on("BUILD MEDIUM", this.boundHandlers.buildMedium);
        this.emitter.on("BUILD LARGE", this.boundHandlers.buildLarge);
        this.emitter.on("BUILD ROAD", this.boundHandlers.buildRoad);
        this.emitter.on("BUILD BIKE LANE", this.boundHandlers.buildBikeLane);
        this.emitter.on("BUILD WIND", this.boundHandlers.buildWind);
        this.emitter.on("BUILD SOLAR", this.boundHandlers.buildSolar);
        this.emitter.on("GO HOME", this.boundHandlers.goHome);
        this.emitter.on("UN DO", this.boundHandlers.undo);
        this.emitter.on("SAVE GAME", this.boundHandlers.saveGame);
    }

    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        if (!this.emitter) return;

        this.emitter.off("MOVE MAP", this.boundHandlers.moveMap);
        this.emitter.off("ZOOM MAP", this.boundHandlers.zoomMap);
        this.emitter.off("ROTATE MAP", this.boundHandlers.rotateMap);
        this.emitter.off("INFO MAP", this.boundHandlers.infoMap);
        this.emitter.off("DESTROY", this.boundHandlers.destroy);
        this.emitter.off("PLANT TREES", this.boundHandlers.plantTrees);
        this.emitter.off("BUILD MEDIUM", this.boundHandlers.buildMedium);
        this.emitter.off("BUILD LARGE", this.boundHandlers.buildLarge);
        this.emitter.off("BUILD ROAD", this.boundHandlers.buildRoad);
        this.emitter.off("BUILD BIKE LANE", this.boundHandlers.buildBikeLane);
        this.emitter.off("BUILD WIND", this.boundHandlers.buildWind);
        this.emitter.off("BUILD SOLAR", this.boundHandlers.buildSolar);
        this.emitter.off("GO HOME", this.boundHandlers.goHome);
        this.emitter.off("UN DO", this.boundHandlers.undo);
        this.emitter.off("SAVE GAME", this.boundHandlers.saveGame);
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const keyboard = this.scene.input.keyboard;

        // Arrow keys for camera panning (step-based, not continuous)
        // Works anytime, not just in move mode
        const panStep = 2; // Pixels to move per key press

        keyboard.on('keydown-LEFT', () => {
            if (this.scene.mapContainer) {
                this.scene.mapContainer.x += panStep;
                console.log(`⬅️ Arrow LEFT - Container: (${this.scene.mapContainer.x.toFixed(1)}, ${this.scene.mapContainer.y.toFixed(1)})`);
            }
        });
        keyboard.on('keydown-RIGHT', () => {
            if (this.scene.mapContainer) {
                this.scene.mapContainer.x -= panStep;
                console.log(`➡️ Arrow RIGHT - Container: (${this.scene.mapContainer.x.toFixed(1)}, ${this.scene.mapContainer.y.toFixed(1)})`);
            }
        });
        keyboard.on('keydown-UP', () => {
            if (this.scene.mapContainer) {
                this.scene.mapContainer.y += panStep;
                console.log(`⬆️ Arrow UP - Container: (${this.scene.mapContainer.x.toFixed(1)}, ${this.scene.mapContainer.y.toFixed(1)})`);
            }
        });
        keyboard.on('keydown-DOWN', () => {
            if (this.scene.mapContainer) {
                this.scene.mapContainer.y -= panStep;
                console.log(`⬇️ Arrow DOWN - Container: (${this.scene.mapContainer.x.toFixed(1)}, ${this.scene.mapContainer.y.toFixed(1)})`);
            }
        });

        // SPACE = Info mode (hold to activate, release to deactivate)
        keyboard.on('keydown-SPACE', () => this.handleInfoMap());
        keyboard.on('keyup-SPACE', () => this.handleInfoMapRelease());

        // + (PLUS) = Zoom in
        keyboard.on('keydown-PLUS', () => this.handleZoomIn());
        keyboard.on('keydown-EQUALS', () => this.handleZoomIn()); // = key (same as + without shift)

        // - (MINUS) = Zoom out
        keyboard.on('keydown-MINUS', () => this.handleZoomOut());
        keyboard.on('keydown-UNDERSCORE', () => this.handleZoomOut()); // _ key (same as - with shift)

        // R = Rotate
        keyboard.on('keydown-R', () => this.handleRotateMap());

        // F = Go Home (center)
        keyboard.on('keydown-F', () => this.handleGoHome());

        // D = Bulldoze/Destroy
        keyboard.on('keydown-D', () => this.handleDestroy());

        // Undo/Redo
        keyboard.on('keydown-U', () => this.scene.undoState());
        keyboard.on('keydown-Q', () => this.scene.redoState());

        // Save - Cmd+S (Mac) or Ctrl+S (Windows/Linux)
        keyboard.on('keydown-S', (event) => {
            // Check if Cmd (Mac) or Ctrl (Windows/Linux) is held
            if (event.metaKey || event.ctrlKey) {
                event.preventDefault(); // Prevent browser's default save dialog
                this.handleSaveGame();
            }
        });
    }

    /**
     * Update method - currently unused but kept for future continuous input needs
     */
    update() {
        // Arrow keys now use step-based movement (keydown events)
        // No continuous update needed
    }

    // ============================================
    // EVENT HANDLERS - Building Tools
    // ============================================

    handleBuildSolar() {
        console.log('🔘 Solar button clicked - calling setTool');
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            newTile: 'power:plant (solar)',
            solar: true,
            frameNumber: 0
        });
        console.log(`🔘 After setTool - destroy: ${this.scene.gameState.destroy}, newTile: ${this.scene.gameState.newTile}, solar: ${this.scene.gameState.solar}`);
    }

    handleBuildWind() {
        console.log('🔘 Wind button clicked - calling setTool');
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            newTile: 'wind',
            wind: true,
            frameNumber: 0
        });
        console.log(`🔘 After setTool - destroy: ${this.scene.gameState.destroy}, newTile: ${this.scene.gameState.newTile}, wind: ${this.scene.gameState.wind}`);
    }

    handlePlantTrees() {
        console.log('🔘 Trees button clicked - calling setTool');
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            newTile: 'wood',
            trees: true,
            frameNumber: 0
        });
        console.log(`🔘 After setTool - destroy: ${this.scene.gameState.destroy}, newTile: ${this.scene.gameState.newTile}, trees: ${this.scene.gameState.trees}`);
    }

    handleBuildMedium() {
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            mediumTile: true,
            newTile: 'green_apartments',
            frameNumber: 0
        });
    }

    handleBuildLarge() {
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            mediumTile: true,
            largeTile: true,
            newTile: 'hydrogen',
            frameNumber: 0
        });
    }

    handleBuildRoad() {
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            newTile: 'road',
            road: true,
            frameNumber: 0
        });
    }

    handleBuildBikeLane() {
        this.scene.gameState.setTool({
            placeTile: true,
            smallTile: true,
            newTile: 'road',
            bike: true,
            frameNumber: 0
        });
    }

    handleDestroy() {
        console.log('🔘 Bulldoze button clicked - calling setTool');
        this.scene.gameState.setTool({
            smallTile: true,
            destroy: true,
            newTile: 'destroy',
            frameNumber: 0
        });
        console.log(`🔘 After setTool - destroy: ${this.scene.gameState.destroy}, newTile: ${this.scene.gameState.newTile}`);
    }

    // ============================================
    // EVENT HANDLERS - Map Navigation
    // ============================================

    handleMoveMap() {
        console.log('🗺️ Move map handler called');
        this.scene.gameState.resetAllModes();
        this.scene.gameState.moveBool = true;
    }

    handleZoomMap() {
        console.log('🔍 Zoom map handler called');
        const camGame = this.scene.cameras.main;

        // Define zoom levels (same as wheel zoom)
        const zoomLevels = [1, 2, 3, 4, 5, 6, 7, 8];

        // Find current zoom level index
        let currentIndex = zoomLevels.findIndex(level => level === Math.round(camGame.zoom));

        // If not found, find closest
        if (currentIndex === -1) {
            currentIndex = zoomLevels.reduce((prev, curr, idx) => {
                return Math.abs(curr - camGame.zoom) < Math.abs(zoomLevels[prev] - camGame.zoom) ? idx : prev;
            }, 0);
        }

        // Cycle to next zoom level (wrap around to 0 if at end)
        const newIndex = (currentIndex + 1) % zoomLevels.length;
        const newZoom = zoomLevels[newIndex];

        // Apply zoom
        camGame.setZoom(newZoom);

        // Scale background inversely so it doesn't zoom
        if (this.scene.bkgd) {
            this.scene.bkgd.setScale(4 / newZoom);
        }
    }

    handleZoomIn() {
        console.log('🔍➕ Zoom in handler called');
        const camGame = this.scene.cameras.main;
        const zoomLevels = [1, 2, 3, 4, 5, 6, 7, 8];

        // Find current zoom level index
        let currentIndex = zoomLevels.findIndex(level => level === Math.round(camGame.zoom));

        // If not found, find closest
        if (currentIndex === -1) {
            currentIndex = zoomLevels.reduce((prev, curr, idx) => {
                return Math.abs(curr - camGame.zoom) < Math.abs(zoomLevels[prev] - camGame.zoom) ? idx : prev;
            }, 0);
        }

        // Zoom in (increase index, clamped to max)
        const newIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
        const newZoom = zoomLevels[newIndex];

        // Apply zoom
        camGame.setZoom(newZoom);

        // Scale background inversely
        if (this.scene.bkgd) {
            this.scene.bkgd.setScale(4 / newZoom);
        }

        console.log(`   Zoom: ${camGame.zoom} (level ${newIndex + 1}/${zoomLevels.length})`);
    }

    handleZoomOut() {
        console.log('🔍➖ Zoom out handler called');
        const camGame = this.scene.cameras.main;
        const zoomLevels = [1, 2, 3, 4, 5, 6, 7, 8];

        // Find current zoom level index
        let currentIndex = zoomLevels.findIndex(level => level === Math.round(camGame.zoom));

        // If not found, find closest
        if (currentIndex === -1) {
            currentIndex = zoomLevels.reduce((prev, curr, idx) => {
                return Math.abs(curr - camGame.zoom) < Math.abs(zoomLevels[prev] - camGame.zoom) ? idx : prev;
            }, 0);
        }

        // Zoom out (decrease index, clamped to min)
        const newIndex = Math.max(currentIndex - 1, 0);
        const newZoom = zoomLevels[newIndex];

        // Apply zoom
        camGame.setZoom(newZoom);

        // Scale background inversely
        if (this.scene.bkgd) {
            this.scene.bkgd.setScale(4 / newZoom);
        }

        console.log(`   Zoom: ${camGame.zoom} (level ${newIndex + 1}/${zoomLevels.length})`);
    }

    handleRotateMap() {
        console.log('🔄 Rotate map handler called');
        console.log(`   isRotating flag: ${this.scene.isRotating}`);
        console.log(`   Stack trace:`, new Error().stack);

        // Check if already rotating (prevent double-rotation)
        if (this.scene.isRotating) {
            console.log('⚠️ Already rotating - ignoring');
            return;
        }

        // Check if grid dimensions are available (set as soon as map starts loading)
        if (!this.scene.gridWidth) {
            console.log('⚠️ Cannot rotate: grid dimensions not yet set');
            return;
        }

        // Check if we have any tiles to rotate
        if (this.scene.mapTiles.length === 0) {
            console.log('⚠️ Cannot rotate: no tiles loaded yet');
            return;
        }

        console.log(`🔄 Rotating grid: ${this.scene.gridWidth}x${this.scene.gridHeight} with ${this.scene.mapTiles.length} tiles`);

        // Execute rotation immediately (don't set as a toggle mode)
        this.scene.rotateMapClockwise();

        // Reset rotateBool after rotation completes
        this.scene.gameState.rotateBool = false;
    }

    handleInfoMap() {
        this.scene.gameState.resetAllModes();
        this.scene.gameState.infoBool = true;
    }

    handleInfoMapRelease() {
        this.scene.gameState.infoBool = false;

        // Clear the landuse info display when releasing spacebar
        if (this.scene.infoTextElement) {
            // Clear typewriter interval if active
            if (this.scene.landuseTypewriterInterval) {
                clearInterval(this.scene.landuseTypewriterInterval);
                this.scene.landuseTypewriterInterval = null;
            }
            this.scene.infoTextElement.textContent = '';
            this.scene.infoTextElement.classList.remove('show');
        }

        // Reset all tile alphas to normal
        if (this.scene.mapTiles) {
            this.scene.mapTiles.forEach(mapTex => {
                if (mapTex) mapTex.alpha = 1.0;
            });
        }
    }

    handleGoHome() {
        this.scene.gameState.homeBool = true;

        console.log(`🏠 Center (F key) pressed`);
        console.log(`   Container BEFORE: (${this.scene.mapContainer.x.toFixed(1)}, ${this.scene.mapContainer.y.toFixed(1)})`);

        // Center map immediately
        if (this.scene.mapContainer) {
            this.scene.mapContainer.x = 0;
            this.scene.mapContainer.y = 0;
            console.log(`   Container AFTER: (${this.scene.mapContainer.x.toFixed(1)}, ${this.scene.mapContainer.y.toFixed(1)})`);
        }

        // Reset camera zoom to 4
        const camGame = this.scene.cameras.main;
        if (camGame) {
            const oldZoom = camGame.zoom;
            camGame.setZoom(4);
            console.log(`   Zoom: ${oldZoom} → 4`);

            // Scale background inversely so it doesn't zoom
            if (this.scene.bkgd) {
                this.scene.bkgd.setScale(4 / 4); // = 1
            }
        }
    }

    // ============================================
    // EVENT HANDLERS - Other Actions
    // ============================================

    handleUndo() {
        console.log("Moving back to previous state");
        this.scene.undoState();
    }

    handleSaveGame() {
        console.log("💾 Manual save triggered");
        this.scene.saveGameToLocalStorage();
    }

    /**
     * Cleanup method - call when scene is destroyed
     */
    destroy() {
        this.removeEventListeners();
        this.emitter = null;
        this.scene = null;
    }
}
