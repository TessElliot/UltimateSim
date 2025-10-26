import { GameState } from "../utils/GameState.js";
import { InputManager } from "../managers/InputManager.js";
import { SaveLoadManager } from "../managers/SaveLoadManager.js";
import { RotationHelper } from "../helpers/RotationHelper.js";
import { ClimateManager } from "../managers/ClimateManager.js";
import TileManager from "../managers/TileManager.js";
import { RumbleSprite } from "../utils/RumbleSprite.js";
import RumbleDistortionPipeline from "../effects/RumbleDistortionPipeline.js";
import { MapDataService } from "../services/MapDataService.js";
import { processBoundingBoxes } from "../services/os.js";
import { fetchLocation, fetchLatLon } from "../services/os.js";
import { landUseInfo } from "../services/os.js";
import { getLocation } from "../services/location.js";
//import { fetchWeatherAlerts } from "../services/os.js";
import { preloadAssets } from "../helpers/preloadAssets.js";
import { createAnimations } from "../helpers/preloadAssets.js";
import { updateAllRoadPatterns } from "../helpers/connector.js";
import { updateAllRailPatterns } from "../helpers/connector_rail.js";
import { findClimateNumber } from "../helpers/tileUtils.js";
import { applyWaterOnDominantNoDataSide } from "../helpers/tileUtils.js";
import { fixBeachTileFrames } from "../helpers/tileUtils.js";
import { CitySimulation } from "../simulation/CitySimulation.js";
import { EconomySimulation } from "../simulation/EconomySimulation.js";

const backendBaseUrl = "http://localhost:8800";

const spriteWidth = 32;
const spriteHeight = spriteWidth / 2;
const factor = 4;
const boxSize = 0.0026;
const tileWidth = spriteWidth / factor;
const tileHeight = spriteHeight / factor;
const setScale = 1 / factor;

let tileArray = [];
let mapTexArray = [];

const gridToTileKey = new Map();

const city = window.city;
const state = window.state;

let mapTilesWidth = 31;
let mapTilesHeight = mapTilesWidth;

const initialGridSize = mapTilesWidth;
const expandedGridSize = 11;

let isDraggingSprite = false;
let zoomNow = false;
// isLoading variable removed - processing animation now in ClimateManager

let climateNum = 0;
let climateNumArray = [];

const mapOffset = -0.08;

export class GameScene extends Phaser.Scene {
    constructor() {
        super("playingGame");
        this.gameState = new GameState();
        this.inputManager = new InputManager(this);
        this.saveLoadManager = new SaveLoadManager(this);
        this.rotationHelper = new RotationHelper(this, tileWidth, tileHeight);
        this.mapDataService = new MapDataService();
        this.climateManager = new ClimateManager(this);
        this.tileManager = new TileManager(this);
        this.rumbleSprite = new RumbleSprite(this);
        this.getInfo = null;
        this.tileChanges = []; // To store tile modifications
        this.startX = 0;
        this.isFlooding = false;
        this.startY = -6;
        this.mapContainer = null;
        this.tileData = [];
        this.mapTiles = [];
        this.mapTilesPos = [];
        this.mapTilesType = [];
        // Climate text moved to DOM
        this.mapArray = [];
        this.results = [];
        this.spiralState = 0;
        this.mainArray = [];
        this.changeHistory = [];
        this.secondArray = [];
        this.clusters = [];
        this.secondLoad = false;
        this.isaReverting = false;
        this.isRotating = false; // Flag to track rotation state
        this.rotationCount = 0; // Track number of 90° clockwise rotations (0-3)
        this.isLoadingMap = false; // Flag to prevent saveState during map loading

        // Map boundary properties - initialize with large values to allow free movement until boundaries are calculated
        this.mapBoundaries = {
            minX: -10000,
            maxX: 10000,
            minY: -10000,
            maxY: 10000
        };

        // Rotation origin - will be set to the center tile's position
        this.rotationOriginX = null;
        this.rotationOriginY = null;

        // Backward compatibility aliases for history (delegate to SaveLoadManager)
        Object.defineProperty(this, '_history', {
            get: () => this.saveLoadManager.history,
            set: (val) => { this.saveLoadManager.history = val; }
        });
        Object.defineProperty(this, '_historyMax', {
            get: () => this.saveLoadManager.historyMax,
            set: (val) => { this.saveLoadManager.historyMax = val; }
        });
        Object.defineProperty(this, '_redo', {
            get: () => this.saveLoadManager.redoStack,
            set: (val) => { this.saveLoadManager.redoStack = val; }
        });
    }

    preload() {
        preloadAssets(this);
    }

