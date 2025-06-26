import { processBoundingBoxes } from "../os.js";
import { fetchLocation, fetchLatLon } from "../os.js";
import { landUseInfo } from "../os.js";
import { fetchWeatherAlerts } from "../os.js";
import { preloadAssets } from "../preloadAssets.js";
import { createAnimations } from "../preloadAssets.js";
import { updateAllRoadPatterns } from "../connector.js";
import { findClimateNumber } from "../tileUtils.js";
import { applyWaterOnDominantNoDataSide } from "../tileUtils.js";
import { fixBeachTileFrames } from "../tileUtils.js";
import { CitySimulation } from "../simulation/CitySimulation.js";
import { EconomySimulation } from "../simulation/EconomySimulation.js";

const spriteWidth = 32;
const spriteHeight = spriteWidth / 2;

var factor = 4;

var boxSize = 0.0026;

var tileWidth = spriteWidth / factor;
var tileHeight = spriteHeight / factor;
var setScale = 1 / factor;

var moveBool = false;
var zoomBool = false;
var rotateBool = false;
var infoBool = false;
var homeBool = false;

var destroy = false;

var smallTile = false;
var mediumTile = false;
var largeTile = false;
var xLargeTile = false;

var road = false;
var bike = false;
var trees = false;
var wind = false;
var solar = false;

var placeTile = false;

let tileArray = [];
let mapTexArray = [];

let hideTileArray = [];
let tileArrayRoad = [];

let newTile;
let n;
const gridToTileKey = new Map();

const city = window.city;
const state = window.state;

let mapTilesWidth = 20;
let mapTilesHeight = mapTilesWidth;

const initialGridSize = mapTilesWidth;
const expandedGridSize = 11;

let isDraggingSprite = false;
let zoomNow = false;
let isLoading = true;

