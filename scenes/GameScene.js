import { GameState } from "../utils/GameState.js";
import { processBoundingBoxes } from "../os.js";
import { fetchLocation, fetchLatLon } from "../os.js";
import { landUseInfo } from "../os.js";
//import { fetchWeatherAlerts } from "../os.js";
import { preloadAssets } from "../preloadAssets.js";
import { createAnimations } from "../preloadAssets.js";
import { updateAllRoadPatterns } from "../connector.js";
import { updateAllRailPatterns } from "../connector_rail.js";
import { findClimateNumber } from "../tileUtils.js";
import { applyWaterOnDominantNoDataSide } from "../tileUtils.js";
import { fixBeachTileFrames } from "../tileUtils.js";
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

let mapTilesWidth = 30;
let mapTilesHeight = mapTilesWidth;

const initialGridSize = mapTilesWidth;
const expandedGridSize = 11;

let isDraggingSprite = false;
let zoomNow = false;
let isLoading = true;

let climateNum = 0;
let climateNumArray = [];

const mapOffset = -0.08;

export class GameScene extends Phaser.Scene {
    constructor() {
        super("playingGame");
        this.gameState = new GameState();
        this.getInfo = null;
        this.tileChanges = []; // To store tile modifications
        this.startX = 0;
        this.isFlooding = false;
        this.startY = 0;
        this.mapContainer = null;
        this.tileData = [];
        this.mapTiles = [];
        this.mapTilesPos = [];
        this.mapTilesType = [];
        this.climateText = "";
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
        this.isLoadingMap = false; // Flag to prevent saveState during map loading

        this.boundMoveMap = this.MoveMap.bind(this);
        this.boundZoomMap = this.ZoomMap.bind(this);
        this.boundRotateMap = this.RotateMap.bind(this);
        this.boundInfoMap = this.InfoMap.bind(this);
        this.boundDestroy = this.Destroy.bind(this);
        this.boundPlantTrees = this.PlantTrees.bind(this);
        this.boundBuildMedium = this.BuildMedium.bind(this);
        this.boundBuildLarge = this.BuildLarge.bind(this);
        this.boundBuildRoad = this.BuildRoad.bind(this);
        this.boundBuildBikeLane = this.BuildBikeLane.bind(this);
        this.boundBuildWind = this.BuildWind.bind(this);
        this.boundBuildSolar = this.BuildSolar.bind(this);
        this.boundGoHome = this.GoHome.bind(this);
        this.boundUnDo = this.UnDo.bind(this);

        // Map boundary properties
        this.mapBoundaries = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };

        // this.applyPatternAction = this.applyPatternAction.bind(this);