    async create(data) {
        console.log('🎮 GameScene.create() START');
        console.log('🎮 Data parameter:', data);
        console.log('🎮 Data type:', typeof data);
        console.log('🎮 Data.resume?:', data && data.resume);

        // Initialize internal event emitter (for TILE_PLACED, TILE_REMOVED, etc.)
        this.emitter = new Phaser.Events.EventEmitter();

        // Initialize HTML controls (connects HTML/CSS buttons to event system)
        this.htmlControls = new HTMLControls(this.emitter);

        this.mapTiles = [];
        this.mapTilesPos = [];
        this.mapTilesType = [];

        let pX;
        let pY;

        let j;
        let i;

        this.physics;

        var gWidth = this.sys.game.canvas.width;
        var gHeight = this.sys.game.canvas.height;

        //MAIN CAMERA:

        const camGame = this.cameras.main;

        // Check if there's a saved map with >= 900 tiles to determine initial zoom
        let initialZoom = 8;
        let initialBackgroundScale = 0.5;
        const savedMapString = localStorage.getItem("savedMap");
        if (savedMapString) {
            try {
                const savedData = JSON.parse(savedMapString);
                if (savedData && savedData.tiles && savedData.tiles.length >= 900) {
                    initialZoom = 4;
                    initialBackgroundScale = 1;
                    console.log(`📏 Large saved map detected (${savedData.tiles.length} tiles) - using zoom 4`);
                }
            } catch (e) {
                console.warn('Could not parse saved map for zoom calculation:', e);
            }
        }

        camGame.setZoom(initialZoom);
        camGame.setBounds(0, 0, gWidth, gHeight);

        //BACKGROUND:

        this.BackgroundColor = this.add.graphics({
            fillStyle: { color: 0x4e2e22 },
        });
        const Background = new Phaser.Geom.Rectangle(0, 0, 1000, 550);
        this.bkgd = this.add.image(500, 300, "background_image");
        this.bkgd.setScale(initialBackgroundScale); // Scale based on zoom (zoom 4 = scale 1, zoom 8 = scale 0.5)
        this.bkgd.setTint(0x4e2e22);
        this.backgroundImage = this.bkgd;
        this.bkgdProcessing = this.add.image(500, 300, "background_image");
        this.bkgdProcessing.setScale(4);
        this.bkgdProcessing.setTint(0x4e2e22);
        this.BackgroundColor.fillRectShape(Background);

        // Show navigation after background is set up
        if (window.showNavigation) {
            window.showNavigation();
        }

        //LOADING:

        this.textLoad = this.add.text(30, 30, "", {
            color: "#ff6633",
        });
        this.textLoad.setOrigin(0, 0);

        camGame.ignore(this.textLoad);

        camGame.ignore(this.bkgdProcessing);

        // Processing map animation removed - now handled by ClimateManager when score is 0

        //animations
        try {
            createAnimations(this);
        } catch (error) {
            console.error('⚠️ Error creating animations:', error);
            // Continue anyway - animations are not critical for resume
        }

        // Register custom WebGL pipelines
        try {
            this.renderer.pipelines.add('RumbleDistortion', new RumbleDistortionPipeline(this.game));
            console.log('✅ RumbleDistortion pipeline registered');
        } catch (error) {
            console.error('⚠️ Error registering RumbleDistortion pipeline:', error);
        }

        // Get reference to DOM element for info text (tool/mode display)
        this.infoTextElement = document.getElementById('land-use-info');

        // Initialize ClimateManager (now uses DOM element)
        this.climateManager.initialize(this.emitter);

        // CREATE MAP:

        this.mapContainer = this.add.container(0, 0);
        this.mapContainer.sort("y");

        // Initialize input manager so UI buttons are interactive during streaming
        this.inputManager.initialize(this.emitter);

        // ============================================
        // SET UP GLOBAL INPUT HANDLERS EARLY
        // ============================================
        // These must be set up BEFORE tiles are created/made interactive

        this.input.on("pointerdown", function (pointer) {
            console.log('🖱️ Scene pointerdown fired!');
            const isUIClick = this.isPointerOverUI(pointer);
            console.log(`   isDraggingSprite: ${isDraggingSprite}, moveBool: ${this.gameState.moveBool}, isUIClick: ${isUIClick}`);

            // Move mode is arrow-key only - don't respond to pointer
            // Just update info text

            // Update info text with current tool/mode (if NOT clicking on UI buttons)
            if (!isUIClick && this.infoTextElement) {
                const infoText = this.gameState.getInfoText();
                if (infoText) {
                    this.infoTextElement.textContent = infoText;
                    this.infoTextElement.classList.add('show');
                } else {
                    this.infoTextElement.textContent = '';
                    this.infoTextElement.classList.remove('show');
                }
            }
        }, this);

        this.input.on("pointerup", function () {
            if (this.tempSprite) {
                // to stop dragging the sprite as well
                isDraggingSprite = false;
            }
        }, this);

        console.log('✅ Input handlers set up');

        // Check if this is a resume or new game
        if (data && data.resume) {
            console.log('💾 RESUME: data.resume is true - calling loadMap()');
            try {
                await this.loadMap();
            } catch (error) {
                console.error("❌ ERROR loading saved map:", error);
                console.error(error.stack);
            }
        } else {
            // Start new game
            console.log('🆕 NEW GAME: Starting new game');
            try {
                await this.startNewGame(boxSize, mapTilesWidth, mapTilesHeight);
            } catch (error) {
                console.error("❌ ERROR in create method:", error);
                console.error(error.stack);
            }
        }
        //// line for proper tile placement
        this.mapContainer.sort("y");

        let mapX = gWidth / 2 + mapTilesWidth * factor;
        let mapY = gHeight / 2;

        // Clean up loading text if it still exists (may have been destroyed earlier)
        if (this.textLoad && this.textLoad.active) {
            this.textLoad.destroy();
        }

        //change starting camera zoom
        if (mapTilesWidth >= 20) {
            camGame.setZoom(4);
            this.bkgd.setScale(1);
        } else if (mapTilesWidth >= 50) {
            camGame.setZoom(2);
            this.bkgd.setScale(2);
        } else if (mapTilesWidth >= 100) {
            camGame.setZoom(1);
            bkgd.setScale(4);
        }
        let startZoom = camGame.zoom;

        //CLIMATE NUMBER CALC:
        this.updateClimateScore();

        // initialise city simulation module
        this.citySim = new CitySimulation(this, gWidth);

        // economy / budget system (depends on citySim for surplus info)
        this.economySim = new EconomySimulation(this, this.citySim, gWidth);

        // Track medium-tile orientation (0-3)
        this.rotationStep = 0;

        this.addTileListeners();

        if (this.buildingDropdown) {
            this.add.existing(this.buildingDropdown);
            this.buildingDropdown.setScrollFactor(0);

            // Use the same approach as your GameBar/UI elements
            const camGame = this.cameras.main;
            camGame.ignore(this.buildingDropdown);
        }

        this.input.keyboard.on("keydown-T", () => {
            this.startRandomTornado(30, 150);
        });

        // ============================================
        // KEYBOARD INPUTS
        // ============================================
        // Note: All keyboard shortcuts (including arrow keys) are now handled by InputManager
        // setupKeyboardShortcuts() which is called during inputManager.initialize()

        const o = this.input.keyboard.addKey("O");

        o.on("up", () => {
            if (window.toggleFullscreen) {
                window.toggleFullscreen();
            }
        });

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const camGame = this.cameras.main;

            // Define zoom levels (whole numbers)
            const zoomLevels = [1, 2, 3, 4, 5, 6, 7, 8];

            const isTrackpad = Math.abs(deltaY) < 50;

            if (isTrackpad) {
                // Ignore trackpad scroll
                return;
            }

            // Find current zoom level index
            let currentIndex = zoomLevels.findIndex(level => level === Math.round(camGame.zoom));

            // If not found (shouldn't happen), find closest
            if (currentIndex === -1) {
                currentIndex = zoomLevels.reduce((prev, curr, idx) => {
                    return Math.abs(curr - camGame.zoom) < Math.abs(zoomLevels[prev] - camGame.zoom) ? idx : prev;
                }, 0);
            }

            // Determine direction and get next level
            let newIndex;
            if (deltaY > 0) {
                // Scroll down = zoom out (decrease index)
                newIndex = Math.max(0, currentIndex - 1);
            } else {
                // Scroll up = zoom in (increase index)
                newIndex = Math.min(zoomLevels.length - 1, currentIndex + 1);
            }

            const newZoom = zoomLevels[newIndex];

            // Only zoom if level changed
            if (newZoom !== camGame.zoom) {
                camGame.setZoom(newZoom);

                if (this.bkgd) {
                    this.bkgd.setScale(4 / newZoom);
                }
            }
        });

        // ============================================
        // UI TEXT ELEMENTS (Responsive Positioning)
        // ============================================

        // Land use info text already created early (line 205) so it exists when tiles become interactive
    }

    async startNewGame(boxSize, mapTilesWidth, mapTilesHeight) {
        const latlon = getLocation();
        const { lat, lon } = latlon;

        // =====================================================
        // STEP 1: Check crowd-sourced database
        // =====================================================
        const dbMapData = await this.mapDataService.checkDatabaseForMap(lat, lon);

        if (dbMapData) {
            // Map found in database - load instantly!
            await this.loadMapFromDatabase(dbMapData);
            return;
        }

        // =====================================================
        // STEP 1.5: Check saved maps database (backend)
        // =====================================================
        try {
            const response = await fetch(`${backendBaseUrl}/api/saved-maps/check`);
            if (response.ok) {
                const result = await response.json();
                if (result.exists && result.mapData) {
                    console.log('💾 Found saved map in backend database - loading...');
                    await this.loadMap();
                    return;
                }
            }
        } catch (error) {
            console.log('ℹ️ No saved map found in backend database:', error.message);
            // Continue to OSM fetch
        }

        // =====================================================
        // STEP 2: Not in database - fetch from OpenStreetMap
        // =====================================================
        await this.fetchLocationAndBoundingBoxes(
            boxSize,
            mapTilesWidth,
            mapTilesHeight
        );
    }

    async checkLocationChoice() {
        if (window.locationChoice === "current") {
            return "current";
        } else if (window.locationChoice === "manual") {
            return "manual";
        } else {
            return null;
        }
    }

    layTilesOnPlayboard(tileType, x, y, box) {
        const { id } = box;

        // Check if this tile has a change recorded
        const existingChange = this.tileChanges.find((tile) => tile.id === id);
        let finalTileType = existingChange ? existingChange.newTileType : tileType;

        // Debug: Log when we find a tileChange
        if (existingChange) {
            console.log(`🔄 Applying tileChange: ID ${id} changed from "${tileType}" to "${finalTileType}"`);
        }

        this.tileData.push({ box, finalTileType });

        // 🆕 FIND EXISTING TILE by ID (instead of creating new one)
        // Tile IDs are based on lat/lon and don't change with rotation,
        // so we can match directly by ID regardless of rotation state

        const existingTileIndex = this.mapTiles.findIndex(t => t.id === id);

        if (existingTileIndex !== -1) {
            // Update existing null tile with real data
            const tile = this.mapTiles[existingTileIndex];

            // Update texture
            tile.setTexture(finalTileType);

            // Update origin for special tiles
            if (finalTileType === "green_apartments") {
                console.log(`🏢 Setting medium tile origin for tile ID ${id} at position (${tile.x}, ${tile.y})`);
                tile.setOrigin(0.25, 0.47);
            } else {
                tile.setOrigin(0.5, 0.5);
            }

            // Play animation
            if (this.anims.exists(finalTileType)) {
                tile.play({ key: finalTileType, randomFrame: true });
            }

            // Make interactive if not already
            if (!tile.input) {
                tile.setInteractive({
                    pixelPerfect: true,
                    alphaTolerance: 1,
                });
            }

            // Mark as no longer null
            tile.isNullTile = false;

            // Update mapTilesType array
            this.mapTilesType[existingTileIndex] = finalTileType;

            updateAllRoadPatterns(this);
            updateAllRailPatterns(this);
        } else {
            // Tile not found - shouldn't happen with pre-created grid
            console.warn(`⚠️ Tile ID ${id} not found in pre-created grid`);
            console.warn(`   Coords: (${x},${y}), Rotation: ${this.rotationCount}`);
            console.warn(`   Skipping tile to prevent duplicates`);
        }
    }

    async fetchLocationAndBoundingBoxes(boxSize, mapTilesWidth, mapTilesHeight) {
        const locationData = await fetchLatLon();

        if (!locationData) {
            throw new Error("No location data available.");
        }

        this.minLat = parseFloat(locationData.minLat);
        this.minLon = parseFloat(locationData.minLon);

        // Grid-align coordinates (same as os.js processBoundingBoxes does)
        const gridLat = Math.round(this.minLat / boxSize) * boxSize;
        const gridLon = Math.round(this.minLon / boxSize) * boxSize;

        const initialBox = {
            minLat: parseFloat(gridLat.toFixed(6)),
            minLon: parseFloat(gridLon.toFixed(6)),
            maxLat: parseFloat((gridLat + boxSize).toFixed(6)),
            maxLon: parseFloat((gridLon + boxSize).toFixed(6)),
        };

        // 🆕 Pre-check if location is in database
        let inDatabase = false;
        try {
            const response = await fetch(`${backendBaseUrl}/closestBbox?lat=${this.minLat}&lon=${this.minLon}`);

            if (!response.ok) {
                inDatabase = false;
            } else {
                const testBox = await response.json();

                if (testBox && testBox.length > 0) {
                    const distance = Math.sqrt(
                        Math.pow(testBox[0].minLat - this.minLat, 2) +
                        Math.pow(testBox[0].minLon - this.minLon, 2)
                    );

                    // If match is within reasonable distance (0.1 degrees ≈ 11km)
                    inDatabase = distance < 0.01;
                }
            }
        } catch (error) {
            inDatabase = false;
        }

        // 🆕 Adjust grid size based on database availability
        let adjustedWidth = mapTilesWidth;
        let adjustedHeight = mapTilesHeight;

        if (!inDatabase) {
            adjustedWidth = 10;  // Use 10x10 for Overpass
            adjustedHeight = 10;
        }

        // Store grid dimensions for features like rotation during streaming
        this.gridWidth = adjustedWidth;
        this.gridHeight = adjustedHeight;

        this.mainArray = await this.renderGridInSpiral(
            initialBox,
            adjustedWidth,
            adjustedHeight,
            boxSize
        );

        this.mapContainer.sort("y");
        applyWaterOnDominantNoDataSide(this);
    }

    filterNonAdjacentBeaches() {
        const beachLikeTypes = new Set(["beach", "coastline"]);
        const waterTypes = new Set(["water", "reservoir"]);

        for (let tile of this.mapTiles) {
            if (beachLikeTypes.has(tile.texture.key)) {
                let isAdjacentToWater = false;

                const neighbors = this.getNeighborsForTile(tile, this);
                for (const neighbor of neighbors) {
                    if (waterTypes.has(neighbor.texture.key)) {
                        isAdjacentToWater = true;
                        break;
                    }
                }

                if (!isAdjacentToWater) {
                    tile.setTexture("wood");
                    if (this.anims.exists("wood")) {
                        tile.play({ key: "wood", randomFrame: true });
                    }
                }
            }
        }
    }

    /**
     * Calculate the starting position (anchor point) for the isometric grid
     * This ensures consistent positioning across all grid creation/loading functions
     * @param {number} gridHeight - Height of the grid in tiles
     * @returns {object} Object with startX and startY properties
     */
    calculateGridStart(gridHeight) {
        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;
        const isoGridHeight = gridHeight * tileHeight;

        // Account for artwork offset: sprite origin is (0.5, 0.5) but artwork is 8px higher
        const artworkOffsetY = 8; // spriteHeight / 2
        const userOffsetY = -6; // User adjustment to shift grid up

        return {
            startX: gWidth / 2,
            startY: (gHeight / 2) - (isoGridHeight / 2) + artworkOffsetY + userOffsetY
        };
    }

    /**
     * Pre-create the entire grid with null tiles
     * This allows rotation and other features to work on a complete grid
     * Data will stream in and replace null tiles with actual OSM data
     */
    createNullGrid(gridWidth, gridHeight, initialBox, boxSize) {
        try {
            // Use centralized grid start calculation
            const gridStart = this.calculateGridStart(gridHeight);
            this.startX = gridStart.startX;
            this.startY = gridStart.startY;

            // Use null texture as transparent placeholder
            const placeholderTexture = "null";

            // Check if texture exists
            if (!this.textures.exists(placeholderTexture)) {
                const fallbackTexture = "ground";
                if (!this.textures.exists(fallbackTexture)) {
                    console.error(`❌ Neither "${placeholderTexture}" nor "${fallbackTexture}" texture exists! Aborting.`);
                    return;
                }
            }

        // Create all tiles in the grid with placeholder texture
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                // Calculate isometric position
                let isoX = this.startX + (x - y) * (tileWidth / 2);
                let isoY = this.startY + (x + y) * (tileHeight / 2);

                // Create placeholder tile sprite
                let tile = this.add.sprite(isoX, isoY, placeholderTexture);

                tile.setScale(setScale);
                tile.setOrigin(0.5, 0.5);
                tile.smoothed = false;

                // Play animation if it exists
                if (this.anims.exists(placeholderTexture)) {
                    tile.play({ key: placeholderTexture, randomFrame: true });
                }

                // Generate unique ID for this grid position
                // IMPORTANT: Must match the spiral pattern calculation in os.js generateSpiralBoundingBoxes
                // Spiral centers the grid by subtracting floor(count/2)
                const centerOffsetY = Math.floor(gridHeight / 2);
                const centerOffsetX = Math.floor(gridWidth / 2);
                const minLat = initialBox.minLat + (y - centerOffsetY) * boxSize;
                const minLon = initialBox.minLon + (x - centerOffsetX) * boxSize;
                const maxLat = minLat + boxSize;
                const maxLon = minLon + boxSize;
                const id = `${minLat.toFixed(6)}_${minLon.toFixed(6)}_${maxLat.toFixed(6)}_${maxLon.toFixed(6)}`;

                // Store grid coordinates and ID
                tile.id = id;
                tile.gridX = x;
                tile.gridY = y;
                tile.isNullTile = true; // Mark as placeholder tile

                // Check if this is the center tile (dynamically calculated based on grid size)
                const centerX = Math.floor(gridWidth / 2);
                const centerY = Math.floor(gridHeight / 2);
                if (x === centerX && y === centerY) {
                    console.warn(`   Center tile (${centerX},${centerY}) ID: ${id}`);
                    // Store rotation origin as the center tile's position
                    this.rotationOriginX = isoX;
                    this.rotationOriginY = isoY;
                    console.log(`🎯 Rotation origin set to center tile: (${isoX.toFixed(1)}, ${isoY.toFixed(1)})`);
                }

                // Store tileKey for land use lookups
                const tileKey = `${minLat.toFixed(6)}_${minLon.toFixed(6)}`;
                gridToTileKey.set(`${x}_${y}`, tileKey);

                // Add to container and arrays
                this.mapContainer.add(tile);
                this.mapTiles.push(tile);
                this.mapTilesPos.push(`${isoX}, ${isoY}`);
                this.mapTilesType.push(placeholderTexture);
            }
        }

        } catch (error) {
            console.error(`❌ Error in createNullGrid:`, error);
            console.error(error.stack);
        }
    }

    async renderGridInSpiral(initialBox, gridWidth, gridHeight, boxSize) {
        console.log('🚀 renderGridInSpiral STARTED', {gridWidth, gridHeight, boxSize});

        // Set grid dimensions first
        mapTilesWidth = gridWidth;
        mapTilesHeight = gridHeight;

        // Use centralized grid start calculation
        const gridStart = this.calculateGridStart(gridHeight);
        this.startX = gridStart.startX;
        this.startY = gridStart.startY;

        // 🏗️ PRE-CREATE FULL GRID WITH NULL TILES
        this.createNullGrid(gridWidth, gridHeight, initialBox, boxSize);

        const tileData = [];
        const tileTypesArray = [];
        let tilesRendered = 0;
        let listenersActivated = false;
        const EARLY_ACTIVATION_THRESHOLD = 1; // Enable tile interaction as soon as first tile renders
        const INCREMENTAL_PROCESSING_INTERVAL = 75;

        // 🌊 Process the generator and render tiles AS THEY ARRIVE
        for await (const result of processBoundingBoxes(
            initialBox,
            gridWidth,
            gridHeight
        )) {
            // Skip metadata yield (first result)
            if (result.mode) {

                // Update loading text if using Overpass
                if (result.useOverpass && this.loadingText) {
                    const estimatedMinutes = Math.round(result.totalTiles / 60);
                    this.loadingText.setText(
                        `Loading from OpenStreetMap\n` +
                        `This may take ~${estimatedMinutes} minutes\n` +
                        `Streaming tiles as they arrive...`
                    );
                }
                continue;
            }

            // Destructure tile data
            const { tileType, box } = result;

            if (!box) {
                continue;
            }

            // 🎮 RENDER IMMEDIATELY as data arrives from OSM!
            this.layTilesOnPlayboard(tileType, box.x, box.y, box);
            this.mapContainer.sort("y");

            tileData.push({ box, tileType });
            tileTypesArray.push({
                x: box.x,
                y: box.y,
                type: tileType,
            });

            tilesRendered++;

            // 🎮 Add listeners to newly rendered tiles during streaming
            if (!listenersActivated && tilesRendered >= EARLY_ACTIVATION_THRESHOLD) {
                // First time: set up ALL tiles rendered so far
                this.addTileListeners();
                listenersActivated = true;

                // Show navigation as soon as first tiles are rendered
                console.log('🎮 First tiles rendered - showing navigation');
                if (window.showNavigation) {
                    console.log('✅ Calling window.showNavigation() early');
                    window.showNavigation();
                } else {
                    console.error('❌ window.showNavigation not found!');
                }

                // Processing map text removed - no longer used

                // HTML/CSS buttons now used instead of Phaser UIScene
                // (Phaser UI kept hidden - see line 250)

                // Update climate score immediately when first tile appears
                this.climateManager.recalculateScore();

                // Initialize TileManager for base hover interactions
                this.tileManager.initialize();
            } else if (listenersActivated) {
                // After activation: add listener to just the newest tile
                const newestTile = this.mapTiles[this.mapTiles.length - 1];
                if (newestTile) {
                    this.addListenerToTile(newestTile);
                }

                // Update climate score every tile during streaming to see it change in real-time
                this.climateManager.recalculateScore();
            }

            // 🔄 Incremental processing every N tiles
            if (tilesRendered % INCREMENTAL_PROCESSING_INTERVAL === 0) {
                updateAllRoadPatterns(this);
                updateAllRailPatterns(this);

                // Yield control back to Phaser for UI updates
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            // Yield control periodically to allow UI updates
            if (tilesRendered % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // 🏁 Final processing pass after ALL tiles loaded
        // Mark loading as complete
        this.gameState.isLoading = false;
        this.isLoadingMap = false;

        console.log('🎮 renderGridInSpiral complete - about to show navigation');
        // Show navigation now that game scene is loaded
        if (window.showNavigation) {
            console.log('✅ Calling window.showNavigation()');
            window.showNavigation();
        } else {
            console.error('❌ window.showNavigation not found!');
        }

        updateAllRoadPatterns(this);
        updateAllRailPatterns(this);
        fixBeachTileFrames(this);
        this.filterNonAdjacentBeaches();
        this.climateManager.recalculateScore();
        this.calculateMapBoundaries();

        // Map the tileData to simplified format
        // IMPORTANT: Use gridX/gridY from the actual tile sprites, NOT box.x/box.y from spiral
        // The spiral algorithm can produce coordinates outside grid bounds (e.g., x=30 for 30x30 grid)
        const simplifiedTileData = tileData.map(({ box, tileType }) => {
            // Find the actual tile sprite by ID to get correct grid coordinates
            const tile = this.mapTiles.find(t => t.id === box.id);
            if (!tile) {
                console.warn(`⚠️ Tile not found when saving: ${box.id}`);
                return {
                    x: box.x,
                    y: box.y,
                    id: box.id,
                    tileType: tileType,
                };
            }

            return {
                x: tile.gridX,  // Use actual grid coordinate (0-29 for 30x30 grid)
                y: tile.gridY,  // Use actual grid coordinate (0-29 for 30x30 grid)
                id: box.id,
                tileType: tileType,
            };
        });

        const mapData = {
            tiles: simplifiedTileData,
            gridWidth: gridWidth,
            gridHeight: gridHeight,
            tileChanges: [],
            landUseInfo: Object.fromEntries(landUseInfo.entries()),
        };

        // Save as original map (only if it doesn't exist yet)
        if (!localStorage.getItem("originalMap")) {
            localStorage.setItem("originalMap", JSON.stringify(mapData));
            console.log("Original map saved to localStorage");
        }

        // Save to localStorage (with player's changes)
        const mapDataForStorage = {
            tiles: simplifiedTileData,
            gridWidth: gridWidth,
            gridHeight: gridHeight,
            tileChanges: this.tileChanges,
            landUseInfo: Object.fromEntries(landUseInfo.entries()),
        };

        localStorage.setItem("savedMap", JSON.stringify(mapDataForStorage));

        // =====================================================
        // Save to crowd-sourced database for future players!
        // =====================================================
        const latlon = getLocation();
        const { lat, lon } = latlon;

        this.mapDataService.saveMapToDatabase(lat, lon, mapData);

        return tileTypesArray;
    }

    startRandomTornado(steps = 20, delay = 200) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
        ];

        let x = Phaser.Math.Between(0, mapTilesWidth - 1);
        let y = Phaser.Math.Between(0, mapTilesHeight - 1);

        const tornadoSprite = this.add.sprite(0, 0, "tornado").play("tornado_spin");
        tornadoSprite.setDepth(1000); // above all
        tornadoSprite.setScale(setScale); // match other tiles
        tornadoSprite.setOrigin(0.5, 0.5);

        let step = 0;
        const moveTornado = () => {
            const tile = this.mapTiles.find((t) => t.gridX === x && t.gridY === y);
            if (tile) {
                tornadoSprite.x = tile.x;
                tornadoSprite.y = tile.y;

                // Destroy tile and neighbors
                tile.setTexture("destroy");
                tile.play("bulldozing");

                for (let [nx, ny] of [
                    [x + 1, y],
                    [x - 1, y],
                    [x, y + 1],
                    [x, y - 1],
                ]) {
                    const neighbor = this.mapTiles.find(
                        (t) => t.gridX === nx && t.gridY === ny
                    );
                    if (neighbor) {
                        neighbor.setTexture("destroy");
                        neighbor.play("bulldozing");
                    }
                }
            }

            // Move randomly
            const dir = Phaser.Math.RND.pick(directions);
            x = Phaser.Math.Clamp(x + dir.dx, 0, mapTilesWidth - 1);
            y = Phaser.Math.Clamp(y + dir.dy, 0, mapTilesHeight - 1);

            step++;
            if (step < steps) {
                this.time.delayedCall(delay, moveTornado);
            } else {
                tornadoSprite.destroy(); // Remove sprite after animation

                // Tornado animation complete
                console.log('🌪️ Tornado has finished its path');
            }
        };

        moveTornado();
    }

    clearPlayboard() {
        this.mapTiles.forEach((tile) => tile.destroy());
        this.mapTiles = [];
        this.mapTilesPos = [];
        this.mapTilesType = [];
        this.mapArray = [];
    }

    // Calculate map boundaries to prevent off-screen movement
    calculateMapBoundaries() {
        if (this.mapTiles.length === 0) return;

        const cam = this.cameras.main;
        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;

        // Calculate world size based on camera zoom
        const worldWidth = gWidth / cam.zoom;
        const worldHeight = gHeight / cam.zoom;

        // Find the bounding box of all tiles
        let minTileX = Infinity, maxTileX = -Infinity;
        let minTileY = Infinity, maxTileY = -Infinity;

        this.mapTiles.forEach(tile => {
            minTileX = Math.min(minTileX, tile.x);
            maxTileX = Math.max(maxTileX, tile.x);
            minTileY = Math.min(minTileY, tile.y);
            maxTileY = Math.max(maxTileY, tile.y);
        });

        // Calculate tile dimensions (approximate)
        const tileWidth = 32; // Base tile width
        const tileHeight = 16; // Base tile height

        // Calculate map dimensions
        const mapWidth = maxTileX - minTileX + tileWidth;
        const mapHeight = maxTileY - minTileY + tileHeight;

        // Use very generous fixed boundaries that allow free panning
        // As the map grows, we keep these boundaries very permissive
        // The key is: these values should ONLY get bigger, never smaller
        const generousBoundary = 5000; // Very generous boundary for free panning

        // Only update boundaries if the new values are MORE permissive than current
        const newMinX = -Math.max(mapWidth * 2, generousBoundary);
        const newMaxX = Math.max(worldWidth + mapWidth * 2, generousBoundary);
        const newMinY = -Math.max(mapHeight * 2, generousBoundary);
        const newMaxY = Math.max(worldHeight + mapHeight * 2, generousBoundary);

        // Make boundaries MORE permissive as map grows (never more restrictive)
        this.mapBoundaries.minX = Math.min(this.mapBoundaries.minX, newMinX);
        this.mapBoundaries.maxX = Math.max(this.mapBoundaries.maxX, newMaxX);
        this.mapBoundaries.minY = Math.min(this.mapBoundaries.minY, newMinY);
        this.mapBoundaries.maxY = Math.max(this.mapBoundaries.maxY, newMaxY);

        console.log(`📐 Boundary calculation:
    World: ${worldWidth.toFixed(0)}x${worldHeight.toFixed(0)}
    Map: ${mapWidth.toFixed(0)}x${mapHeight.toFixed(0)}
    Tile range X: ${minTileX.toFixed(0)} to ${maxTileX.toFixed(0)}
    Tile range Y: ${minTileY.toFixed(0)} to ${maxTileY.toFixed(0)}
    Boundaries: X(${this.mapBoundaries.minX.toFixed(0)} to ${this.mapBoundaries.maxX.toFixed(0)}), Y(${this.mapBoundaries.minY.toFixed(0)} to ${this.mapBoundaries.maxY.toFixed(0)})`);
    }

    sortArrayLinearly(array) {
        return [...array].sort((a, b) => {
            if (a.y === b.y) {
                return a.x - b.x; // Sort by x if y is the same
            }
            return a.y - b.y; // Otherwise, sort by y
        });
    }

    async loadMap() {
        this.isLoadingMap = true;
        console.log("🗺️ loadMap() called - Resuming saved game...");
        console.log("🗺️ All localStorage keys:", Object.keys(localStorage));

        const savedMapString = localStorage.getItem("savedMap");
        console.log("🗺️ savedMapString exists?:", savedMapString ? 'YES' : 'NO');
        console.log("🗺️ savedMapString length:", savedMapString ? savedMapString.length : 0);

        // Use centralized grid start calculation
        const gridStart = this.calculateGridStart(mapTilesHeight);
        this.startX = gridStart.startX;
        this.startY = gridStart.startY;

        if (!savedMapString) {
            console.warn("No saved map found. Starting a new game.");
            await this.startNewGame(
                this.boxSize,
                this.mapTilesWidth,
                this.mapTilesHeight
            );
            return;
        }

        try {
            const savedData = JSON.parse(savedMapString);
            //console.log(savedData);

            if (!savedData || !savedData.tiles || !Array.isArray(savedData.tiles)) {
                throw new Error("Loaded map data is invalid or empty.");
            }

            // Restore grid dimensions (both global and scene properties)
            mapTilesWidth = savedData.gridWidth;
            mapTilesHeight = savedData.gridHeight;
            this.gridWidth = savedData.gridWidth;
            this.gridHeight = savedData.gridHeight;

            // Use centralized grid start calculation
            const gridStart = this.calculateGridStart(mapTilesHeight);
            this.startX = gridStart.startX;
            this.startY = gridStart.startY;

            // Restore tileChanges for tracking changes made earlier
            this.tileChanges = savedData.tileChanges || [];

            // Load tile data
            const tileData = savedData.tiles;

            // Restore landUseInfo from localStorage
            if (savedData.landUseInfo) {
                landUseInfo.clear();
                for (const [key, value] of Object.entries(savedData.landUseInfo)) {
                    landUseInfo.set(key, value);
                }
                //console.log("Restored landUseInfo:", landUseInfo.size, "entries");
            }

            // Clear the playboard to prepare for reloading
            this.clearPlayboard();

            // 🏗️ PRE-CREATE NULL GRID (needed for layTilesOnPlayboard to work)
            // Find the CENTER tile to use as the grid reference point
            // The center tile's coordinates define the grid's coordinate system
            if (tileData.length > 0) {
                const centerX = Math.floor(savedData.gridWidth / 2);
                const centerY = Math.floor(savedData.gridHeight / 2);

                console.log(`🎯 Looking for center tile at grid position (${centerX}, ${centerY})`);

                // Find the tile at the center grid position
                const centerTile = tileData.find(t => t.x === centerX && t.y === centerY);

                if (!centerTile) {
                    console.error(`❌ Center tile not found at (${centerX}, ${centerY})! Using first tile as fallback.`);
                    // Fallback to first tile
                    const firstTile = tileData[0];
                    const [minLat, minLon, maxLat, maxLon] = firstTile.id.split('_').map(parseFloat);
                    const boxSize = maxLat - minLat;
                    const initialBox = { minLat, minLon, maxLat, maxLon };
                    this.createNullGrid(savedData.gridWidth, savedData.gridHeight, initialBox, boxSize);
                } else {
                    console.log(`✅ Found center tile: ID ${centerTile.id}`);
                    const [minLat, minLon, maxLat, maxLon] = centerTile.id.split('_').map(parseFloat);
                    const boxSize = maxLat - minLat; // Calculate box size from tile ID

                    // The center tile's bounding box IS the initialBox
                    const initialBox = {
                        minLat: minLat,
                        minLon: minLon,
                        maxLat: maxLat,
                        maxLon: maxLon
                    };

                    console.log(`🏗️ Creating null grid for saved map: ${savedData.gridWidth}×${savedData.gridHeight} centered at ${centerTile.id}`);
                    this.createNullGrid(savedData.gridWidth, savedData.gridHeight, initialBox, boxSize);
                }
            }

            // Load tiles one by one
            let index = 0;
            let listenersActivated = false;
            const EARLY_ACTIVATION_THRESHOLD = 1; // Enable tile interaction immediately

            const loadTile = () => {
                if (index < tileData.length) {
                    const { x, y, tileType, id } = tileData[index];

                    // Debug logging for medium tiles
                    if (tileType === "green_apartments" || (this.tileChanges && this.tileChanges.find(tc => tc.id === id && tc.newTileType === "green_apartments"))) {
                        console.log(`🏢 Loading medium tile ${index}: ${tileType} at (${x}, ${y}), id: ${id}`);
                        const change = this.tileChanges.find(tc => tc.id === id);
                        if (change) {
                            console.log(`   Has tileChange: oldType="${tileType}" → newType="${change.newTileType}"`);
                        }

                        // Find the actual tile in mapTiles to see its current state
                        const gridTile = this.mapTiles.find(t => t.id === id);
                        if (gridTile) {
                            console.log(`   Grid tile found: texture="${gridTile.texture.key}", gridX=${gridTile.gridX}, gridY=${gridTile.gridY}`);
                        } else {
                            console.log(`   ⚠️ Grid tile NOT found for ID: ${id}`);
                        }
                    }

                    // Construct a box object with the id
                    const box = { id, x, y };

                    this.layTilesOnPlayboard(tileType, x, y, box);
                    this.mapContainer.sort("y");

                    if (index % 10 === 0) {
                        this.updateClimateScore();
                    }

                    // 🎮 Enable interaction early - resume saved game
                    if (!listenersActivated && index >= EARLY_ACTIVATION_THRESHOLD) {
                        this.addTileListeners();
                        listenersActivated = true;
                        console.log(`🎮 Map is now interactive! (${index}/${tileData.length} tiles loaded from save)`);
                    }

                    index++;
                    setTimeout(loadTile, 0); // Load next tile after 0ms
                } else {
                    // Ensure tiles are sorted correctly for rendering
                    this.mapContainer.sort("y");
                    this.calculateMapBoundaries();
                    this.updateClimateScore();
                    // InputManager already initialized in create() line 271 - no need to reinitialize
                    // Reset undo/redo history after resume
                    this._history = [];
                    this.saveState(); // Save the current state as the only undo point
                    this._redo = [];
                    this.isLoadingMap = false;
                }
            };

            loadTile();
        } catch (e) {
            console.error("Error loading map data:", e.message);
            alert("Failed to load saved map. Starting a new game.");
            await this.startNewGame(
                this.boxSize,
                this.mapTilesWidth,
                this.mapTilesHeight
            );
        }
    }

    async loadMapFromDatabase(mapData) {
        this.isLoadingMap = true;
        console.log("Loading map from crowd-sourced database...");

        // Use current mapTilesWidth/Height values instead of saved ones
        // This allows changing grid size by updating the variables at the top of the file

        // Use centralized grid start calculation
        const gridStart = this.calculateGridStart(mapTilesHeight);
        this.startX = gridStart.startX;
        this.startY = gridStart.startY;

        // Set grid dimensions using current mapTilesWidth/Height (not saved values)
        this.gridWidth = mapTilesWidth;
        this.gridHeight = mapTilesHeight;

        console.log(`📐 Using grid dimensions: ${mapTilesWidth}x${mapTilesHeight} (ignoring saved ${mapData.gridWidth}x${mapData.gridHeight})`);

        // Reset tileChanges
        this.tileChanges = [];

        // Restore landUseInfo from database
        if (mapData.landUseInfo) {
            landUseInfo.clear();
            for (const [key, value] of Object.entries(mapData.landUseInfo)) {
                landUseInfo.set(key, value);
            }
        }

        // Clear the playboard
        this.clearPlayboard();

        // 🏗️ PRE-CREATE NULL GRID (needed for layTilesOnPlayboard to work)
        // Find the CENTER tile to use as the grid reference point (same as Resume Game logic)
        const tileData = mapData.tiles;
        if (tileData.length > 0) {
            // Use SAVED grid center to find the reference tile
            const savedCenterX = Math.floor(mapData.gridWidth / 2);
            const savedCenterY = Math.floor(mapData.gridHeight / 2);

            console.log(`🎯 Looking for center tile at saved grid position (${savedCenterX}, ${savedCenterY})`);

            // Find the tile at the center grid position
            const centerTile = tileData.find(t => t.x === savedCenterX && t.y === savedCenterY);

            if (!centerTile) {
                console.error(`❌ Center tile not found at (${savedCenterX}, ${savedCenterY})! Using first tile as fallback.`);
                // Fallback to first tile
                const firstTile = tileData[0];
                const [minLat, minLon, maxLat, maxLon] = firstTile.id.split('_').map(parseFloat);
                const boxSize = maxLat - minLat;
                const initialBox = { minLat, minLon, maxLat, maxLon };
                // Use CURRENT mapTilesWidth/Height for the new grid
                this.createNullGrid(mapTilesWidth, mapTilesHeight, initialBox, boxSize);
            } else {
                console.log(`✅ Found center tile: ID ${centerTile.id}`);
                const [minLat, minLon, maxLat, maxLon] = centerTile.id.split('_').map(parseFloat);
                const boxSize = maxLat - minLat; // Calculate box size from tile ID

                // The center tile's bounding box IS the initialBox
                const initialBox = {
                    minLat: minLat,
                    minLon: minLon,
                    maxLat: maxLat,
                    maxLon: maxLon
                };

                console.log(`🏗️ Creating null grid for database map: ${mapTilesWidth}×${mapTilesHeight} (saved was ${mapData.gridWidth}×${mapData.gridHeight}) centered at ${centerTile.id}`);
                // Use CURRENT mapTilesWidth/Height for the new grid
                this.createNullGrid(mapTilesWidth, mapTilesHeight, initialBox, boxSize);
            }
        }

        // Load tiles one by one
        let index = 0;
        let listenersActivated = false;
        const EARLY_ACTIVATION_THRESHOLD = 1; // Enable tile interaction immediately

        const loadTile = () => {
            if (index < tileData.length) {
                const { x, y, tileType, id } = tileData[index];
                const box = { id, x, y };

                this.layTilesOnPlayboard(tileType, x, y, box);
                this.mapContainer.sort("y");

                if (index % 10 === 0) {
                    this.updateClimateScore();
                }

                // 🎮 Enable interaction early - database loads are fast but still benefit from this
                if (!listenersActivated && index >= EARLY_ACTIVATION_THRESHOLD) {
                    this.addTileListeners();
                    listenersActivated = true;
                    console.log(`🎮 Map is now interactive! (${index}/${tileData.length} tiles loaded from database)`);

                    // HTML/CSS buttons now used instead of Phaser UIScene
                    // (Phaser UI kept hidden - see line 250)

                    // Update climate score immediately when first tile appears
                    this.climateManager.recalculateScore();
                }

                index++;
                setTimeout(loadTile, 0);
            } else {
                // 🏁 Finalize map loading
                // Mark loading as complete
                this.gameState.isLoading = false;
                this.isLoadingMap = false;

                this.mapContainer.sort("y");
                updateAllRoadPatterns(this);
                updateAllRailPatterns(this);
                fixBeachTileFrames(this);
                this.filterNonAdjacentBeaches();
                this.calculateMapBoundaries();
                this.updateClimateScore();
                // InputManager already initialized in create() - no need to reinitialize

                // Save to localStorage using MapDataService
                this.mapDataService.saveMapToLocalStorage(mapData, this.tileChanges);
                this.mapDataService.saveOriginalMapToLocalStorage(mapData);

                // Reset undo/redo history
                this._history = [];
                this.saveState();
                this._redo = [];

                console.log("✅ Map loaded from database successfully!");
            }
        };

        loadTile();
    }

    async loadOriginalMap() {
        this.isLoadingMap = true;
        console.log("Loading original map from current location...");

        const originalMapString = localStorage.getItem("originalMap");

        // Use centralized grid start calculation
        const gridStart = this.calculateGridStart(mapTilesHeight);
        this.startX = gridStart.startX;
        this.startY = gridStart.startY;

        if (!originalMapString) {
            console.warn("No original map found. Cannot restore.");
            this.isLoadingMap = false;
            return;
        }

        try {
            const savedData = JSON.parse(originalMapString);

            if (!savedData || !savedData.tiles || !Array.isArray(savedData.tiles)) {
                throw new Error("Original map data is invalid or empty.");
            }

            // Restore grid dimensions
            mapTilesWidth = savedData.gridWidth;
            mapTilesHeight = savedData.gridHeight;

            // Use centralized grid start calculation
            const gridStart = this.calculateGridStart(mapTilesHeight);
            this.startX = gridStart.startX;
            this.startY = gridStart.startY;

            // Reset tileChanges (original map has no changes)
            this.tileChanges = [];

            // Restore landUseInfo from original map
            if (savedData.landUseInfo) {
                landUseInfo.clear();
                for (const [key, value] of Object.entries(savedData.landUseInfo)) {
                    landUseInfo.set(key, value);
                }
            }

            // Load tile data
            const tileData = savedData.tiles;

            // Clear the playboard to prepare for reloading
            this.clearPlayboard();

            // Load tiles one by one
            let index = 0;
            let listenersActivated = false;
            const EARLY_ACTIVATION_THRESHOLD = 1; // Enable tile interaction immediately

            const loadTile = () => {
                if (index < tileData.length) {
                    const { x, y, tileType, id } = tileData[index];

                    // Construct a box object with the id
                    const box = { id, x, y };

                    this.layTilesOnPlayboard(tileType, x, y, box);
                    this.mapContainer.sort("y");

                    if (index % 10 === 0) {
                        this.updateClimateScore();
                    }

                    // 🎮 Enable interaction early - restoring original map
                    if (!listenersActivated && index >= EARLY_ACTIVATION_THRESHOLD) {
                        this.addTileListeners();
                        listenersActivated = true;
                        console.log(`🎮 Map is now interactive! (${index}/${tileData.length} tiles - restoring original)`);
                    }

                    index++;
                    setTimeout(loadTile, 0);
                } else {
                    // Ensure tiles are sorted correctly for rendering
                    this.mapContainer.sort("y");
                    updateAllRoadPatterns(this);
                    updateAllRailPatterns(this);
                    fixBeachTileFrames(this);
                    this.filterNonAdjacentBeaches();
                    this.calculateMapBoundaries();
                    this.updateClimateScore();

                    // Reset undo/redo history after loading original
                    this._history = [];
                    this.saveState(); // Save the original state as the first undo point
                    this._redo = [];
                    this.isLoadingMap = false;

                    console.log("Original map loaded successfully");
                }
            };

            loadTile();
        } catch (e) {
            console.error("Error loading original map data:", e.message);
            this.isLoadingMap = false;
        }
    }

    addListenerToTile(tile) {
        // Register tile with TileManager for all interactions
        const tileIndex = this.mapTiles.indexOf(tile);
        if (tileIndex !== -1 && this.tileManager) {
            this.tileManager.registerTile(tile, tileIndex);
        }
    }

    // Legacy method - kept for reference, now handled by TileInteractionManager
    _oldAddListenerToTile_DEPRECATED(tile) {
        const scene = this; // Scene reference - CRITICAL for accessing gameState

        tile.removeAllListeners(); // Clear any previous listeners

            // ===================================================================
            // POINTEROVER LISTENER
            // ===================================================================
            tile.on("pointerover", function (pointer) {
                // Clear tileArray to start fresh
                tileArray = [];

                var hover = false;

                const pX = this.x;
                const pY = this.y;

                // ✅ FIXED: Use scene.gameState instead of this.gameState
                if (scene.gameState.moveBool || scene.gameState.rotateBool || scene.gameState.zoomBool || scene.gameState.homeBool) {
                    hover = true;
                } else {
                    hover = false;
                }

                const tileKey = `${scene.gridX}_${scene.gridY}`; // Construct the key using gridX and gridY

                let tile0 = scene.mapTiles.indexOf(this);

                let useType = scene.mapArray[tile0];

                let displayClimateNum = findClimateNumber(this.texture.key);

                const landUseTypes = landUseInfo[tile0];

                // ✅ FIXED: Use scene.gameState
                if (scene.gameState.infoBool) {
                    for (let i = 0; i < scene.mapTiles.length; i++) {
                        let mapTex = scene.mapTiles[i];
                        scene.getInfo.text =
                            `Land Use: '` +
                            useType +
                            `' with Climate Impact of: ` +
                            displayClimateNum;
                        mapTex.alpha = 0.2;
                    }
                    this.alpha = 1;

                    const boxId = this.id;
                    const tileId = this.id;

                    const landUseData = landUseInfo.get(tileId);

                    if (landUseData) {
                        const maxAreaType = landUseData.maxAreaType || "unknown";
                        scene.getInfo.text =
                            `Land Use: '` +
                            useType +
                            `' with Climate Impact of: ` +
                            displayClimateNum;
                    } else {
                        //scene.getInfo.text = "No data found.";
                    }
                } else {
                }

                let tilePosArray = [];
                mapTexArray = [];
                tileArray = [];

                // ✅ FIXED: Use scene.gameState
                if (scene.gameState.smallTile) {
                    mapTexArray = [];
                    mapTexArray.push(scene.mapArray[tile0]);
                    tileArray = [];

                    let tile0Pos = pX + ", " + pY;
                    tilePosArray = [];
                    tilePosArray.push(tile0Pos);
                } else {
                }

                // ✅ FIXED: Use scene.gameState
                if (scene.gameState.mediumTile) {
                    let x1 = pX - tileWidth / 2;
                    let y1 = pY - tileHeight / 2;

                    let x2 = pX;
                    let y2 = pY - tileHeight;

                    let x3 = pX + tileWidth / 2;
                    let y3 = pY - tileHeight / 2;

                    let tile1Pos = x1 + ", " + y1;
                    let tile2Pos = x2 + ", " + y2;
                    let tile3Pos = x3 + ", " + y3;

                    tilePosArray.push(tile1Pos, tile2Pos, tile3Pos);
                } else {
                }

                // ✅ FIXED: Use scene.gameState
                if (scene.gameState.largeTile) {
                    let x4 = pX - tileWidth;
                    let y4 = pY - tileHeight;

                    let x5 = pX - tileWidth / 2;
                    let y5 = pY - tileHeight * 1.5;

                    let x6 = pX;
                    let y6 = pY - tileHeight * 2;

                    let x7 = pX + tileWidth / 2;
                    let y7 = pY - tileHeight * 1.5;

                    let x8 = pX + tileWidth;
                    let y8 = pY - tileHeight;

                    let tile4Pos = x4 + ", " + y4;
                    let tile5Pos = x5 + ", " + y5;
                    let tile6Pos = x6 + ", " + y6;
                    let tile7Pos = x7 + ", " + y7;
                    let tile8Pos = x8 + ", " + y8;

                    tilePosArray.push(tile4Pos, tile5Pos, tile6Pos, tile7Pos, tile8Pos);
                } else {
                }

                if (scene.gameState.xLargeTile) {
                    let x9 = pX + tileWidth * 1.5;
                    let y9 = pY - tileHeight * 1.5;

                    let x10 = pX + tileWidth;
                    let y10 = pY - tileHeight * 2;

                    let x11 = pX - tileWidth / 2;
                    let y11 = pY - tileHeight * 2.5;

                    let x12 = pX;
                    let y12 = pY - tileHeight * 3;

                    let x13 = pX + tileWidth / 2;
                    let y13 = pY - tileHeight * 2.5;

                    let x14 = pX - tileWidth;
                    let y14 = pY - tileHeight * 2;

                    let x15 = pX - tileWidth * 1.5;
                    let y15 = pY - tileHeight * 1.5;

                    let tile9Pos = x9 + ", " + y9;
                    let tile10Pos = x10 + ", " + y10;
                    let tile11Pos = x11 + ", " + y11;
                    let tile12Pos = x12 + ", " + y12;
                    let tile13Pos = x13 + ", " + y13;
                    let tile14Pos = x14 + ", " + y14;
                    let tile15Pos = x15 + ", " + y15;

                    tilePosArray.push(
                        tile9Pos,
                        tile10Pos,
                        tile11Pos,
                        tile12Pos,
                        tile13Pos,
                        tile14Pos,
                        tile15Pos
                    );
                } else {
                }

                // ✅ FIXED: Use scene.gameState
                if (scene.gameState.road) {
                    let x1 = pX - tileWidth / 2;
                    let y1 = pY - tileHeight / 2;

                    let x2 = pX + tileWidth / 2;
                    let y2 = pY - tileHeight / 2;

                    let x3 = pX - tileWidth / 2;
                    let y3 = pY + tileHeight / 2;

                    let x4 = pX + tileWidth / 2;
                    let y4 = pY + tileHeight / 2;

                    let x5 = pX;
                    let y5 = pY - tileHeight;

                    let x6 = pX + tileWidth;
                    let y6 = pY;

                    let x7 = pX - tileWidth;
                    let y7 = pY;

                    let x8 = pX;
                    let y8 = pY + tileHeight;

                    let x9 = pX - tileWidth;
                    let y9 = pY - tileHeight;

                    let x10 = pX + tileWidth;
                    let y10 = pY - tileHeight;

                    let x11 = pX - tileWidth;
                    let y11 = pY + tileHeight;

                    let x12 = pX + tileWidth;
                    let y12 = pY + tileHeight;

                    let tile1Pos = x1 + ", " + y1;
                    let tile2Pos = x2 + ", " + y2;
                    let tile3Pos = x3 + ", " + y3;
                    let tile4Pos = x4 + ", " + y4;
                    let tile5Pos = x5 + ", " + y5;
                    let tile6Pos = x6 + ", " + y6;
                    let tile7Pos = x7 + ", " + y7;
                    let tile8Pos = x8 + ", " + y8;
                    let tile9Pos = x9 + ", " + y9;
                    let tile10Pos = x10 + ", " + y10;
                    let tile11Pos = x11 + ", " + y11;
                    let tile12Pos = x12 + ", " + y12;

                    tilePosArray.push(
                        tile1Pos,
                        tile2Pos,
                        tile3Pos,
                        tile4Pos,
                        tile5Pos,
                        tile6Pos,
                        tile7Pos,
                        tile8Pos,
                        tile9Pos,
                        tile10Pos,
                        tile11Pos,
                        tile12Pos
                    );
                } else {
                }

                for (let i = 0; i < tilePosArray.length; i++) {
                    let tileCheck = scene.mapTilesPos.indexOf(tilePosArray[i]);

                    if (tileCheck !== -1) {
                        tileArray.push(scene.mapTiles[tileCheck]);
                    } else {
                    }
                }

                // Ensure tileArray only contains valid sprites
                tileArray = tileArray.filter(tile => tile && typeof tile.setTint === 'function');

                function allAreEqual(array) {
                    let areEqual = true;
                    for (const element of array) {
                        if (element !== array[0]) {
                            areEqual = false;
                            break;
                        }
                    }
                    return areEqual;
                }

                if (!hover) {
                    // ✅ FIXED: Use scene.gameState throughout this section
                    if (scene.gameState.destroy) {
                        scene.gameState.placeTile = true;
                        if (tileArray[0] && typeof tileArray[0].setTint === 'function') {
                            tileArray[0].setTint(0x000000);
                        }
                    } else if (
                        tileArray.length >= 4 &&
                        mapTexArray[0] === "ground" &&
                        allAreEqual(mapTexArray) === true
                    ) {
                        scene.gameState.placeTile = true;
                        for (let i = 0; i < tileArray.length; i++) {
                            if (tileArray[i] && typeof tileArray[i].setTint === 'function') {
                                tileArray[i].setTint(0x00ff00);
                            }
                        }
                    } else if (scene.gameState.road && mapTexArray[0] == "ground") {
                        scene.gameState.placeTile = true;
                        if (tileArray[0] && typeof tileArray[0].setTint === 'function') {
                            tileArray[0].setTint(0x00ff00);
                        }
                    } else if (scene.gameState.road && mapTexArray[0] != "ground") {
                        scene.gameState.placeTile = false;
                        if (tileArray[0] && typeof tileArray[0].setTint === 'function') {
                            tileArray[0].setTint(0xf0000f);
                        }
                    } else if (
                        scene.gameState.smallTile &&
                        !scene.gameState.mediumTile &&
                        mapTexArray[0] == "ground"
                    ) {
                        scene.gameState.placeTile = true;
                        if (tileArray[0] && typeof tileArray[0].setTint === 'function') {
                            tileArray[0].setTint(0x00ff00);
                        }
                    } else if (mapTexArray[0] === "road" && scene.gameState.bike) {
                        scene.gameState.placeTile = true;
                        if (tileArray[0] && typeof tileArray[0].setTint === 'function') {
                            tileArray[0].setTint(0x00ff00);
                        }
                    } else {
                        scene.gameState.placeTile = false;
                        for (let i = 0; i < tileArray.length; i++) {
                            if (tileArray[i] && typeof tileArray[i].setTint === 'function') {
                                tileArray[i].setTint(0xf0000f);
                            }
                        }
                    }
                } else {
                }
                return tileArray;
            });

            // ===================================================================
            // POINTERDOWN LISTENER
            // ===================================================================
            tile.on("pointerdown", function (pointer) {
                // Delegate to TileInteractionManager for modern tool handling
                scene.tileInteractionManager.handlePointerDown(this, pointer);

                const xx = `${this.gridX}_${this.gridY}`;
                const tileKey = gridToTileKey.get(`${this.gridX}_${this.gridY}`);

                const landUseData = landUseInfo.get(tileKey);

                const pX = this.x;
                const pY = this.y;

                let tile0Pos = pX + ", " + pY;

                let tilePosArray = [];
                let mapTexArray = [];
                let tileCheckArray = [];
                let tileaArray = []; // Always local

                tilePosArray.push(tile0Pos);

                let x1 = pX + tileWidth / 2;
                let y1 = pY - tileHeight / 2;

                let x2 = pX + tileWidth;
                let y2 = pY;

                let x3 = pX + tileWidth / 2;
                let y3 = pY + tileHeight / 2;

                let x4 = pX - tileWidth / 2;
                let y4 = pY - tileHeight / 2;

                let x5 = pX;
                let y5 = pY - tileHeight;

                let x6 = pX - tileWidth / 2;
                let y6 = pY + tileHeight / 2;

                let x7 = pX - tileWidth;
                let y7 = pY;

                let x8 = pX;
                let y8 = pY + tileHeight;

                let tile1Pos = x1 + ", " + y1;
                let tile2Pos = x2 + ", " + y2;
                let tile3Pos = x3 + ", " + y3;
                let tile4Pos = x4 + ", " + y4;
                let tile5Pos = x5 + ", " + y5;
                let tile6Pos = x6 + ", " + y6;
                let tile7Pos = x7 + ", " + y7;
                let tile8Pos = x8 + ", " + y8;

                tilePosArray.push(tile1Pos);
                tilePosArray.push(tile2Pos);
                tilePosArray.push(tile3Pos);
                tilePosArray.push(tile4Pos);
                tilePosArray.push(tile5Pos);
                tilePosArray.push(tile6Pos);
                tilePosArray.push(tile7Pos);
                tilePosArray.push(tile8Pos);

                for (let i = 0; i < tilePosArray.length; i++) {
                    let tileCheck = scene.mapTilesPos.indexOf(tilePosArray[i]);

                    if (tileCheck !== -1) {
                        mapTexArray.push(scene.mapTiles[tileCheck].texture.key);
                        tileCheckArray.push(scene.mapTiles[tileCheck]);
                    } else {
                    }
                }

                for (let j = 0; j < tilePosArray.length; j++) {
                    const tileCheck = scene.mapTilesPos.indexOf(tilePosArray[j]);

                    if (tileCheck !== -1) {
                        tileaArray.push(scene.mapTiles[tileCheck]);
                    } else {
                    }
                }

                tileaArray = tileaArray.filter(tile => tile && typeof tile.setTexture === 'function');

                const id = this.id;
                let newTileType = null;

                let tile0 = scene.mapTiles.indexOf(this);

                if (scene.gameState.placeTile == false) {
                    return;
                }

                if (scene.gameState.road) {
                    if (tileaArray[0] && typeof tileaArray[0].setTexture === 'function') {
                        tileaArray[0].setTexture("road");
                    }

                    newTileType = "road";

                    if (scene.economySim) {
                        scene.economySim.chargeFor("road");
                    }

                    updateAllRoadPatterns(scene);
                    updateAllRailPatterns(scene);

                    // Emit tile placed event
                    scene.emitter.emit('TILE_PLACED', {
                        oldTileType: this.texture.key,
                        newTileType: 'road'
                    });
                }

                // Check each condition individually
                const canPlace = scene.gameState.placeTile && this.texture.key !== "road" && !scene.gameState.destroy;

                if (scene.gameState.placeTile && this.texture.key !== "road" && !scene.gameState.destroy) {
                    if (tileArray[0] && typeof tileArray[0].setTexture === 'function') {
                        tileArray[0].setTexture(scene.gameState.newTile, scene.gameState.frameNumber);
                    }
                    scene.mapTiles[tile0].setTexture(scene.gameState.newTile, 0);
                    scene.mapArray[tile0] = scene.gameState.newTile;
                    newTileType = scene.gameState.newTile;

                    if (scene.anims.exists(scene.gameState.newTile)) {
                        scene.mapTiles[tile0].play({ key: scene.gameState.newTile, randomFrame: true });
                    } else {
                        scene.mapTiles[tile0].anims.stop();
                    }

                    // ✅ FIXED: Use scene.gameState
                    if (scene.gameState.placeTile && tileArray.length > 4) {
                        tileArray.forEach((tile, index) => {
                            if (!tile || typeof tile.anims === 'undefined') return;

                            tile.anims.stop();

                            if (index === 2) {
                                tile.setTexture(scene.gameState.newTile);
                                tile.setOrigin(0.5, 0.5);

                                const tileIndex = scene.mapTiles.indexOf(tile);
                                if (tileIndex !== -1) {
                                    scene.mapArray[tileIndex] = scene.gameState.newTile;
                                }

                                const tileId = tile.id;
                                if (tileId !== undefined) {
                                    const changeIndex = scene.tileChanges.findIndex(
                                        (t) => t.id === tileId
                                    );
                                    if (changeIndex !== -1) {
                                        scene.tileChanges[changeIndex].newTileType = scene.gameState.newTile;
                                    } else {
                                        scene.tileChanges.push({
                                            id: tileId,
                                            newTileType: scene.gameState.newTile,
                                        });
                                    }
                                }

                                if (scene.anims.exists(scene.gameState.newTile)) {
                                    tile.play({ key: scene.gameState.newTile, randomFrame: true });
                                } else {
                                    tile.anims.stop();
                                }
                            } else {
                                tile.setTexture("null");
                                tile.setOrigin(0.5, 0.5);

                                const tileIndex = scene.mapTiles.indexOf(tile);
                                if (tileIndex !== -1) {
                                    scene.mapArray[tileIndex] = "null";
                                }

                                const tileId = tile.id;
                                if (tileId !== undefined) {
                                    const changeIndex = scene.tileChanges.findIndex(
                                        (t) => t.id === tileId
                                    );
                                    if (changeIndex !== -1) {
                                        scene.tileChanges[changeIndex].newTileType = "null";
                                    } else {
                                        scene.tileChanges.push({ id: tileId, newTileType: "null" });
                                    }
                                }
                            }
                        });

                        // Auto-save removed - use explicit Save button instead
                        return;
                    }
                    // ✅ FIXED: Use scene.gameState
                    else if (scene.gameState.placeTile && tileArray.length == 4) {
                        tileArray.forEach((tile) => {
                            if (!tile || typeof tile.anims === 'undefined') return;

                            tile.anims.stop();
                            tile.setTexture("null");

                            const tileIndex = scene.mapTiles.indexOf(tile);

                            if (tileIndex !== -1) {
                                scene.mapArray[tileIndex] = "null";
                            }
                            const tileId = tile.id;
                            if (tileId !== undefined) {
                                const changeIndex = scene.tileChanges.findIndex(
                                    (t) => t.id === tileId
                                );
                                if (changeIndex !== -1) {
                                    scene.tileChanges[changeIndex].newTileType = "null";
                                } else {
                                    scene.tileChanges.push({ id: tileId, newTileType: "null" });
                                }
                            }
                        });

                        const centerTile = tileArray[1];
                        if (centerTile && typeof centerTile.setTexture === 'function') {
                            const centerTileIndex = scene.mapTiles.indexOf(centerTile);
                            if (centerTileIndex !== -1) {
                                scene.mapArray[centerTileIndex] = scene.gameState.newTile;
                            }

                            const centerTileId = centerTile.id;
                            if (typeof centerTileId !== "undefined") {
                                const existingIndex = scene.tileChanges.findIndex(
                                    (t) => t.id === centerTileId
                                );
                                if (existingIndex !== -1) {
                                    scene.tileChanges[existingIndex].newTileType = scene.gameState.newTile;
                                } else {
                                    scene.tileChanges.push({
                                        id: centerTileId,
                                        newTileType: scene.gameState.newTile,
                                    });
                                }
                            }

                            // Auto-save removed - use explicit Save button instead
                            centerTile.setTexture(scene.gameState.newTile);
                            centerTile.setOrigin(0.25, 0.47);

                            if (scene.anims.exists(scene.gameState.newTile)) {
                                centerTile.play({ key: scene.gameState.newTile, randomFrame: true });
                            } else {
                            }
                        }
                        // Emit tile placed event for multi-tile
                        scene.emitter.emit('TILE_PLACED', {
                            oldTileType: this.texture.key,
                            newTileType: scene.gameState.newTile
                        });
                        return;
                    }

                    // Emit tile placed event for single-tile
                    scene.emitter.emit('TILE_PLACED', {
                        oldTileType: this.texture.key,
                        newTileType: scene.gameState.newTile
                    });
                // OLD LEGACY ARCHITECTURE - COMMENTED OUT
                // Destroy/bulldoze is now handled by TileManager.handleDestroyClick()
                // } else if (scene.gameState.destroy) {
                //     if (tileArray.length === 0) {
                //         tileArray.push(this);
                //     }

                //     let currentSpriteWidth = tileArray[0].width;
                //     const oldTileType = this.texture.key;

                //     tileArray[0].play("bulldozing");
                //     tileArray[0].setTexture("ground");
                //     scene.mapTiles[tile0].setTexture("ground");
                //     scene.mapTiles[tile0].setOrigin(0.5, 0.5);
                //     scene.mapArray[tile0] = "ground";
                //     newTileType = "ground";

                //     // Emit tile removed event for bulldoze
                //     scene.emitter.emit('TILE_REMOVED', {
                //         tileType: oldTileType
                //     });

                //     if (currentSpriteWidth == 96) {
                //         for (let i = 0; i < tilePosArray.length; i++) {
                //             let checkForNull = scene.mapTilesPos.indexOf(tilePosArray[i]);

                //             scene.mapTiles[checkForNull].play("bulldozing");
                //             scene.mapTiles[checkForNull].setTexture("ground");
                //             scene.mapTiles[checkForNull].setOrigin(0.5, 0.5);
                //         }
                //     } else if (currentSpriteWidth == 64) {
                //         for (let i = 0; i < 4; i++) {
                //             let checkForNull = scene.mapTilesPos.indexOf(tilePosArray[i]);

                //             scene.mapTiles[checkForNull].play("bulldozing");
                //             scene.mapTiles[checkForNull].setTexture("ground");
                //             scene.mapTiles[checkForNull].setOrigin(0.5, 0.5);
                //         }
                //     } else {
                //     }
                // }
                } else if (scene.gameState.bike && tileArray[0] && tileArray[0].texture && tileArray[0].texture.key === "road") {
                    tileArray[0].setTexture("bike", tileArray[0].frame.name);
                    newTileType = "bike";
                } else {
                }

                if (newTileType !== null && id !== undefined) {
                    const tileIndex = scene.mapTiles.indexOf(this);
                    if (tileIndex !== -1) {
                        scene.mapArray[tileIndex] = newTileType;
                    }

                    const changeIndex = scene.tileChanges.findIndex(
                        (tile) => tile.id === id
                    );

                    if (changeIndex !== -1) {
                        scene.tileChanges[changeIndex].newTileType = newTileType;
                    } else {
                        scene.tileChanges.push({ id, newTileType });
                    }

                    // Auto-save removed - use explicit Save button instead
                }

                //if (scene.economySim && newTileType) {
                //    scene.economySim.chargeFor(newTileType);
                //}

                scene.citySim?.immediateUpdate();

                if (newTileType !== null && id !== undefined && !scene.isLoadingMap) {
                    scene.saveState();
                }

                // Info text now updated on pointerdown in scene, not per-tile
            });

            tile.on("pointerout", function (pointer) {
                tileArray = tileArray.filter(tile => tile && typeof tile.clearTint === 'function');

                for (let j = 0; j < tileArray.length; j++) {
                    if (tileArray[j] && typeof tileArray[j].clearTint === 'function') {
                        tileArray[j].clearTint();
                    }
                }

                if (scene.gameState.infoBool) {
                    for (let i = 0; i < scene.mapTiles.length; i++) {
                        let mapTex = scene.mapTiles[i];
                        mapTex.alpha = 1.0;
                    }
                }

                // Clear info text on pointer out
                if (scene.infoTextElement) {
                    scene.infoTextElement.textContent = '';
                    scene.infoTextElement.classList.remove('show');
                }
            });
    }

    addTileListeners() {
        // Add listeners to all tiles by calling addListenerToTile for each
        for (let i = 0; i < this.mapTiles.length; i++) {
            this.addListenerToTile(this.mapTiles[i]);
        }
    }

    buildGrid(mapTiles, c) {
    // Create an empty 2D array
    let grid = Array.from({ length: c }, () => Array(c));

    // Place each tile in the grid by its (gridX, gridY)
    for (let tile of mapTiles) {
        grid[tile.gridY][tile.gridX] = tile;
    }

    return grid;
}
triggerFloodRipple(
    centerX,
    centerY,
    maxRadius = 5,
    delayBetweenLayers = 200,
    revertDelay = 5000
) {
    this.isFlooding = true; // prevent update loop interference
    this.isReverting = true;
    const floodRecords = new Map();

    // Helper: Get tile at grid position
    const getTile = (x, y) =>
        this.mapTiles.find((t) => t.gridX === x && t.gridY === y);

    // Spread water outwards
    for (let radius = 0; radius <= maxRadius; radius++) {
        this.time.delayedCall(radius * delayBetweenLayers, () => {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    const dist = Math.abs(dx) + Math.abs(dy);
                    if (dist !== radius) continue; // only edge of current ring

                    const tile = getTile(centerX + dx, centerY + dy);
                    if (tile && tile.texture.key !== "water") {
                        // Save original state before flooding
                        floodRecords.set(`${tile.gridX},${tile.gridY}`, {
                            tile,
                            originalKey: tile.texture.key,
                            originalFrame: tile.frame.name,
                        });

                        tile.setTexture("water");
                        tile.play("water");
                    }
                }
            }
        });
    }

    // Revert tiles back after the full ripple is done
    const totalFloodTime = (maxRadius + 1) * delayBetweenLayers;

    for (let radius = maxRadius; radius >= 0; radius--) {
        this.time.delayedCall(
            totalFloodTime +
            revertDelay +
            (maxRadius - radius) * delayBetweenLayers,
            () => {
                for (let dx = -radius; dx <= radius; dx++) {
                    for (let dy = -radius; dy <= radius; dy++) {
                        const dist = Math.abs(dx) + Math.abs(dy);
                        if (dist !== radius) continue;

                        const key = `${centerX + dx},${centerY + dy}`;
                        const original = floodRecords.get(key);
                        if (original) {
                            const { tile, originalKey, originalFrame } = original;

                            tile.setTexture(originalKey, originalFrame);
                            if (this.anims.exists(originalKey)) {
                                tile.play({ key: originalKey, randomFrame: true });
                            }

                            //  also update internal state (e.g. mapArray)
                            const index = this.mapTiles.indexOf(tile);
                            if (index !== -1) {
                                this.mapArray[index] = originalKey;
                            }
                        }
                    }
                }

                // After final radius: mark flooding done
                if (radius === 0) {
                    this.isFlooding = false;
                }
            }
        );
    }
}