var climateNum = 0;
var climateNumArray = [];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("playingGame");
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
    // this.applyPatternAction = this.applyPatternAction.bind(this);

    this._history = [];   // array of snapshots
    this._historyMax = 6; // keep at most 5
    this._redo = [];   // stack for redo snapshots
  }

  preload() {
    preloadAssets(this);
  }

  async create(data) {
    // console.log(this);
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

    const BackgroundColor = this.add.graphics({
      //fillStyle: { color: 0xa7e3ff },
      fillStyle: { color: 0x4e2e22 },
    });

    const Background = new Phaser.Geom.Rectangle(0, 0, 1000, 550);

    const bkgd = this.add.image(500, 300, "background_image");
    bkgd.setScale(1);
    bkgd.setTint(0x4e2e22);

    const bkgdProcessing = this.add.image(500, 300, "background_image");
    bkgdProcessing.setScale(4);
    bkgdProcessing.setTint(0x4e2e22);

    BackgroundColor.fillRectShape(Background);

    const GameBarColor = this.add.graphics().fillStyle(0x000000, 0.25);

    const GameBar = new Phaser.Geom.Rectangle(0, 550, gWidth, gHeight);
    GameBarColor.fillRectShape(GameBar);

    //LOADING:

    const textLoad = this.add.text(30, 30, "", {
      color: "#ff6633",
    });
    textLoad.setOrigin(0, 0);

    camGame.ignore(textLoad);
    const camProcessing = this.cameras.add(0, 0, 300, 100);
    camProcessing.setZoom(1);
    camProcessing.ignore(bkgd);

    camGame.ignore(bkgdProcessing);

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

    GameBarColor.fillRectShape(GameBar);

    //animations
    createAnimations(this);

    this.getInfo = this.add
      .text(30, 548, "", {
        color: "#ff6633",
      })
      .setShadow(1, 1, "#ff9933", 3, false, true);

    // CREATE MAP:

    this.mapContainer = this.add.container(0, 0);
    this.mapContainer.sort("y");

    this.startX = gWidth / 2 - mapTilesWidth / 2;
    this.startY = gHeight / 2 - mapTilesHeight / 2;

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
    if (mapTilesWidth <= 20) {
      camGame.setZoom(4);
      bkgd.setScale(1);
    } else if (mapTilesWidth <= 50) {
      camGame.setZoom(2);
      bkgd.setScale(2);
    } else if (mapTilesWidth >= 100) {
      camGame.setZoom(1);
      bkgd.setScale(4);
    }
    let startZoom = camGame.zoom;

    //CLIMATE NUMBER CALC:
    for (i = 0; i < this.mapTiles.length; i++) {
      let num;

      let key = this.mapTiles[i].texture.key;
      //console.log(key);

      let newNum = findClimateNumber(key);
      //console.log(newNum);
      num = newNum;

      climateNumArray.push(num);

      var newClimateNum = climateNum + num;
      climateNum = newClimateNum;
    }

    this.climateText = this.add
      .text(30, 556, "Total Regional Climate Impact: " + climateNum, {
        //color: '#00ff00'
        color: "#ff6633",
      })
      .setShadow(1, 1, "#ff9933", 3, false, true);
    camGame.ignore(this.climateText);

    // initialise city simulation module
    this.citySim = new CitySimulation(this);

    // economy / budget system (depends on citySim for surplus info)
    this.economySim = new EconomySimulation(this, this.citySim);

    // MAP INTERACTIVITIY:
    // (see TileArrayTempate.png for tile numbers)
    this.addTileListeners();

    ///UISCENE

    this.UIScene = new UIScene({ scene: this });

    this.setListeners();
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

    this.input.on(
      "pointerdown",
      function (pointer) {
        if (!isDraggingSprite && moveBool) {
          // Only allow map dragging if no sprite is being dragged
          this.dragStartX = pointer.x - this.mapContainer.x;
          this.dragStartY = pointer.y - this.mapContainer.y;
          this.isDragging = true;
        } else {
        }

        if (moveBool) {
          this.getInfo.text = "Move Map (SHIFT)";
        } else if (rotateBool) {
          this.getInfo.text = " Rotate Map (R)";
        } else if (homeBool) {
          this.getInfo.text = " Center Map (F)";
          s.mapContainer.x = 0;
          s.mapContainer.y = 0;
        } else if (zoomBool) {
          this.getInfo.text = " Zoom Map (SPACE)";
        } else if (infoBool) {
          this.getInfo.text = " Get Map Info";
        } else if (wind) {
          this.getInfo.text = " Build Wind Power +8";
        } else if (solar) {
          this.getInfo.text = " Build Solar Power +6";
        } else if (trees) {
          this.getInfo.text = "Plant Trees +5";
        } else if (destroy) {
          this.getInfo.text = "Bulldoze -1";
        } else if (mediumTile && !largeTile) {
          this.getInfo.text = "Build Green Apartments +3";
        } else if (largeTile) {
          this.getInfo.text = "Build Hydrogen Power +10";
        }
      },
      this
    );

    this.input.on(
      "pointermove",
      function (pointer) {
        if (this.isDragging && !isDraggingSprite) {
          this.mapContainer.x = pointer.x - this.dragStartX;
          this.mapContainer.y = pointer.y - this.dragStartY;
        }
      },
      this
    );

    this.input.on(
      "pointerup",
      function () {
        this.isDragging = false;

        if (this.tempSprite) {
          // Ensure to stop dragging the sprite as well
          isDraggingSprite = false;
        }
      },
      this
    );

    // KEYBOARD INPUTS:
    //Space to Zoom,
    var spaceBar = this.input.keyboard.addKey("SPACE");
    var leftArrow = this.input.keyboard.addKey("LEFT");
    var rightArrow = this.input.keyboard.addKey("RIGHT");
    var upArrow = this.input.keyboard.addKey("UP");
    var downArrow = this.input.keyboard.addKey("DOWN");
    var f = this.input.keyboard.addKey("F");
    var r = this.input.keyboard.addKey("R");
    var shift = this.input.keyboard.addKey("SHIFT");

    spaceBar.on("down", function () {
      // if (camGame.zoom == startZoom) {
      //   camGame.setZoom(startZoom + 2);
      // } else
      if (camGame.zoom == 1) {
        camGame.setZoom(2);
        bkgd.setScale(2);
      } else if (camGame.zoom == 2) {
        camGame.setZoom(4);
        bkgd.setScale(1);
      } else if (camGame.zoom == 4) {
        camGame.setZoom(8);
        bkgd.setScale(0.5);
      } else if (camGame.zoom == 6) {
        camGame.setZoom(8);
        bkgd.setScale(0.5);
      } else if (camGame.zoom == 8) {
        camGame.setZoom(1);
        bkgd.setScale(4);
      } else {
      }
    });

    shift.on("down", function () {
      moveBool = true;
    });

    shift.on("up", function () {
      moveBool = false;
    });

    spaceBar.on("up", function () {});

    let s = this;
    let scene = this;

    f.on("up", function () {
      s.mapContainer.x = 0;
      s.mapContainer.y = 0;
    });

    r.on("up", function () {
      if (mapTilesWidth % 2 != 0) {
        let mapWidth = mapTilesWidth; // Width of the grid

        let newMapTiles = []; // Array to store the rotated textures
        let mediumTileArray = []; // Array to handle medium tiles

        // Calculate the rotated position for each tile
        for (let i = 0; i < s.mapTiles.length; i++) {
          let tile = s.mapTiles[i];
          tile.anims.stop();

          // Calculate the new position
          let rotatedX = tile.gridY;
          let rotatedY = mapWidth - tile.gridX - 1;

          // Adjust for odd grids
          if (mapWidth % 2 !== 0) {
            rotatedX -= Math.floor(mapWidth / 2);
            rotatedY -= Math.floor(mapWidth / 2);
          }
          rotatedX += Math.floor(mapWidth / 2);
          rotatedY += Math.floor(mapWidth / 2);

          // Find the tile that corresponds to the rotated position
          let rotatedTile = s.mapTiles.find(
            (t) => t.gridX === rotatedX && t.gridY === rotatedY
          );

          // Handle missing tiles gracefully
          if (!rotatedTile) {
            console.warn(
              `No tile found at rotated position (gridX: ${rotatedX}, gridY: ${rotatedY}).`
            );
            newMapTiles.push(null); // Add a placeholder for missing tiles
            continue;
          }

          newMapTiles.push(rotatedTile.texture.key);
        }

        // Update textures for all tiles
        for (let i = 0; i < s.mapTiles.length; i++) {
          let tile = s.mapTiles[i];

          tile.anims.stop(); // Stop animations on the tile

          let tex = newMapTiles[i];
          if (!tex) {
            console.warn(
              `Skipping tile at index ${i} as no rotated texture was found.`
            );
            continue;
          } else {
          }
          tile.setTexture(tex);

          // Adjust origins based on tile width
          if (tile.width === 32) {
            tile.setOrigin(0.5, 0.5);
          } else if (tile.width === 64) {
            mediumTileArray.push(tile);
          } else if (tile.width === 96) {
            tile.setOrigin(0.5, 0.5);
          }

          if (s.anims.exists(tex)) {
            tile.play({ key: tex, randomFrame: true });
          } else {
            tile.anims.stop();
          }
        }

        // Handle medium tiles
        if (mediumTileArray.length > 0) {
          for (let i = 0; i < mediumTileArray.length; i++) {
            let pX = mediumTileArray[i].x;
            let pY = mediumTileArray[i].y;
            let tex = mediumTileArray[i].texture.key;

            mediumTileArray[i].setTexture("null");
            mediumTileArray[i].setOrigin(0.5, 0.5);

            let tilePosArray = [];

            let x1 = pX - tileWidth / 2;
            let y1 = pY - tileHeight / 2;

            let x2 = pX + tileWidth / 2;
            let y2 = pY - tileHeight / 2;

            let x3 = pX;
            let y3 = pY - tileHeight;

            //console.log(x1, y1, x2, y2, x3, y3);

            let tile1Pos = `${x1}, ${y1}`;
            let tile2Pos = `${x2}, ${y2}`;
            let tile3Pos = `${x3}, ${y3}`;

            tilePosArray.push(tile1Pos, tile2Pos, tile3Pos);

            for (let j = 0; j < tilePosArray.length; j++) {
              let index = s.mapTilesPos.indexOf(tilePosArray[j]);
              if (index !== -1) {
                s.mapTiles[index].setTexture("null");
                s.mapTiles[index].setOrigin(0.5, 0.5);
              }
            }

            let changeSprite = s.mapTilesPos.indexOf(tilePosArray[0]);
            if (changeSprite !== -1) {
              s.mapTiles[changeSprite].setTexture(tex);
              s.mapTiles[changeSprite].setOrigin(0.25, 0.47);
            }
          }
        }

        // Update grid positions after rotation
        for (let i = 0; i < s.mapTiles.length; i++) {
          let tile = s.mapTiles[i];
          let newGridX = tile.gridY;
          let newGridY = mapWidth - tile.gridX - 1;

          tile.gridX = newGridX;
          tile.gridY = newGridY;
        }

        // Update mapArray with new texture keys
        s.mapArray = [];
        for (let i = 0; i < s.mapTiles.length; i++) {
          s.mapArray[i] = s.mapTiles[i].texture.key;
        }
        updateAllRoadPatterns(s);
        fixBeachTileFrames(s);
      } else {
        s.mapTiles.forEach((tile) => {});

        this.rotated = true;

        let mapWidth = mapTilesWidth; // Width of the grid

        let newMapTiles = []; // Array to store the rotated textures
        let mediumTileArray = []; // Array to handle medium tiles

        // Calculate the rotated position for each tile
        for (let i = 0; i < s.mapTiles.length; i++) {
          let tile = s.mapTiles[i];

          // Calculate the new position using 1-based indexing for gridX and gridY

          let rotatedX = tile.gridY; // Rotated X is based on Y
          let rotatedY = mapWidth - tile.gridX + 1; // Rotated Y with 1-based indexing

          // Find the tile that corresponds to the rotated position
          let rotatedTile = s.mapTiles.find(
            (t) => t.gridX === rotatedX && t.gridY === rotatedY
          );

          // Handle missing tiles gracefully
          if (!rotatedTile) {
            console.warn(
              `No tile found at rotated position (gridX: ${rotatedX}, gridY: ${rotatedY}).`
            );
            newMapTiles.push(null); // Add a placeholder for missing tiles
            continue;
          }

          // Add the texture key of the rotated tile to the newMapTiles array
          newMapTiles.push(rotatedTile.texture.key);
        }

        // Update the textures of all tiles in the rotated grid
        for (let i = 0; i < s.mapTiles.length; i++) {
          let tile = s.mapTiles[i];

          tile.anims.stop(); // Stop animations on the tile

          // Set the new texture for the tile, skipping if the texture is null
          let tex = newMapTiles[i];
          if (!tex) {
            console.warn(
              `Skipping tile at index ${i} as no rotated texture was found.`
            );
            continue;
          }

          tile.setTexture(tex);

          // Adjust origins based on tile width
          if (tile.width === 32) {
            tile.setOrigin(0.5, 0.5);
          } else if (tile.width === 64) {
            mediumTileArray.push(tile);
          } else if (tile.width === 96) {
            tile.setOrigin(0.5, 0.5);
          }

          // Restart animations if applicable
          if (s.anims.exists(tex)) {
            tile.play({ key: tex, randomFrame: true });
          } else {
            tile.anims.stop();
          }
        }
        // Handle medium tiles

        if (mediumTileArray.length > 0) {
          for (let i = 0; i < mediumTileArray.length; i++) {
            //let oldTile = mediumTileArray[i];
            //let oldX = oldTile.x;
            //let oldY = oldTile.y;
            //let oldKey = oldTile.texture.key;

            //// Stop old animation and temporarily null out the texture
            //oldTile.anims.stop();
            //oldTile.setTexture("null");
            //oldTile.setOrigin(0.5, 0.5);

            //let gridX = oldTile.gridX;
            //let gridY = oldTile.gridY;
            //let iso = someFunctionThatConvertsGridToIsometric(gridX, gridY);
            //let newX = iso.x;
            //let newY = iso.y;

            //oldTile.x = newX;
            //oldTile.y = newY;

            //// Now give it the real texture again
            //oldTile.setTexture(oldKey);

            //// Finally, if we do have an anim for oldKey, restart it
            //if (s.anims.exists(oldKey)) {
            //    oldTile.play({ key: oldKey, randomFrame: true });
            //}
            let pX = mediumTileArray[i].x;
            let pY = mediumTileArray[i].y;

            let tex = mediumTileArray[i].texture.key;

            mediumTileArray[i].setTexture("null");
            mediumTileArray[i].setOrigin(0.5, 0.5);

            let tilePosArray = [];

            let x1 = pX - tileWidth / 2;
            let y1 = pY + tileHeight / 2;

            let x2 = pX + tileWidth / 2;
            let y2 = pY + tileHeight / 2;

            let x3 = pX;
            let y3 = pY + tileHeight;

            let tile1Pos = x1 + ", " + y1;
            let tile2Pos = x2 + ", " + y2;
            let tile3Pos = x3 + ", " + y3;

            tilePosArray.push(tile1Pos, tile2Pos, tile3Pos);

            for (let i = 0; i < tilePosArray.length; i++) {
              let index = scene.mapTilesPos.indexOf(tilePosArray[i]);

              scene.mapTiles[index].setTexture("null");
              scene.mapTiles[index].setOrigin(0.5, 0.5);
            }

            let changeSprite = scene.mapTilesPos.indexOf(tilePosArray[0]);
            scene.mapTiles[changeSprite].setTexture(tex);
            scene.mapTiles[changeSprite].setOrigin(0.25, 0.47);
          }
        }

        // Update the logical grid position (gridX, gridY) for all tiles
        for (let i = 0; i < s.mapTiles.length; i++) {
          let tile = s.mapTiles[i];

          let newGridX = tile.gridY; // Rotated X becomes the new gridX
          let newGridY = mapWidth - tile.gridX + 1; // Rotated Y becomes the new gridY

          tile.gridX = newGridX;
          tile.gridY = newGridY;
        }

        // Update mapArray with new texture keys
        s.mapArray = [];
        for (let i = 0; i < s.mapTiles.length; i++) {
          s.mapArray[i] = s.mapTiles[i].texture.key;
        }
        updateAllRoadPatterns(s);
        fixBeachTileFrames(s);
      }
    });
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
      console.log("User chose current location");
      return "current";
    } else if (window.locationChoice === "manual") {
      console.log("User chose manual location");
      return "manual";
    } else {
      console.log("No choice made");
      return null;
    }
  }

  layTilesOnPlayboard(tileType, x, y, box) {
    const { id } = box; // Use box.id, x, y directly

    // Check if this tile has a change recorded
    const existingChange = this.tileChanges.find((tile) => tile.id === id);

    // Use the new tileType if it exists in tileChanges, otherwise use the passed tileType
    let finalTileType = existingChange ? existingChange.newTileType : tileType;
    // if (finalTileType === "coastline") {
    //   finalTileType = "road";
    // } else if (finalTileType === "beach") {
    //   finalTileType = "road";
    // } else if (finalTileType === "road") {
    //   finalTileType = "retail";
    // }

    this.tileData.push({ box, finalTileType });

    const centerX = Math.floor(mapTilesWidth / 2);
    const centerY = Math.floor(mapTilesHeight / 2);

    //let isoX = this.startX + ((x - y) * tileWidth) / 2;
    //let isoY = this.startY + ((x + y) * tileHeight) / 2;

    let isoX = this.startX + (x - centerX + (y - centerY)) * (tileWidth / 2); // Reverse horizontal relationship
    let isoY = this.startY + (x - centerX - (y - centerY)) * (tileHeight / 2); // Reverse vertical relationship

    let tile = this.add.sprite(isoX, isoY, finalTileType); // Create sprite using tileType
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

    // Track tile index in mapArray
    const tileIndex = y * mapTilesWidth + x;
    // Store grid coordinates
    tile.id = id;
    tile.gridX = x;
    tile.gridY = y;
    const tileKey = `${box.minLat.toFixed(6)}_${box.minLon.toFixed(6)}`;
    console.log(tileKey);
    // tile.tileKey = tileKey; // Optional, still useful
    gridToTileKey.set(`${x}_${y}`, tileKey); // ✅ map gridX_gridY to tileKey

    console.log(`${x}_${y}`);
    console.log(gridToTileKey);

    this.mapContainer.add(tile);
    this.mapTiles.push(tile);

    this.mapTilesPos.push(tilePosStr);

    this.mapTilesType.push(finalTileType);
    updateAllRoadPatterns(this);
    // capture state after laying a tile during map generation or player placement
    this.saveState();
  }

  async fetchLocationAndBoundingBoxes(boxSize, mapTilesWidth, mapTilesHeight) {
    const manual = await this.checkLocationChoice();
    const locationData =
      manual === "manual" ? await fetchLatLon() : await fetchLocation();
    this.minLat = parseFloat(locationData.minLat);
    this.minLon = parseFloat(locationData.minLon);
    fetchWeatherAlerts(this.minLat, this.minLon);
    const initialBox = {
      minLat: this.minLat,
      minLon: this.minLon,
      maxLat: this.minLat + boxSize,
      maxLon: this.minLon + boxSize,
    };

    this.mainArray = await this.renderGridInSpiral(
      initialBox,
      initialGridSize,
      initialGridSize,
      boxSize
    );

    //// line for proper tile placement
    this.mapContainer.sort("y");
    applyWaterOnDominantNoDataSide(this);

    // Sort and transform the array to contain only tileType values
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

    this.startX = gWidth / 2;
    this.startY = gHeight / 2;

    const tileData = [];
    const pseudoTiles = [];
    const tileTypesArray = [];
    mapTilesWidth = gridWidth;
    mapTilesHeight = gridHeight;

    for await (const { tileType, box } of processBoundingBoxes(
      initialBox,
      gridWidth,
      gridHeight
    )) {
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
        fixBeachTileFrames(this);
        this.filterNonAdjacentBeaches();
        this.updateClimateScore();
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

      tileTypesArray.push({
        x: tile.gridX,
        y: tile.gridY,
        type: tile.texture.key,
      });
      index++;

      // Next tile after short delay
      setTimeout(renderNext, 0);
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
    this.mapContainer.removeAll(true); // Removes all child objects in the container
    this.mapTiles = []; // Clear the mapTiles array
    this.mapTilesPos = [];
    this.mapTilesType = [];
    this.tileData = [];
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
    console.log("Resuming saved game...");

    const savedMapString = localStorage.getItem("savedMap");
    console.log("Raw savedMapString from localStorage:", savedMapString);

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
      console.log(savedData);

      if (!savedData || !savedData.tiles || !Array.isArray(savedData.tiles)) {
        throw new Error("Loaded map data is invalid or empty.");
      }

      // Restore grid dimensions
      mapTilesWidth = savedData.gridWidth;
      mapTilesHeight = savedData.gridHeight;
      console.log(
        `Restored grid dimensions: Width=${mapTilesWidth}, Height=${mapTilesHeight}`
      );

      // Restore tileChanges for tracking changes made earlier
      this.tileChanges = savedData.tileChanges || [];
      console.log("Restored tileChanges:", this.tileChanges);

      // Load tile data
      const tileData = savedData.tiles;
      console.log("Loaded tileData from localStorage:", tileData);

      // Clear the playboard to prepare for reloading
      this.clearPlayboard();

      // Load tiles one by one
      let index = 0;
      const loadTile = () => {
        if (index < tileData.length) {
          const { x, y, tileType, id } = tileData[index];
          console.log(`Laying tile ${index}: ${tileType} at (${x}, ${y})`);

          // Construct a box object with the id
          const box = { id, x, y };

          this.layTilesOnPlayboard(tileType, x, y, box);
          this.mapContainer.sort("y");
          console.log(this.mapTiles);
          console.log(this.mapArray);

          index++;
          setTimeout(loadTile, 0); // Load next tile after 100ms
          this.addTileListeners();
        } else {
          // Ensure tiles are sorted correctly for rendering
          this.mapContainer.sort("y");

          console.log("Map successfully reloaded.");
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
      const scene = this; // Scene reference
      const tile = this.mapTiles[i]; // Current tile reference

      tile.removeAllListeners(); // Clear any previous listeners

      // Pointerover listener
      tile.on("pointerover", function (pointer) {
        var hover = false;

        const pX = this.x;
        const pY = this.y;

        if (moveBool || rotateBool || zoomBool || homeBool) {
          hover = true;
          console.log("hover over");
        } else {
          hover = false;
        }

        const tileKey = `${scene.gridX}_${scene.gridY}`; // Construct the key using gridX and gridY

        // console.log(scene.tileData.box.id);

        // const landUseData = landUseInfo.get(boxId);

        // console.log(landUseInfo);
        // console.log("this is amne");
        // console.log(landUseData);

        let tile0 = scene.mapTiles.indexOf(this);

        let useType = scene.mapArray[tile0];
        //console.log(mapTex0);

        let displayClimateNum = findClimateNumber(this.texture.key);

        const landUseTypes = landUseInfo[tile0];
        if (infoBool) {
          for (let i = 0; i < scene.mapTiles.length; i++) {
            let mapTex = scene.mapTiles[i];
            scene.getInfo.text =
              `Land Use: '` +
              useType +
              `' with Climate Impact of: ` +
              displayClimateNum;
            mapTex.alpha = 0.3;
          }
          this.alpha = 1;
          console.log("helow");
          console.log(landUseInfo);
          console.log(this.id);
          const boxId = this.id;

          // Assuming 'this' refers to the tile
          const tileId = this.id;
          console.log("Tile ID:", tileId);

          // Find the tile's information in the map
          const landUseData = landUseInfo.get(tileId);
          console.log("Land Use Data:", landUseData);

          if (landUseData) {
            const maxAreaType = landUseData.maxAreaType || "unknown";
            scene.getInfo.text =
              `Land Use: '` +
              useType +
              `' with Climate Impact of: ` +
              displayClimateNum; // Display the maxAreaType
          } else {
            //scene.getInfo.text = "No data found.";
          }
        } else {
        }

        let tilePosArray = [];
        mapTexArray = [];
        tileArray = [];

        if (smallTile === true) {
          mapTexArray = [];
          mapTexArray.push(scene.mapArray[tile0]);
          tileArray = [];

          let tile0Pos = pX + ", " + pY;
          tilePosArray = [];
          tilePosArray.push(tile0Pos);
        } else {
        }

        if (mediumTile === true) {
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

        if (largeTile === true) {
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

        if (xLargeTile === true) {
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

        if (road === true) {
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
            // mapTexArray.push(scene.mapTiles[tileCheck].texture.key);
            tileArray.push(scene.mapTiles[tileCheck]);
          } else {
          }
        }

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
          if (destroy === true) {
            placeTile = true;
            tileArray[0].setTint(0x000000);
          } else if (
            tileArray.length >= 4 &&
            mapTexArray[0] === "ground" &&
            allAreEqual(mapTexArray) === true
          ) {
            placeTile = true;
            for (i = 0; i < tileArray.length; i++) {
              tileArray[i].setTint(0x00ff00);
            }
          } else if (road == true && mapTexArray[0] == "ground") {
            placeTile = true;
            tileArray[0].setTint(0x00ff00);
          } else if (road == true && mapTexArray[0] != "ground") {
            placeTile = false;
            tileArray[0].setTint(0xf0000f);
          } else if (
            smallTile == true &&
            mediumTile == false &&
            mapTexArray[0] == "ground"
          ) {
            placeTile = true;
            tileArray[0].setTint(0x00ff00);
          } else if (mapTexArray[0] === "road" && bike === true) {
            placeTile = true;
            tileArray[0].setTint(0x00ff00);
          } else {
            placeTile = false;
            for (i = 0; i < tileArray.length; i++) {
              tileArray[i].setTint(0xf0000f);
            }
          }
        } else {
        }
        return tileArray;
      });

      tile.on("pointerdown", function (pointer) {
        const xx = `${this.gridX}_${this.gridY}`;
        console.log(xx);
        const tileKey = gridToTileKey.get(`${this.gridX}_${this.gridY}`);

        console.log(tileKey);
        console.log(landUseInfo);
        const landUseData = landUseInfo.get(tileKey);

        // const tileKey = `${this.gridX}_${this.gridY}`;

        // for (const [key, val] of landUseInfo.entries()) {
        //   console.log("Map Key:", key, "Type:", typeof key);
        // }

        console.log("Land data:", landUseData);

        const pX = this.x;
        const pY = this.y;

        let tile0Pos = pX + ", " + pY;

        let tilePosArray = [];
        let mapTexArray = [];
        let tileCheckArray = [];
        let tileaArray = [];

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

        const scene = this.scene;
        // scene.triggerFloodRipple(tile.gridX, tile.gridY, 6);

        // scene.saveState();
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
            // console.log(scene.mapTiles[tileCheck].texture.key);
            // console.log(scene.mapTiles[tileCheck]);
            // mapTexArray.push(this.mapTiles[tileCheck].texture.key);

            tileaArray.push(scene.mapTiles[tileCheck]);
          } else {
            const invalidTile = { texture: { key: "invalid" } };
            // invalidTile.setTint(0x00000);
            tileaArray.push(invalidTile);
          }
        }

        const id = this.id; // Unique box.id assigned to this tile
        let newTileType = null; // Default value if no change happens

        let tile0 = scene.mapTiles.indexOf(this);

        //for (let i = 0; i < tilePosArray.length; i++) {
        //    tileCheckArray[i].setTint(0x000000);
        //}

        // Log surrounding positions (for debugging)
        //console.log("Tile Position Array:", tilePosArray);

        if (!placeTile) {
          return;
        }
        if (road) {
          tileaArray[0].setTexture("road");
          const newNum = findClimateNumber("road");
          climateNum += newNum;

          newTileType = "road";

          // cost for road
          if (scene.economySim) {
            scene.economySim.chargeFor("road");
          }

          // Just call the reusable function
          updateAllRoadPatterns(scene);
        }

        if (placeTile && this.texture.key !== "road" && !destroy) {
          scene.updateClimateScore();

          // const newNum = findClimateNumber(newTile);
          // climateNum += newNum;
          // scene.climateText.text = `Total Regional Climate Impact: ${climateNum}`;

          tileArray[0].setTexture(newTile, n);
          scene.mapTiles[tile0].setTexture(newTile, 0);
          scene.mapArray[tile0] = newTile;
          newTileType = newTile;

          if (scene.anims.exists(newTile)) {
            scene.mapTiles[tile0].play({ key: newTile, randomFrame: true });
          } else {
            scene.mapTiles[tile0].anims.stop();
          }

          // Handle large and medium tiles (old feature)

          if (placeTile && tileArray.length > 4) {
            tileArray.forEach((tile, index) => {
              tile.anims.stop();

              if (index === 2) {
                tile.setTexture(newTile);
                tile.setOrigin(0.5, 0.5);

                // Update mapArray
                const tileIndex = scene.mapTiles.indexOf(tile);
                if (tileIndex !== -1) {
                  scene.mapArray[tileIndex] = newTile;
                }

                // Update tileChanges
                const tileId = tile.id;
                if (tileId !== undefined) {
                  const changeIndex = scene.tileChanges.findIndex(
                    (t) => t.id === tileId
                  );
                  if (changeIndex !== -1) {
                    scene.tileChanges[changeIndex].newTileType = newTile;
                  } else {
                    scene.tileChanges.push({
                      id: tileId,
                      newTileType: newTile,
                    });
                  }
                }

                if (scene.anims.exists(newTile)) {
                  tile.play({ key: newTile, randomFrame: true });
                } else {
                  tile.anims.stop();
                  console.log("Tile animation not found: " + newTile);
                }
              } else {
                // All other tiles in tileArray are set to "null"
                tile.setTexture("null");
                tile.setOrigin(0.5, 0.5);

                // Update mapArray
                const tileIndex = scene.mapTiles.indexOf(tile);
                if (tileIndex !== -1) {
                  scene.mapArray[tileIndex] = "null";
                }

                // Update tileChanges
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

            // Save updated tileChanges to localStorage
            const savedMap = JSON.parse(localStorage.getItem("savedMap")) || {};
            savedMap.tileChanges = scene.tileChanges;
            localStorage.setItem("savedMap", JSON.stringify(savedMap));
            console.log("Tile changes saved to localStorage in if block.");
            return;
          }

          //the medium Tile Logic
          else if (placeTile && tileArray.length == 4) {
            //console.log("Clearing animations for all tiles in tileArray.");
            tileArray.forEach((tile) => {
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
              console.log(this.tileChanges);
            });

            const centerTile = tileArray[1];
            const centerTileIndex = scene.mapTiles.indexOf(centerTile);
            if (centerTileIndex !== -1) {
              scene.mapArray[centerTileIndex] = newTile;
            }

            const centerTileId = centerTile.id; //
            if (typeof centerTileId !== "undefined") {
              const existingIndex = scene.tileChanges.findIndex(
                (t) => t.id === centerTileId
              );
              if (existingIndex !== -1) {
                scene.tileChanges[existingIndex].newTileType = newTile;
              } else {
                scene.tileChanges.push({
                  id: centerTileId,
                  newTileType: newTile,
                });
              }
            }

            const savedMap = JSON.parse(localStorage.getItem("savedMap")) || {};
            savedMap.tileChanges = scene.tileChanges;
            localStorage.setItem("savedMap", JSON.stringify(savedMap));
            console.log("Setting texture and origin for the medium tile.");

            tileArray[1].setTexture(newTile);
            tileArray[1].setOrigin(0.25, 0.47);

            if (scene.anims.exists(newTile)) {
              console.log("Playing animation for medium tile:", newTile);
              tileArray[1].play({ key: newTile, randomFrame: true });
            } else {
              //console.log("No animation exists for medium tile:", newTile);
            }
            return;
          }
        } else if (destroy) {
          //for (let i = 0; i < tileCheckArray.length; i++){
          //    tileCheckArray[i].setTint(0xf0000f);

          //}

          let currentSpriteWidth = tileArray[0].width;

          tileArray[0].play("bulldozing");
          tileArray[0].texture.key = "ground";
          scene.mapTiles[tile0].texture.key = "ground";
          scene.mapTiles[tile0].setOrigin(0.5, 0.5);
          scene.mapArray[tile0] = "ground";
          newTileType = "ground";
          this.scene.updateClimateScore();

          // let newClimateNum = climateNum - 1;
          // climateNum = newClimateNum;
          // scene.climateText.text = `Total Regional Climate Impact: ${climateNum}`;

          if (currentSpriteWidth == 96) {
            console.log("destroy large tile");
            for (let i = 0; i < tilePosArray.length; i++) {
              let checkForNull = scene.mapTilesPos.indexOf(tilePosArray[i]);
              console.log(checkForNull);

              scene.mapTiles[checkForNull].play("bulldozing");

              scene.mapTiles[checkForNull].setTexture("ground");
            }
          } else if (currentSpriteWidth == 64) {
            console.log("destroy medium tile");
            for (let i = 0; i < 4; i++) {
              let checkForNull = scene.mapTilesPos.indexOf(tilePosArray[i]);

              console.log(checkForNull);

              scene.mapTiles[checkForNull].play("bulldozing");

              scene.mapTiles[checkForNull].setTexture("ground");
            }
          } else {
          }
        } else if (bike && tileArray[0].texture.key === "road") {
          tileArray[0].setTexture("bike", tileArray[0].frame.name);
          newTileType = "bike";
        } else {
        }
        console.log("sister");
        console.log(id, newTileType);
        // Update mapArray (old feature)
        if (newTileType !== null && id !== undefined) {
          const tileIndex = scene.mapTiles.indexOf(this);
          if (tileIndex !== -1) {
            scene.mapArray[tileIndex] = newTileType;
          }

          // Update tileChanges array and save to localStorage
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
          localStorage.setItem("savedMap", JSON.stringify(savedMap));
          console.log("Tile changes saved to localStorage.");
          // snapshot after successful player change
          scene.saveState();
        }

        // charge construction cost
        if (this.scene.economySim && newTileType) {
          this.scene.economySim.chargeFor(newTileType);
        }

        // immediate sim refresh for power/budget
        this.scene.citySim?.immediateUpdate();

        // Update mapArray (old feature)
        if (newTileType !== null && id !== undefined) {
          const tileIndex = scene.mapTiles.indexOf(this);
          if (tileIndex !== -1) {
            scene.mapArray[tileIndex] = newTileType;
          }

          // Update tileChanges array and save to localStorage
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
          localStorage.setItem("savedMap", JSON.stringify(savedMap));
          console.log("Tile changes saved to localStorage.");
          // snapshot after successful player change
          scene.saveState();
        }
      });

      // Pointerout listener
      tile.on("pointerout", function (pointer) {
        for (let j = 0; j < tileArray.length; j++) {
          console.log(tileArray[j]);
          tileArray[j].clearTint();
        }
        if (infoBool) {
          for (let i = 0; i < scene.mapTiles.length; i++) {
            let mapTex = scene.mapTiles[i];
            mapTex.alpha = 1.0;

            scene.getInfo.text = "";
          }
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
      this.saveState();
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

  updateTileType(x, y, newTileType) {
    const key = `${x},${y}`; // Create a unique key based on tile position
    this.changedIndexesMap[key] = newTileType; // Save the new tile type
    this.saveState();
  }

  getNeighborsForTile(tile, scene) {
    tileArray = [];

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
    // let x5 = pX;
    // let y5 = pY - tileHeight;

    // let x6 = pX + tileWidth;
    // let y6 = pY;

    // let x7 = pX - tileWidth;
    // let y7 = pY;

    // let x8 = pX;
    // let y8 = pY + tileHeight;

    // let x9 = pX - tileWidth;
    // let y9 = pY - tileHeight;

    // let x10 = pX + tileWidth;
    // let y10 = pY - tileHeight;

    // let x11 = pX - tileWidth;
    // let y11 = pY + tileHeight;

    // let x12 = pX + tileWidth;
    // let y12 = pY + tileHeight;
    // let tile5Pos = x5 + ", " + y5;
    // let tile6Pos = x6 + ", " + y6;
    // let tile7Pos = x7 + ", " + y7;
    // let tile8Pos = x8 + ", " + y8;
    // let tile9Pos = x9 + ", " + y9;
    // let tile10Pos = x10 + ", " + y10;
    // let tile11Pos = x11 + ", " + y11;
    // let tile12Pos = x12 + ", " + y12;

    tilePosArray.push(
      tile0Pos,
      tile1Pos,
      tile2Pos,
      tile3Pos,
      tile4Pos
      // tile5Pos,
      // tile6Pos,
      // tile7Pos,
      // tile8Pos,
      // tile9Pos,
      // tile10Pos,
      // tile11Pos,
      // tile12Pos
    );

    // console.log(tilePosArray);

    // if (road) {
    //   tilePosArray.push(
    //     `${pX - tileWidth / 2}, ${pY - tileHeight / 2}`,
    //     `${pX + tileWidth / 2}, ${pY - tileHeight / 2}`,
    //     `${pX}, ${pY - tileHeight}`,
    //     `${pX + tileWidth}, ${pY}`,
    //     `${pX - tileWidth}, ${pY}`
    //   );
    // }

    // Process positions
    for (let j = 0; j < tilePosArray.length; j++) {
      const tileCheck = this.mapTilesPos.indexOf(tilePosArray[j]);

      if (tileCheck !== -1) {
        // console.log(this.mapTiles[tileCheck].texture.key);
        // console.log(this.mapTiles[tileCheck]);
        // mapTexArray.push(this.mapTiles[tileCheck].texture.key);

        tileArray.push(this.mapTiles[tileCheck]);
      } else {
        const invalidTile = { texture: { key: "invalid" } };
        // invalidTile.setTint(0x00ff00);
        tileArray.push(invalidTile);
      }
    }

    return tileArray;
  }

  setListeners() {
    this.emitter.on("MOVE MAP", this.MoveMap.bind(this));
    this.emitter.on("ZOOM MAP", this.ZoomMap.bind(this));
    this.emitter.on("ROTATE MAP", this.RotateMap.bind(this));
    this.emitter.on("INFO MAP", this.InfoMap.bind(this));
    this.emitter.on("DESTROY", this.Destroy.bind(this));
    this.emitter.on("PLANT TREES", this.PlantTrees.bind(this));
    //this.emitter.on("BUILD SMALL", this.BuildSmall.bind(this));
    this.emitter.on("BUILD MEDIUM", this.BuildMedium.bind(this));
    this.emitter.on("BUILD LARGE", this.BuildLarge.bind(this));
    //this.emitter.on("BUILD EXTRA LARGE", this.BuildExtraLarge.bind(this));
    this.emitter.on("BUILD ROAD", this.BuildRoad.bind(this));
    this.emitter.on("BUILD BIKE LANE", this.BuildBikeLane.bind(this));
    //this.emitter.on("BUILD WATER", this.BuildWater.bind(this));
    //this.emitter.on("BUILD HOUSE", this.BuildHouse.bind(this));
    //this.emitter.on("BUILD MEADOW", this.BuildMeadow.bind(this));
    this.emitter.on("BUILD WIND", this.BuildWind.bind(this));
    this.emitter.on("BUILD SOLAR", this.BuildSolar.bind(this));
    //this.emitter.on("BUILD GREEN", this.BuildGreen.bind(this));
    //this.emitter.on("GROW FOREST", this.GrowForest.bind(this));
    this.emitter.on("GO HOME", this.GoHome.bind(this));
    this.emitter.on("UN DO", this.UnDo.bind(this));
    this.input.keyboard.on('keydown-U', () => this.undoState());
    // key 'Q' for redo
    this.input.keyboard.on('keydown-Q', () => this.redoState());
  }
  updateClimateScore() {
    let score = 0;
    for (let tile of this.mapTiles) {
      score += findClimateNumber(tile.texture.key);
    }

    this.currentClimateScore = score;  // store for other systems

    if (this.climateText) {
      this.climateText.text = "Total Regional Climate Impact: " + score;
    } else {
      this.climateText = this.add
        .text(30, 556, "Total Regional Climate Impact: " + score, {
          color: "#ff6633",
        })
        .setShadow(1, 1, "#ff9933", 3, false, true);
      this.cameras.main.ignore(this.climateText);
    }

    return score;
  }

  //EVENTS:

  MoveMap() {
    moveBool = true;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = false;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;

    console.log();
  }

  ZoomMap() {
    moveBool = false;
    zoomBool = true;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = false;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  RotateMap() {
    moveBool = false;
    zoomBool = false;
    rotateBool = true;
    infoBool = false;

    destroy = false;

    smallTile = false;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  InfoMap() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = true;

    destroy = false;

    smallTile = false;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  Destroy() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = true;

    road = false;
    bike = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "destroy";
    n = 0;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  BuildSolar() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "power:plant (solar)";
    n = 0;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = true;
    homeBool = false;
  }

  BuildWind() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "wind";
    n = 0;

    road = false;
    bike = false;
    trees = false;
    wind = true;
    solar = false;
    homeBool = false;
  }

  PlantTrees() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "wood";
    n = 0;

    road = false;
    bike = false;
    trees = true;
    wind = false;
    solar = false;
    homeBool = false;
  }

  //BuildSmall() {
  //  smallTile = true;
  //  mediumTile = false;
  //  largeTile = false;
  //  xLargeTile = false;

  //  newTile = "wind";
  //  n = 0;

  //  destroy = false;
  //  grow = false;
  //  water = false;
  //  wind = true;

  //  road = false;
  //  bike = false;
  //}

  BuildMedium() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = true;
    largeTile = false;
    xLargeTile = false;

    newTile = "green_apartments";
    n = 0;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  BuildLarge() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = true;
    largeTile = true;
    xLargeTile = false;

    newTile = "hydrogen";
    n = 0;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  //BuildExtraLarge() {
  //  smallTile = true;
  //  mediumTile = true;
  //  largeTile = true;
  //  xLargeTile = true;

  //  newTile = "solar";
  //  n = 0;

  //  destroy = false;
  //  grow = false;
  //  water = false;
  //  wind = false;

  //  road = false;
  //  bike = false;
  //}
  UnDo() {
     console.log("Moving back to previous state");
     this.undoState();
   }

  BuildRoad() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "road";
    n = 0;

    road = true;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  BuildBikeLane() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "road";
    n = 0;

    road = false;
    bike = true;
    trees = false;
    wind = false;
    solar = false;
    homeBool = false;
  }

  GoHome() {
    moveBool = false;
    zoomBool = false;
    rotateBool = false;
    infoBool = false;

    destroy = false;

    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;
    homeBool = false;

    newTile = "road";
    n = 0;

    road = false;
    bike = false;
    trees = false;
    wind = false;
    solar = false;
    homeBool = true;
  }/* ─────── state HISTORY (5-deep) ─────── */
  saveState() {
    // build a lightweight snapshot (NO live Phaser objects)
    const snap = {
      tiles: this.mapTiles.map(t => ({
        gridX:  t.gridX,
        gridY:  t.gridY,
        x:      t.x,
        y:      t.y,
        key:    t.texture.key,
        frame:  t.frame?.name ?? 0,
        type:   t.type ?? null,
        id:     t.id   ?? null
      })),
      mapTilesPos  : [...this.mapTilesPos],
      mapTilesType : [...this.mapTilesType],
      mapArray     : [...this.mapArray],
      tileChanges  : JSON.parse(JSON.stringify(this.tileChanges)),
      changedIdx   : { ...(this.changedIndexesMap || {}) },
      climateNum   : climateNum
    };

    // push & trim (FIFO)
    this._history.push(snap);
    if (this._history.length > this._historyMax) this._history.shift();
    // clearing redo stack because a brand-new change invalidates forward history
    if (this._redo) this._redo.length = 0;
  }

  undoState() {
    // store a snapshot for redo before moving back
    if (this._redo) {
      const currentSnap = this.__captureSnapshot();
      this._redo.push(currentSnap);
    }
    // need at least two snapshots (current + previous)
    if (this._history.length < 2) return;

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
                     .setInteractive({ pixelPerfect:true, alphaTolerance:1 });
      s.gridX = d.gridX;
      s.gridY = d.gridY;
      s.type  = d.type;
      s.id    = d.id;
      this.mapContainer.add(s);
      this.mapTiles.push(s);
    });

    // 3. restore parallel structures
    this.mapTilesPos      = [...snap.mapTilesPos];
    this.mapTilesType     = [...snap.mapTilesType];
    this.mapArray         = [...snap.mapArray];
    this.tileChanges      = JSON.parse(JSON.stringify(snap.tileChanges));
    this.changedIndexesMap= { ...snap.changedIdx };
    climateNum            = snap.climateNum;

    // 4. re-compute visuals / score
    this.mapContainer.sort('y');
    this.updateClimateScore?.();
    updateAllRoadPatterns?.(this);
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
    this._history.push(snap);
    if (this._history.length > this._historyMax) this._history.shift();

    // Rebuild board from snapshot
    this.mapTiles.forEach(s => s.destroy());
    this.mapTiles.length = 0;

    snap.tiles.forEach(d => {
      const s = this.add.sprite(d.x, d.y, d.key, d.frame)
                     .setScale(setScale)
                     .setOrigin(d.key === "green_apartments" ? 0.25 : 0.5,
                                d.key === "green_apartments" ? 0.47 : 0.5)
                     .setInteractive({ pixelPerfect:true, alphaTolerance:1 });
      s.gridX = d.gridX;
      s.gridY = d.gridY;
      s.type  = d.type;
      s.id    = d.id;
      this.mapContainer.add(s);
      this.mapTiles.push(s);
    });

    this.mapTilesPos      = [...snap.mapTilesPos];
    this.mapTilesType     = [...snap.mapTilesType];
    this.mapArray         = [...snap.mapArray];
    this.tileChanges      = JSON.parse(JSON.stringify(snap.tileChanges));
    this.changedIndexesMap= { ...snap.changedIdx };
    climateNum            = snap.climateNum;

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