        this._history = [];   // array of snapshots
        this._historyMax = 21; // keep at most 10 (allows 5 undo operations after 3 initial snapshots)
        this._redo = [];   // stack for redo snapshots
    }

    preload() {
        preloadAssets(this);
    }

    async create(data) {
        this.emitter = EventDispatcher.getInstance();

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
        camGame.setZoom(4);
        camGame.setBounds(0, 0, gWidth, gHeight);

        //BACKGROUND:

        this.BackgroundColor = this.add.graphics({
            fillStyle: { color: 0x4e2e22 },
        });
        const Background = new Phaser.Geom.Rectangle(0, 0, 1000, 550);
        this.bkgd = this.add.image(500, 300, "background_image");
        this.bkgd.setScale(1);
        this.bkgd.setTint(0x4e2e22);
        this.backgroundImage = this.bkgd;
        this.bkgdProcessing = this.add.image(500, 300, "background_image");
        this.bkgdProcessing.setScale(4);
        this.bkgdProcessing.setTint(0x4e2e22);
        this.BackgroundColor.fillRectShape(Background);
        this.GameBarColor = this.add.graphics().fillStyle(0x000000, 0.25);
        const GameBar = new Phaser.Geom.Rectangle(0, 550, gWidth, gHeight);
        this.GameBarColor.fillRectShape(GameBar);

        //LOADING:

        const textLoad = this.add.text(30, 30, "", {
            color: "#ff6633",
        });
        textLoad.setOrigin(0, 0);

        camGame.ignore(textLoad);
        const camProcessing = this.cameras.add(0, 0, 300, 100);
        camProcessing.setZoom(1);
        camProcessing.ignore(this.bkgd);

        camGame.ignore(this.bkgdProcessing);

        //const textIterations = [
        //    "awaiting OpenStreetMap",
        //    "awaiting OpenStreetMap.",
        //    "awaiting OpenStreetMap..",
        //    "awaiting OpenStreetMap...",
        //];
        const textIterations = [
            "processing map",
            "processing map.",
            "processing map..",
            "processing map...",
        ];
        let index = 0;

        //set and clear loading text
        let intervalId = setInterval(() => {
            if (isLoading == false) {
                clearInterval(intervalId);
                console.log("Interval cleared!");
            } else {
                textLoad.text = textIterations[index];
                index = (index + 1) % textIterations.length; // Reset index to 0 when it reaches the end
            }
        }, 1000);

        this.GameBarColor.fillRectShape(GameBar);

        //animations
        createAnimations(this);

        this.getInfo = this.add
            .text(30, 568, "", {
                color: "#00FF00",
            })
        //.setShadow(1, 1, "#ff9933", 3, false, true);

        // CREATE MAP:

        this.mapContainer = this.add.container(0, 0);
        this.mapContainer.sort("y");

        try {
            if (data && data.resume) {
                await this.loadMap();
            } else {
                await this.startNewGame(boxSize, mapTilesWidth, mapTilesHeight);
            }
        } catch (error) {
            console.error("Error fetching land use data:", error);
        }
        //// line for proper tile placement
        this.mapContainer.sort("y");

        let mapX = gWidth / 2 + mapTilesWidth * factor;
        let mapY = gHeight / 2;

        textLoad.destroy();
        isLoading = false;

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

        // MAP INTERACTIVITIY:
        // (see TileArrayTempate.png for tile numbers)
        this.addTileListeners();

        ///UISCENE

        this.UIScene = new UIScene({ scene: this });
        this.UIScene.camUI.ignore([
            this.bkgd,
            this.bkgdProcessing,
            this.BackgroundColor,
            this.GameBarColor
        ]);

        this.setListeners();

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

        const camInfo = this.cameras.add(0, 550, gWidth, gHeight);
        camInfo.setOrigin(0, 550);
        camInfo.scrollY = 550;
        camInfo.setZoom(1);
        camInfo.setBackgroundColor(0x00000);

        camGame.ignore(this.UIScene.buttons);

        camInfo.ignore(this.UIScene.buttons);
        camInfo.ignore(this.mapContainer);
        camInfo.ignore(Background);

        camProcessing.ignore(this.UIScene.buttons);
        camProcessing.ignore(this.mapContainer);
        camProcessing.ignore(Background);

        this.cameras.remove(camProcessing);

        this.input.on("pointerdown", function (pointer) {
            const isUIClick = this.isPointerOverUI(pointer);

            // Enable dragging if in move mode (but not on UI)
            if (!isDraggingSprite && this.gameState.moveBool && !isUIClick) {
                this.dragStartX = pointer.x - this.mapContainer.x;
                this.dragStartY = pointer.y - this.mapContainer.y;
                this.isDragging = true;
            }

            // Only update info text if NOT clicking on UI buttons
            if (!isUIClick) {
                this.getInfo.text = this.gameState.getInfoText();
            }

            // Show land use info on click (only if clicking on game area, not UI)
            if (!isUIClick) {
                const tileKeyDown = gridToTileKey.get(`${this.gridX}_${this.gridY}`);
                const landUseDataDown = landUseInfo.get(tileKeyDown);
                if (landUseDataDown && landUseDataDown.maxAreaType) {
                    this.landUseText.text = 'Land Use: ' + landUseDataDown.maxAreaType;
                } else {
                    this.landUseText.text = '';
                }
            }
        }, this);

        this.input.on(
            "pointermove",
            function (pointer) {
                if (this.isDragging && !isDraggingSprite) {
                    // Calculate proposed new position
                    const newX = pointer.x - this.dragStartX;
                    const newY = pointer.y - this.dragStartY;

                    // Apply boundary constraints to keep map on screen
                    const constrainedX = Math.max(this.mapBoundaries.minX, Math.min(this.mapBoundaries.maxX, newX));
                    const constrainedY = Math.max(this.mapBoundaries.minY, Math.min(this.mapBoundaries.maxY, newY));

                    this.mapContainer.x = constrainedX;
                    this.mapContainer.y = constrainedY;
                }
            },
            this
        );

        this.input.on(
            "pointerup",
            function () {
                this.isDragging = false;

                if (this.tempSprite) {
                    // to stop dragging the sprite as well
                    isDraggingSprite = false;
                }
            },
            this
        );

        // ============================================
        // KEYBOARD INPUTS
        // ============================================

        // Register all keys
        const z = this.input.keyboard.addKey("Z");
        const leftArrow = this.input.keyboard.addKey("LEFT");
        const rightArrow = this.input.keyboard.addKey("RIGHT");
        const upArrow = this.input.keyboard.addKey("UP");
        const downArrow = this.input.keyboard.addKey("DOWN");
        const f = this.input.keyboard.addKey("F");
        const r = this.input.keyboard.addKey("R");
        const o = this.input.keyboard.addKey("O");
        const shift = this.input.keyboard.addKey("SHIFT");

        z.on("down", () => {
            this.ZoomMap();
        });

        shift.on("down", () => {
            this.gameState.moveBool = true;
        });

        shift.on("up", () => {
            this.gameState.moveBool = false;
        });

        f.on("up", () => {
            this.mapContainer.x = 0;
            this.mapContainer.y = 0;
        });

        r.on("up", () => {
            this.rotateMapClockwise();
        });

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

        // Land use info text - bottom left

        this.landUseText = this.add.text(30, gHeight - 70, '', {
            color: '#00FF00',
            fontSize: '16px',
        });
        camGame.ignore(this.landUseText);
    }

    async startNewGame(boxSize, mapTilesWidth, mapTilesHeight) {
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

        this.tileData.push({ box, finalTileType });

        // ✨ SIMPLIFIED ISOMETRIC CONVERSION
        // Standard isometric formulas - much cleaner!
        let isoX = this.startX + (x - y) * (tileWidth / 2);
        let isoY = this.startY + (x + y) * (tileHeight / 2);

        // Create the sprite
        let tile = this.add.sprite(isoX, isoY, finalTileType);
        let tilePosStr = isoX + ", " + isoY;
        tile.setScale(setScale);

        if (finalTileType === "green_apartments") {
            tile.setOrigin(0.25, 0.47);
        } else {
            tile.setOrigin(0.5, 0.5);
        }

        tile.smoothed = false;
        tile.play({ key: finalTileType, randomFrame: true });

        tile.setInteractive({
            pixelPerfect: true,
            alphaTolerance: 1,
        });

        // Store grid coordinates and ID
        tile.id = id;
        tile.gridX = x;
        tile.gridY = y;

        // Handle tileKey for land use info
        let tileKey;
        if (typeof box.minLat === "number" && typeof box.minLon === "number") {
            tileKey = `${box.minLat.toFixed(6)}_${box.minLon.toFixed(6)}`;
        } else if (box.id !== undefined) {
            const parts = box.id.split("_");
            tileKey = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : box.id;
        } else {
            tileKey = `${x}_${y}`;
        }

        gridToTileKey.set(`${x}_${y}`, tileKey);

        // Add to container and arrays
        this.mapContainer.add(tile);
        this.mapTiles.push(tile);
        this.mapTilesPos.push(tilePosStr);
        this.mapTilesType.push(finalTileType);

        updateAllRoadPatterns(this);
        updateAllRailPatterns(this);
    }

    async fetchLocationAndBoundingBoxes(boxSize, mapTilesWidth, mapTilesHeight) {
        const locationData = await fetchLatLon();

        if (!locationData) {
            throw new Error("No location data available.");
        }

        this.minLat = parseFloat(locationData.minLat);
        this.minLon = parseFloat(locationData.minLon);

        console.log("Using coordinates:", this.minLat, this.minLon);

        const initialBox = {
            minLat: this.minLat,
            minLon: this.minLon,
            maxLat: this.minLat + boxSize,
            maxLon: this.minLon + boxSize,
        };

        // 🆕 Pre-check if location is in database
        let inDatabase = false;
        try {
            const testBox = await fetch(`${backendBaseUrl}/closestBbox?lat=${this.minLat}&lon=${this.minLon}`)
                .then(r => r.json());

            if (testBox && testBox.length > 0) {
                const distance = Math.sqrt(
                    Math.pow(testBox[0].minLat - this.minLat, 2) +
                    Math.pow(testBox[0].minLon - this.minLon, 2)
                );

                // If match is within reasonable distance (0.1 degrees ≈ 11km)
                inDatabase = distance < 0.01;
                console.log(`Database check: ${inDatabase ? 'IN' : 'NOT IN'} database (distance: ${distance.toFixed(4)})`);
            }
        } catch (error) {
            console.warn("Database check failed:", error);
        }

        // 🆕 Adjust grid size based on database availability
        let adjustedWidth = mapTilesWidth;
        let adjustedHeight = mapTilesHeight;

        if (!inDatabase) {
            adjustedWidth = 10;  // Use 10x10 for Overpass
            adjustedHeight = 10;
            console.warn(`⚠️ Location not in database. Using ${adjustedWidth}x${adjustedHeight} grid for Overpass API.`);
            console.warn(`⚠️ This will take approximately ${Math.round((adjustedWidth * adjustedHeight) / 60)} minutes.`);
        } else {
            console.log(`✅ Location in database. Using ${adjustedWidth}x${adjustedHeight} grid.`);
        }

        console.log(`🔍 Calling renderGridInSpiral with: ${adjustedWidth}x${adjustedHeight}`);

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

    async renderGridInSpiral(initialBox, gridWidth, gridHeight, boxSize) {
        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;

        // Set grid dimensions first
        mapTilesWidth = gridWidth;
        mapTilesHeight = gridHeight;

        const isoGridHeight = gridHeight * tileHeight;
        const verticalOffset = -5; // Negative moves UP, positive moves DOWN

        this.startX = gWidth / 2;
        this.startY = (gHeight / 2) - (isoGridHeight / 2) + verticalOffset;

        const tileData = [];
        const pseudoTiles = [];
        const tileTypesArray = [];

        // Process the generator - don't destructure yet
        for await (const result of processBoundingBoxes(
            initialBox,
            gridWidth,
            gridHeight
        )) {
            console.log("Received result:", result);

            // Skip metadata yield (first result)
            if (result.mode) {
                console.log(`Loading mode: ${result.mode}, tiles: ${result.totalTiles}`);

                // Update loading text if using Overpass
                if (result.useOverpass && this.loadingText) {
                    const estimatedMinutes = Math.round(result.totalTiles / 60);
                    this.loadingText.setText(
                        `Loading from OpenStreetMap\n` +
                        `This may take ~${estimatedMinutes} minutes\n` +
                        `Processing...`
                    );
                }
                continue; // Skip to next yield
            }

            // Now destructure tile data
            const { tileType, box } = result;

            if (!box) {
                console.warn("Received result without box:", result);
                continue;
            }

            pseudoTiles.push({
                gridX: box.x,
                gridY: box.y,
                texture: { key: tileType },
                box: box,
            });
            tileData.push({ box, tileType });
        }

        applyWaterOnDominantNoDataSide(this, pseudoTiles);

        let index = 0;
        const renderNext = () => {
            if (index >= pseudoTiles.length) {
                this.addTileListeners();
                updateAllRoadPatterns(this);
                updateAllRailPatterns(this);
                fixBeachTileFrames(this);
                this.filterNonAdjacentBeaches();
                this.updateClimateScore();
                this.calculateMapBoundaries();

                const simplifiedTileData = tileData.map(({ box, tileType }) => ({
                    x: box.x,
                    y: box.y,
                    id: box.id,
                    tileType: tileType,
                }));

                localStorage.setItem(
                    "savedMap",
                    JSON.stringify({
                        tiles: simplifiedTileData,
                        gridWidth: gridWidth,
                        gridHeight: gridHeight,
                        tileChanges: this.tileChanges,
                        landUseInfo: Object.fromEntries(landUseInfo.entries()),
                    })
                );
                return;
            }

            const tile = pseudoTiles[index];
            this.layTilesOnPlayboard(
                tile.texture.key,
                tile.gridX,
                tile.gridY,
                tile.box
            );
            this.mapContainer.sort("y");

            if (index % 10 === 0) {
                this.updateClimateScore();
            }

            tileTypesArray.push({
                x: tile.gridX,
                y: tile.gridY,
                type: tile.texture.key,
            });
            index++;

            setTimeout(renderNext, 10);
        };

        renderNext();
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

                // Notify player with a newspaper popup
                this.showNewspaper('Tornado Strikes!', [
                    'A violent tornado has torn through the region,',
                    'leaving a trail of destroyed tiles in its wake.',
                    'Rebuild quickly to restore your city!'
                ]);
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

        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;

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

        // Calculate boundaries to keep at least 30% of map visible
        const minVisibleWidth = mapWidth * 0.45;
        const minVisibleHeight = mapHeight * 0.45;

        // Set boundaries so map can't go completely off-screen
        this.mapBoundaries.minX = -(mapWidth - minVisibleWidth);
        this.mapBoundaries.maxX = mapWidth - minVisibleWidth;
        this.mapBoundaries.minY = -(mapHeight - minVisibleHeight);
        this.mapBoundaries.maxY = mapHeight - minVisibleHeight;
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
        console.log("Resuming saved game...");

        const savedMapString = localStorage.getItem("savedMap");
        //console.log("Raw savedMapString from localStorage:", savedMapString);

        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;
        const isoGridHeight = mapTilesHeight * tileHeight;
        const verticalOffset = -5; // Same value as renderGridInSpiral

        this.startX = gWidth / 2;
        this.startY = (gHeight / 2) - (isoGridHeight / 2) + verticalOffset;

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

            // Restore grid dimensions
            mapTilesWidth = savedData.gridWidth;
            mapTilesHeight = savedData.gridHeight;

            const gWidth = this.sys.game.canvas.width;
            const gHeight = this.sys.game.canvas.height;
            const isoGridHeight = mapTilesHeight * tileHeight;

            this.startX = gWidth / 2;
        this.startY = (gHeight / 2) - (isoGridHeight / 2) + verticalOffset;

            // Restore tileChanges for tracking changes made earlier
            this.tileChanges = savedData.tileChanges || [];

            // Restore landUseInfo from localStorage
            if (savedData.landUseInfo) {
                landUseInfo.clear();
                for (const [key, value] of Object.entries(savedData.landUseInfo)) {
                    landUseInfo.set(key, value);
                }
                //console.log("Restored landUseInfo:", landUseInfo.size, "entries");
            }

            // Load tile data
            const tileData = savedData.tiles;
            //console.log("Loaded tileData from localStorage:", tileData);

            // Clear the playboard to prepare for reloading
            this.clearPlayboard();

            // Load tiles one by one
            let index = 0;
            const loadTile = () => {
                if (index < tileData.length) {
                    const { x, y, tileType, id } = tileData[index];
                    //console.log(`Laying tile ${index}: ${tileType} at (${x}, ${y})`);

                    // Construct a box object with the id
                    const box = { id, x, y };

                    this.layTilesOnPlayboard(tileType, x, y, box);
                    this.mapContainer.sort("y");

                    if (index % 10 === 0) {
                        this.updateClimateScore();
                    }

                    index++;
                    setTimeout(loadTile, 0); // Load next tile after 0ms
                } else {
                    // Ensure tiles are sorted correctly for rendering
                    this.mapContainer.sort("y");
                    this.addTileListeners(); 
                    this.calculateMapBoundaries();
                    this.updateClimateScore();
                    this.setListeners();
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

    addTileListeners() {
        for (let i = 0; i < this.mapTiles.length; i++) {
            const scene = this; // Scene reference - CRITICAL for accessing gameState
            const tile = this.mapTiles[i]; // Current tile reference

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

                for (i = 0; i < tilePosArray.length; i++) {
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
                        for (i = 0; i < tileArray.length; i++) {
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
                        for (i = 0; i < tileArray.length; i++) {
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
                const xx = `${this.gridX}_${this.gridY}`;
                const tileKey = gridToTileKey.get(`${this.gridX}_${this.gridY}`);

                const landUseData = landUseInfo.get(tileKey);

                console.log("Land data:", landUseData);

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

                for (i = 0; i < tilePosArray.length; i++) {
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
                    const newNum = findClimateNumber("road");
                    climateNum += newNum;

                    newTileType = "road";

                    if (scene.economySim) {
                        scene.economySim.chargeFor("road");
                    }

                    updateAllRoadPatterns(scene);
                    updateAllRailPatterns(scene);
                }

                if (scene.gameState.placeTile && this.texture.key !== "road" && !scene.gameState.destroy) {
                    scene.updateClimateScore();

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
                                    console.log("Tile animation not found: " + scene.gameState.newTile);
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

                        const savedMap = JSON.parse(localStorage.getItem("savedMap")) || {};
                        savedMap.tileChanges = scene.tileChanges;
                        savedMap.landUseInfo = Object.fromEntries(landUseInfo.entries());
                        localStorage.setItem("savedMap", JSON.stringify(savedMap));
                        console.log("Tile changes saved to localStorage in if block.");
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
                            console.log(tileId, newTileType);
                            console.log(scene.tileChanges);
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

                            const savedMap = JSON.parse(localStorage.getItem("savedMap")) || {};
                            savedMap.tileChanges = scene.tileChanges;
                            savedMap.landUseInfo = Object.fromEntries(landUseInfo.entries());
                            localStorage.setItem("savedMap", JSON.stringify(savedMap));
                            console.log("Setting texture and origin for the medium tile.");

                            centerTile.setTexture(scene.gameState.newTile);
                            centerTile.setOrigin(0.25, 0.47);

                            if (scene.anims.exists(scene.gameState.newTile)) {
                                console.log("Playing animation for medium tile:", scene.gameState.newTile);
                                centerTile.play({ key: scene.gameState.newTile, randomFrame: true });
                            } else {
                            }
                        }
                        return;
                    }
                } else if (scene.gameState.destroy) {
                    if (tileArray.length === 0) {
                        tileArray.push(this);
                    }

                    let currentSpriteWidth = tileArray[0].width;

                    tileArray[0].play("bulldozing");
                    tileArray[0].texture.key = "ground";
                    scene.mapTiles[tile0].texture.key = "ground";
                    scene.mapTiles[tile0].setOrigin(0.5, 0.5);
                    scene.mapArray[tile0] = "ground";
                    newTileType = "ground";
                    scene.updateClimateScore();

                    if (currentSpriteWidth == 96) {
                        for (let i = 0; i < tilePosArray.length; i++) {
                            let checkForNull = scene.mapTilesPos.indexOf(tilePosArray[i]);
                            console.log(checkForNull);

                            scene.mapTiles[checkForNull].play("bulldozing");
                            scene.mapTiles[checkForNull].setTexture("ground");
                            scene.mapTiles[checkForNull].setOrigin(0.5, 0.5);
                        }
                    } else if (currentSpriteWidth == 64) {
                        for (let i = 0; i < 4; i++) {
                            let checkForNull = scene.mapTilesPos.indexOf(tilePosArray[i]);

                            console.log(checkForNull);

                            scene.mapTiles[checkForNull].play("bulldozing");
                            scene.mapTiles[checkForNull].setTexture("ground");
                            scene.mapTiles[checkForNull].setOrigin(0.5, 0.5);
                        }
                    } else {
                    }
                } else if (scene.gameState.bike && tileArray[0] && tileArray[0].texture && tileArray[0].texture.key === "road") {
                    tileArray[0].setTexture("bike", tileArray[0].frame.name);
                    newTileType = "bike";
                } else {
                }

                console.log(id, newTileType);

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

                    console.log("Tile changes updated:", scene.tileChanges);

                    const savedMap = JSON.parse(localStorage.getItem("savedMap")) || {};
                    savedMap.tileChanges = scene.tileChanges;
                    savedMap.landUseInfo = Object.fromEntries(landUseInfo.entries());
                    localStorage.setItem("savedMap", JSON.stringify(savedMap));
                    console.log("Tile changes saved to localStorage.");
                }

                //if (scene.economySim && newTileType) {
                //    scene.economySim.chargeFor(newTileType);
                //}

                scene.citySim?.immediateUpdate();

                if (newTileType !== null && id !== undefined && !scene.isLoadingMap) {
                    scene.saveState();
                }

                const tileKeyDown = gridToTileKey.get(`${this.gridX}_${this.gridY}`);
                const landUseDataDown = landUseInfo.get(tileKeyDown);
                if (landUseDataDown && landUseDataDown.maxAreaType) {
                    scene.landUseText.text = 'Land Use: ' + landUseDataDown.maxAreaType;
                } else {
                    scene.landUseText.text = '';
                }
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

                        scene.getInfo.text = "";
                    }
                }

                if (scene.landUseText) {
                    scene.landUseText.text = '';
                }
            });
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

destroyTile(x, y) {
    const tile = this.mapTiles.find((t) => t.gridX === x && t.gridY === y);
    if (tile && tile.texture.key !== "destroy") {
        tile.setTexture("destroy");
        tile.play("bulldozing");
        // Don't save state for destroy actions - only for tile placement
        // this.saveState();
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
    
    // 🔑 Exclude dropdown area from UI bounds check
    if (this.UIScene && this.UIScene.testDropdown) {
        const dd = this.UIScene.testDropdown;
        const ddBounds = dd.getBounds();
        if (ddBounds.contains(pointer.x, pointer.y)) {
            console.log("👉 Clicking on dropdown, allowing through");
            return false;  // Allow dropdown clicks
        }
    }
    
    return pointer.x >= this.uiBounds.x && 
           pointer.x <= this.uiBounds.x + this.uiBounds.width && 
           pointer.y >= this.uiBounds.y && 
           pointer.y <= this.uiBounds.y + this.uiBounds.height;
}

rotateMapClockwise() {
    console.log("rotateMapClockwise called!");
    this.isRotating = true;

    const mapWidth = mapTilesWidth;
    const isOddGrid = mapWidth % 2 !== 0;

    // Step 1: Build grid lookup
    const gridLookup = this._buildGridLookup();

    // Step 2: Calculate new textures
    const newTextures = this._calculateRotatedTextures(gridLookup, mapWidth, isOddGrid);

    // Step 3: Apply textures and collect medium tiles
    const mediumTiles = this._applyRotatedTextures(newTextures);

    // Step 5: REBUILD mapTilesPos array (CRITICAL FIX!)
    this.mapTilesPos = [];
    for (let i = 0; i < this.mapTiles.length; i++) {
        const tile = this.mapTiles[i];
        this.mapTilesPos.push(tile.x + ", " + tile.y);
    }

    // Step 6: Reposition medium tiles (now using updated mapTilesPos)
    if (mediumTiles.length > 0) {
        this._repositionMediumTiles(mediumTiles);
    }

    // Step 7: Finalize
    this._finalizeRotation();

    this.isRotating = false;
}

_buildGridLookup() {
    const lookup = new Map();
    for (const tile of this.mapTiles) {
        const key = `${tile.gridX},${tile.gridY}`;
        lookup.set(key, tile);
    }
    return lookup;
}

_calculateRotatedTextures(gridLookup, mapWidth, isOddGrid) {
    const newTextures = [];

    for (let i = 0; i < this.mapTiles.length; i++) {
        const tile = this.mapTiles[i];
        
        // COUNTER-CLOCKWISE rotation formulas
        let rotatedX, rotatedY;
        
        if (isOddGrid) {
            // Odd grid: counter-clockwise
            rotatedX = mapWidth - tile.gridY - 1;
            rotatedY = tile.gridX;
            
            // Adjust for odd grids
            rotatedX -= Math.floor(mapWidth / 2);
            rotatedY -= Math.floor(mapWidth / 2);
            rotatedX += Math.floor(mapWidth / 2);
            rotatedY += Math.floor(mapWidth / 2);
        } else {
            // Even grid: counter-clockwise
            rotatedX = mapWidth - tile.gridY + 1;
            rotatedY = tile.gridX;
        }

        // Look up the tile at the rotated position
        const lookupKey = `${rotatedX},${rotatedY}`;
        const rotatedTile = gridLookup.get(lookupKey);

        if (rotatedTile) {
            newTextures.push(rotatedTile.texture.key);
        } else {
            console.warn(`No tile found at rotated position (${rotatedX}, ${rotatedY})`);
            newTextures.push(null);
        }
    }

    return newTextures;
}

_applyRotatedTextures(newTextures) {
    const mediumTiles = [];

    for (let i = 0; i < this.mapTiles.length; i++) {
        const tile = this.mapTiles[i];
        const texture = newTextures[i];

        if (!texture) continue;

        // Stop current animation
        tile.anims.stop();

        // Set new texture
        tile.setTexture(texture);

        // Handle different tile sizes
        if (tile.width === 32) {
            tile.setOrigin(0.5, 0.5);
        } else if (tile.width === 64) {
            mediumTiles.push(tile);
        } else if (tile.width === 96) {
            tile.setOrigin(0.5, 0.5);
        }

        // Restart animation if it exists
        if (this.anims.exists(texture)) {
            tile.play({ key: texture, randomFrame: true });
        }
    }

    return mediumTiles;
}

_repositionMediumTiles(mediumTiles) {
    if (mediumTiles.length === 0) return;

    for (let i = 0; i < mediumTiles.length; i++) {
        const pX = mediumTiles[i].x;
        const pY = mediumTiles[i].y;
        const tex = mediumTiles[i].texture.key;

        // Set the current medium tile to null
        mediumTiles[i].setTexture("null");
        mediumTiles[i].setOrigin(0.5, 0.5);

        // Calculate the 3 positions that form the medium tile pattern
        let tilePosArray = [];
        let x1 = pX - tileWidth / 2;
        let y1 = pY - tileHeight / 2;
        let x2 = pX + tileWidth / 2;
        let y2 = pY - tileHeight / 2;
        let x3 = pX;
        let y3 = pY - tileHeight;

        let tile1Pos = x1 + ", " + y1;
        let tile2Pos = x2 + ", " + y2;
        let tile3Pos = x3 + ", " + y3;

        tilePosArray.push(tile1Pos, tile2Pos, tile3Pos);

        let changeSprite = this.mapTilesPos.indexOf(tilePosArray[0]);
        if (changeSprite !== -1) {
            console.log("Placing medium tile at position 0, index " + changeSprite);
            this.mapTiles[changeSprite].setTexture(tex);
            this.mapTiles[changeSprite].setOrigin(0.25, 0.47);
        } else {
            console.log("ERROR: Could not find position for medium tile anchor!");
        }

        let foundCount = 0;
        for (let j = 1; j < tilePosArray.length; j++) {
            let index = this.mapTilesPos.indexOf(tilePosArray[j]);
            if (index !== -1) {
                // Only null if it's already null or green_apartments
                const currentTexture = this.mapTiles[index].texture.key;
                if (currentTexture === "null" || currentTexture === "green_apartments") {
                    foundCount++;
                    console.log("  Nulling index " + index + ": was " + currentTexture);
                    this.mapTiles[index].setTexture("null");
                    this.mapTiles[index].setOrigin(0.5, 0.5);
                } else {
                    console.log("  SKIPPING index " + index + ": has texture " + currentTexture);
                }
            } else {
                console.log("  NOT FOUND: " + tilePosArray[j]);
            }
        }
    }
}

_finalizeRotation() {
    // Rebuild mapArray from current tiles
    this.mapArray = this.mapTiles.map(tile => tile.texture.key);

    // Update road/rail patterns and beach tiles
    updateAllRoadPatterns(this);
    updateAllRailPatterns(this);
    fixBeachTileFrames(this);
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

setListeners() {
    // Remove all existing listeners first (using the stored bound functions)
    this.emitter.off("MOVE MAP", this.boundMoveMap);
    this.emitter.off("ZOOM MAP", this.boundZoomMap);
    this.emitter.off("ROTATE MAP", this.boundRotateMap);
    this.emitter.off("INFO MAP", this.boundInfoMap);
    this.emitter.off("DESTROY", this.boundDestroy);
    this.emitter.off("PLANT TREES", this.boundPlantTrees);
    this.emitter.off("BUILD MEDIUM", this.boundBuildMedium);
    this.emitter.off("BUILD LARGE", this.boundBuildLarge);
    this.emitter.off("BUILD ROAD", this.boundBuildRoad);
    this.emitter.off("BUILD BIKE LANE", this.boundBuildBikeLane);
    this.emitter.off("BUILD WIND", this.boundBuildWind);
    this.emitter.off("BUILD SOLAR", this.boundBuildSolar);
    this.emitter.off("GO HOME", this.boundGoHome);
    this.emitter.off("UN DO", this.boundUnDo);
    
    // Now register the listeners (using stored bound functions)
    this.emitter.on("MOVE MAP", this.boundMoveMap);
    this.emitter.on("ZOOM MAP", this.boundZoomMap);
    this.emitter.on("ROTATE MAP", this.boundRotateMap);
    this.emitter.on("INFO MAP", this.boundInfoMap);
    this.emitter.on("DESTROY", this.boundDestroy);
    this.emitter.on("PLANT TREES", this.boundPlantTrees);
    this.emitter.on("BUILD MEDIUM", this.boundBuildMedium);
    this.emitter.on("BUILD LARGE", this.boundBuildLarge);
    this.emitter.on("BUILD ROAD", this.boundBuildRoad);
    this.emitter.on("BUILD BIKE LANE", this.boundBuildBikeLane);
    this.emitter.on("BUILD WIND", this.boundBuildWind);
    this.emitter.on("BUILD SOLAR", this.boundBuildSolar);
    this.emitter.on("GO HOME", this.boundGoHome);
    this.emitter.on("UN DO", this.boundUnDo);
    
    // Keyboard listeners (these are fine as-is)
    this.input.keyboard.on('keydown-U', () => this.undoState());
    this.input.keyboard.on('keydown-Q', () => this.redoState());
}

updateClimateScore() {
    let score = 0;
    const scores = [];

    // Calculate total score
    for (let tile of this.mapTiles) {
        const tileScore = findClimateNumber(tile.texture.key);
        score += tileScore;
        scores.push(tileScore);
    }

    // Update instance variables
    this.currentClimateScore = score;
    climateNum = score; // Keep global in sync for backwards compatibility
    climateNumArray = scores;

    // Update display with responsive positioning
    const gWidth = this.sys.game.canvas.width;
    const gHeight = this.sys.game.canvas.height;

    // Right-aligned: 30px from right edge, 32px from bottom
    const climateTextX = gWidth - 30;
    const climateTextY = gHeight - 32;

    if (this.climateText) {
        this.climateText.text = "Total Regional Climate Impact: " + score;
        this.climateText.setPosition(climateTextX, climateTextY);
    } else {
        // Fallback: create if it doesn't exist
        this.climateText = this.add
            .text(climateTextX, climateTextY, "Total Regional Climate Impact: " + score, {
                color: "#00FF00",
                fontSize: '16px'
            })
            .setOrigin(1, 0); // Right-aligned
        this.cameras.main.ignore(this.climateText);
    }

    return score;
}

    repositionUI() {
        console.log("🔄 repositionUI called!");
        const gWidth = this.sys.game.canvas.width;
        const gHeight = this.sys.game.canvas.height;
        // ... your existing code ...

        if (this.landUseText) {
            this.landUseText.setPosition(30, gHeight - 70);
        }

        console.log("UI repositioned for canvas size:", gWidth, "x", gHeight);
        console.log("New map start position:", this.startX, this.startY);
    }

//EVENTS:
// ============================================
// BUTTON HANDLER MIGRATION TEMPLATES
// Copy-paste these to replace your existing methods
// ============================================

// 1. BUILD SOLAR
BuildSolar() {
    this.gameState.setTool({
        smallTile: true,
        newTile: 'power:plant (solar)',
        solar: true,
        frameNumber: 0
    });
}

// 2. BUILD WIND
BuildWind() {
    this.gameState.setTool({
        smallTile: true,
        newTile: 'wind',
        wind: true,
        frameNumber: 0
    });
}

// 3. PLANT TREES
PlantTrees() {
    this.gameState.setTool({
        smallTile: true,
        newTile: 'wood',
        trees: true,
        frameNumber: 0
    });
}

// 4. BUILD MEDIUM (Green Apartments)
BuildMedium() {
    this.gameState.setTool({
        smallTile: true,
        mediumTile: true,
        newTile: 'green_apartments',
        frameNumber: 0
    });
}

// 5. BUILD LARGE (Hydrogen)
BuildLarge() {
    this.gameState.setTool({
        smallTile: true,
        mediumTile: true,
        largeTile: true,
        newTile: 'hydrogen',
        frameNumber: 0
    });
}

// 6. BUILD ROAD
BuildRoad() {
    this.gameState.setTool({
        smallTile: true,
        newTile: 'road',
        road: true,
        frameNumber: 0
    });
}

// 7. BUILD BIKE LANE
BuildBikeLane() {
    this.gameState.setTool({
        smallTile: true,
        newTile: 'road',
        bike: true,
        frameNumber: 0
    });
}

// 8. DESTROY
Destroy() {
    this.gameState.setTool({
        smallTile: true,
        destroy: true,
        newTile: 'destroy',
        frameNumber: 0
    });
}

// 9. MOVE MAP
MoveMap() {
    this.gameState.resetAllModes();
    this.gameState.moveBool = true;
}

// 10. ZOOM MAP
ZoomMap() {
    const camGame = this.cameras.main;
    const bkgd = this.backgroundImage;

    camGame.setZoom(4);

    if (bkgd) {
        bkgd.setScale(4);
    }
}

// 11. ROTATE MAP
RotateMap() {
    this.gameState.rotateBool = true;
    this.rotateMapClockwise();
}

// 12. INFO MAP
InfoMap() {
    this.gameState.resetAllModes();
    this.gameState.infoBool = true;
}

// 13. GO HOME
GoHome() {
    this.gameState.homeBool = true;

    // Center map immediately
    if (this.mapContainer) {
        this.mapContainer.x = 0;
        this.mapContainer.y = 0;
    }
}

// 14. UNDO (already simple, but here for completeness)
UnDo() {
    console.log("Moving back to previous state");
    this.undoState();
}

/* ─────── state HISTORY (5-deep) ─────── */
saveState() {
    // build a lightweight snapshot (NO live Phaser objects)
    const snap = {
        tiles: this.mapTiles.map(t => ({
            gridX: t.gridX,
            gridY: t.gridY,
            x: t.x,
            y: t.y,
            key: t.texture.key,
            frame: t.frame?.name ?? 0,
            type: t.type ?? null,
            id: t.id ?? null
        })),
        mapTilesPos: [...this.mapTilesPos],
        mapTilesType: [...this.mapTilesType],
        mapArray: [...this.mapArray],
        tileChanges: JSON.parse(JSON.stringify(this.tileChanges)),
        changedIdx: { ...(this.changedIndexesMap || {}) },
        climateNum: climateNum
    };

    // push & trim (FIFO)
    this._history.push(snap);
    if (this._history.length > this._historyMax) this._history.shift();

    // clearing redo stack because a brand-new change invalidates forward history
    if (this._redo) this._redo.length = 0;
}

undoState() {
    console.log("🟢 undoState() executing...");
    console.log("   History length:", this._history.length);
    console.log("   History contents:", this._history);
    // need at least two snapshots (current + previous) to undo
    if (this._history.length < 2) return;

    // Only store snapshot for redo if this is NOT a rotation state AND we can actually undo
    if (this._redo && !this.isRotating) {
        const currentSnap = this.__captureSnapshot();
        this._redo.push(currentSnap);
    }

    // drop current, fetch previous
    this._history.pop();
    const snap = this._history[this._history.length - 1];

    // REBUILD BOARD  ──────────────────────────────────────
    // 1. destroy current sprites
    this.mapTiles.forEach(s => s.destroy());
    this.mapTiles.length = 0;

    // 2. recreate sprites
    snap.tiles.forEach(d => {
        const s = this.add.sprite(d.x, d.y, d.key, d.frame)
            .setScale(setScale)
            .setOrigin(d.key === "green_apartments" ? 0.25 : 0.5,
                d.key === "green_apartments" ? 0.47 : 0.5)
            .setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
        s.gridX = d.gridX;
        s.gridY = d.gridY;
        s.type = d.type;
        s.id = d.id;
        this.mapContainer.add(s);
        this.mapTiles.push(s);
    });

    // 3. restore parallel structures
    this.mapTilesPos = [...snap.mapTilesPos];
    this.mapTilesType = [...snap.mapTilesType];
    this.mapArray = [...snap.mapArray];
    this.tileChanges = JSON.parse(JSON.stringify(snap.tileChanges));
    this.changedIndexesMap = { ...snap.changedIdx };
    climateNum = snap.climateNum;

    // 4. re-compute visuals / score
    this.mapContainer.sort('y');
    this.updateClimateScore?.();
    updateAllRoadPatterns?.(this);
    updateAllRailPatterns?.(this);
    fixBeachTileFrames?.(this);

    // 5. re-attach tile listeners
    this.addTileListeners?.();
}

//UPDATES:
update() {
    if (this.isFlooding || this.isReverting) return;

    for (let i = 0; i < this.mapTiles.length; i++) {
        this.mapArray[i] = this.mapTiles[i].texture.key;
    }
}

// Internal utility that captures the current board state without touching history/redo
__captureSnapshot() {
    return {
        tiles: this.mapTiles.map(t => ({
            gridX: t.gridX,
            gridY: t.gridY,
            x: t.x,
            y: t.y,
            key: t.texture.key,
            frame: t.frame?.name ?? 0,
            type: t.type ?? null,
            id: t.id ?? null
        })),
        mapTilesPos: [...this.mapTilesPos],
        mapTilesType: [...this.mapTilesType],
        mapArray: [...this.mapArray],
        tileChanges: JSON.parse(JSON.stringify(this.tileChanges)),
        changedIdx: { ...(this.changedIndexesMap || {}) },
        climateNum: climateNum
    };
}

redoState() {
    if (!this._redo || this._redo.length === 0) return; // nothing to redo

    const snap = this._redo.pop();

    // Safety check: don't exceed history limit
    if (this._history.length >= this._historyMax) {
        this._history.shift(); // remove oldest if at limit
    }

    this._history.push(snap);

    // Rebuild board from snapshot
    this.mapTiles.forEach(s => s.destroy());
    this.mapTiles.length = 0;

    snap.tiles.forEach(d => {
        const s = this.add.sprite(d.x, d.y, d.key, d.frame)
            .setScale(setScale)
            .setOrigin(d.key === "green_apartments" ? 0.25 : 0.5,
                d.key === "green_apartments" ? 0.47 : 0.5)
            .setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
        s.gridX = d.gridX;
        s.gridY = d.gridY;
        s.type = d.type;
        s.id = d.id;
        this.mapContainer.add(s);
        this.mapTiles.push(s);
    });

    this.mapTilesPos = [...snap.mapTilesPos];
    this.mapTilesType = [...snap.mapTilesType];
    this.mapArray = [...snap.mapArray];
    this.tileChanges = JSON.parse(JSON.stringify(snap.tileChanges));
    this.changedIndexesMap = { ...snap.changedIdx };
    climateNum = snap.climateNum;

    this.mapContainer.sort('y');
    this.updateClimateScore?.();
    updateAllRoadPatterns?.(this);
    fixBeachTileFrames?.(this);

    this.addTileListeners?.();
}

// Extend undoState to push snapshot onto redo stack (additions only)
undoStateDuplicate() {
    // store current view in redo stack before moving back
    if (this._redo && typeof this.__captureSnapshot === 'function') {
        this._redo.push(this.__captureSnapshot());
    }
    // ... existing code ...
}

/* ─────── end HISTORY helpers ─────── */

showNewspaper(headline, bodyLines) {
    // Pause gameplay and launch the overlay scene
    this.scene.pause();
    this.scene.launch('newspaper', {
        headline,
        bodyLines,
        onClose: () => {
            this.scene.resume();
        },
    });
}
}