printClusters(clusters) {
    clusters.forEach((cluster, clusterIndex) => {
        console.log(`Cluster ${clusterIndex + 1}:`);
        console.log(`  Type: ${cluster.type}`);
        console.log("  Tiles:");
        cluster.tiles.forEach((tile, tileIndex) => {
            console.log(`    ${tileIndex + 1}. (${tile.x}, ${tile.y})`);
        });

        if (cluster.leftmostTile) {
            console.log(
                `  Leftmost Tile: (${cluster.leftmostTile.x}, ${cluster.leftmostTile.y})`
            );
        } else {
            console.warn(`  Cluster ${clusterIndex + 1} has no leftmostTile.`);
        }
    });
}

countArtificialTiles(results, mapTilesWidth, mapTilesHeight) {
    const desiredCount = mapTilesWidth * mapTilesHeight;

    const currentCount = results.length;

    if (currentCount < desiredCount) {
        // Calculate how many artificial elements to add
        const elementsToAdd = desiredCount - currentCount;
        console.log(`Adding ${elementsToAdd} artificial elements`);

        // Create artificial elements (for example, with a placeholder type)
        const artificialElements = Array(elementsToAdd).fill("empty");

        // Add the artificial elements to the results
        results.push(...artificialElements);
    }
    return results;
}

isPointerOverUI(pointer) {
    if (!this.uiBounds) return false;

    return pointer.x >= this.uiBounds.x &&
           pointer.x <= this.uiBounds.x + this.uiBounds.width &&
           pointer.y >= this.uiBounds.y &&
           pointer.y <= this.uiBounds.y + this.uiBounds.height;
}

// Rotation methods delegated to RotationHelper
rotateMapClockwise() {
    // Use stored grid dimensions (available during streaming)
    const gridSize = this.gridWidth || mapTilesWidth;
    this.rotationHelper.rotateMapClockwise(gridSize);
}

_buildGridLookup() {
    return this.rotationHelper._buildGridLookup();
}

_calculateRotatedTextures(gridLookup, mapWidth, isOddGrid) {
    return this.rotationHelper._calculateRotatedTextures(gridLookup, mapWidth, isOddGrid);
}

_applyRotatedTextures(newTextures) {
    return this.rotationHelper._applyRotatedTextures(newTextures);
}

_repositionMediumTiles(mediumTiles) {
    this.rotationHelper._repositionMediumTiles(mediumTiles);
}

_finalizeRotation() {
    this.rotationHelper._finalizeRotation();
}

getNeighborsForTile(tile, scene) {
    // Use LOCAL variable instead of global
    const localTileArray = [];

    const pX = tile.x;
    const pY = tile.y;

    const tilePosArray = [];

    let x1 = pX - tileWidth / 2;
    let y1 = pY - tileHeight / 2;

    let x2 = pX + tileWidth / 2;
    let y2 = pY - tileHeight / 2;

    let x3 = pX - tileWidth / 2;
    let y3 = pY + tileHeight / 2;

    let x4 = pX + tileWidth / 2;
    let y4 = pY + tileHeight / 2;

    let tile0Pos = pX + ", " + pY;
    let tile1Pos = x1 + ", " + y1;
    let tile2Pos = x2 + ", " + y2;
    let tile3Pos = x3 + ", " + y3;
    let tile4Pos = x4 + ", " + y4;

    tilePosArray.push(
        tile0Pos,
        tile1Pos,
        tile2Pos,
        tile3Pos,
        tile4Pos
    );

    // Process positions
    for (let j = 0; j < tilePosArray.length; j++) {
        const tileCheck = this.mapTilesPos.indexOf(tilePosArray[j]);

        if (tileCheck !== -1) {
            localTileArray.push(this.mapTiles[tileCheck]);
        }
    }

    // Ensure localTileArray only contains valid sprites
    const validTiles = localTileArray.filter(tile => tile && typeof tile.setTexture === 'function');

    return validTiles;
}

// setListeners() moved to InputManager

// Legacy method - now delegates to ClimateManager
updateClimateScore() {
    return this.climateManager.recalculateScore();
}

    repositionUI() {
        console.log("🔄 repositionUI called!");
        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;
        // ... your existing code ...

        // Land use info now uses DOM element with fixed CSS positioning

        console.log("UI repositioned for canvas size:", gWidth, "x", gHeight);
        console.log("New map start position:", this.startX, this.startY);
    }

// Button handlers moved to InputManager (BuildSolar, BuildWind, PlantTrees, etc.)

/* ─────── state HISTORY (5-deep) ─────── */
saveState() {
    this.saveLoadManager.saveState();
}

undoState() {
    this.saveLoadManager.undoState();
}

redoState() {
    this.saveLoadManager.redoState();
}

/**
 * Save the current game state to localStorage
 * Called manually by the user via Save button or S key
 */
saveGameToLocalStorage() {
    try {
        // Build complete save data from current game state
        const simplifiedTileData = this.mapTiles.map(tile => ({
            x: tile.gridX,
            y: tile.gridY,
            id: tile.id,
            tileType: tile.texture.key,
        }));

        const mapDataForStorage = {
            tiles: simplifiedTileData,
            gridWidth: this.gridWidth,      // ✅ Save current grid dimensions
            gridHeight: this.gridHeight,    // ✅ Save current grid dimensions
            tileChanges: this.tileChanges,
            landUseInfo: Object.fromEntries(landUseInfo.entries()),
        };

        // Save to localStorage
        localStorage.setItem("savedMap", JSON.stringify(mapDataForStorage));

        console.log(`💾 Game saved! Grid: ${this.gridWidth}x${this.gridHeight}, Changes: ${this.tileChanges.length}`);

        // Visual feedback: flash the Save menu item briefly
        const saveButton = document.querySelector('[data-action="save"]');
        if (saveButton) {
            saveButton.style.backgroundColor = '#00ff00';
            setTimeout(() => {
                saveButton.style.backgroundColor = '';
            }, 200);
        }
    } catch (error) {
        console.error("❌ Failed to save game:", error);
    }
}

//UPDATES:
update() {
    if (this.isFlooding || this.isReverting) return;

    // Sync mapArray from tile textures, but skip 'destroy' (it's just an animation)
    for (let i = 0; i < this.mapTiles.length; i++) {
        // Don't sync 'destroy' texture to mapArray - it's a temporary visual state
        // The actual land use should remain what was set (e.g., 'ground' after bulldozing)
        if (this.mapTiles[i].texture.key !== 'destroy') {
            this.mapArray[i] = this.mapTiles[i].texture.key;
        }
    }

    // Handle arrow key input for camera panning
    if (this.inputManager) {
        this.inputManager.update();
    }
}

__captureSnapshot() {
    return this.saveLoadManager._captureSnapshot();
}

undoStateDuplicate() {
    console.warn("undoStateDuplicate is deprecated");
}

/* ─────── end HISTORY helpers ─────── */

}