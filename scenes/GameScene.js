import { processBoundingBoxes } from "../os.js";
import { fetchLocation } from "../os.js";
import { groupTiles } from "../os.js";

const spriteWidth = 32;
const spriteHeight = spriteWidth / 2;

var factor = 4;

var boxSize = 0.0028;

var tileWidth = spriteWidth / factor;
var tileHeight = spriteHeight / factor;
var setScale = 1 / factor;

var smallTile;
var mediumTile;
var largeTile;
var xLargeTile;

let tileArray = [];
let mapTexArray = [];

let hideTileArray = [];
let tileArrayRoad = [];

let newTile;
let n;

var destroy;
var grow;
var road;
var bike;
var wind;
var water;

const mapTilesWidth = 5;
const mapTilesHeight = mapTilesWidth;

let isDraggingSprite = false;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("playingGame");
    this.getInfo = null;
    this.startX = 0;
    this.startY = 0;
    this.mapContainer = null;
    this.mapTiles = [];
    this.mapTilesPos = [];
    this.mapTilesType = [];
    this.mapArray = [];
    this.results = [];
  }

  preload() {
    this.load.image("button", "assets/button.png");
    this.load.image("button_clicked", "assets/button_clicked.png");
    this.load.image("UI_bkgd", "assets/UI_bkgd.png");

    this.load.image("industrial", "assets/all/warehouse.png");
    this.load.image("wood", "assets/all/forest.png");
    this.load.image("power:plant", "assets/all/power_solar.png");
    this.load.image("empty", "assets/all/empty.png");
    this.load.image("church", "assets/all/church.png");
    this.load.image("university", "assets/all/university.png");
    this.load.image("school", "assets/all/school.png");
    this.load.image("grass", "assets/all/grass.png");
    this.load.image("grassland", "assets/all/grass.png");
    this.load.image("swimming_pool", "assets/all/swimming_pool.png");
    this.load.image("no data", "assets/all/no_data.png");
    this.load.image("commercial", "assets/all/commercial.png");
    this.load.image("playground", "assets/all/playground.png");
    this.load.image("golf_course", "assets/all/golf_course.png");
    this.load.image("public", "assets/all/grass.png");
    this.load.image("hospital", "assets/all/hospital.png");
    this.load.image("apartments", "assets/all/apartments_medium.png");
    this.load.image("religious", "assets/all/church.png");
    this.load.image("social_facility", "assets/all/social_facility.png");
    this.load.image("playground", "assets/all/playground.png");
    this.load.image("office", "assets/all/office_medium.png");
    this.load.image("nature_reserve", "assets/all/nature_reserve.png");
    this.load.image("substation", "assets/all/substation.png");
    this.load.image("military", "assets/all/military.png");
    this.load.image("shed", "assets/all/shed.png");
    this.load.image("sports_centre", "assets/all/sports_centre.png");
    this.load.image("meadow", "assets/all/meadow.png");
    this.load.image("cemetery", "assets/all/cemetery.png");
    this.load.image("quarry", "assets/all/quarry.png");
    this.load.image("plant_nursery", "assets/all/plant_nursery.png");
    this.load.image("hotel", "assets/all/hotel.png");
    this.load.image("parking", "assets/all/parking.png");
    this.load.image("garages", "assets/all/parking.png");
    this.load.image("brownfield", "assets/all/brownfield.png");

    this.load.spritesheet("farmland", "assets/all/farm.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("farmyard", "assets/all/farm.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("reservoir", "assets/all/water_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("construction", "assets/all/construction_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("wetland", "assets/all/wetland_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("dump_station", "assets/all/dump_station_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("landfill", "assets/all/landfill.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("park", "assets/all/park.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("pitch", "assets/all/pitch.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("recreation_ground", "assets/all/pitch.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("house", "assets/all/detached.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("detached", "assets/all/detached.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("neighbourhood", "assets/all/neighbourhood.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("residential", "assets/all/residential.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("scrub", "assets/all/scrub.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("retail", "assets/all/retail.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("water", "assets/all/pond.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet("tiles", "assets/test_spritesheet.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("tiles_med", "assets/test_med_spritesheet.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("destroy", "assets/ground_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("grow", "assets/grow_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("brian", "assets/brian_spritesheet.png", {
      frameWidth: 32,
      frameHeight: 64,
    });
    this.load.spritesheet("farm", "assets/farm.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet("pond_b", "assets/pond_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("tree_b", "assets/tree_anim.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("road", "assets/road.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("bike", "assets/road_with_bike.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet("wind", "assets/wind_power_anim.png", {
      frameWidth: 32,
      frameHeight: 64,
    });

    this.load.image("green_building", "assets/forest_building.png");
    this.load.image("skyscraper", "assets/building.png");
    this.load.image("forest", "assets/brian_forest.png");
    this.load.image("solar", "assets/solar.png");
    this.load.image("hydrogen", "assets/hydrogen.png");
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

    //CAMERAS:
    const camGame = this.cameras.main;
    camGame.setBounds(0, 0, gWidth, gHeight);
    camGame.setZoom(1);
    camGame.centerOn = (0, 0);

    const camInfo = this.cameras.add(30, 550, 130, 555);
    camInfo.setOrigin(0, 0);
    camInfo.setZoom(1);
    camInfo.setBackgroundColor(0x00000);

    // BACKGROUND:
    const Background_color = this.add.graphics({
      fillStyle: { color: 0xa7e3ff },
    });
    const Background = new Phaser.Geom.Rectangle(0, 0, 1000, 600);
    Background_color.fillRectShape(Background);
    camInfo.ignore(Background);

    // Now declared in Constructor const getInfo = this.add.text(0, 0, 'info');
    this.getInfo = this.add.text(0, 0, "info");
    camGame.ignore(this.getInfo);
    console.log("calledanimatoins");
    //animations
    this.createAnimations();

    // CREATE MAP:
    /*TileWidthHalf is out of use , (they were used only 2 times,
         replaced that with,"tileWidth/2" instead of "tileWidth"),,same for tileHweightHalf
         can be used again , if needed*/
    const tileWidthHalf = tileWidth / 2;
    const tileHeightHalf = tileHeight / 2;

    this.mapContainer = this.add.container(0, 0);

    this.startX = gWidth / 2 - ((spriteWidth * mapTilesWidth) / 2) * setScale;
    this.startY = gHeight / 2;

    try {
      if (data && data.resume) {
        await this.loadMap();
      } else {
        await this.startNewGame(boxSize, mapTilesWidth, mapTilesHeight);
      }

      //   let results=await this.fetchLocationAndBoundingBoxes(boxSize,mapTilesWidth,mapTilesHeight);
      //   results= await this.countArtificialTiles(results);
      //   this.layTilesOnPlayboard(results,mapTilesHeight,mapTilesWidth);
      this.getInfo.text = "";

      const clusters = groupTiles(mapTilesHeight, mapTilesWidth, this.results);

      // Function to print all elements of the clusters
      function printClusters(clusters) {
        clusters.forEach((cluster, clusterIndex) => {
          console.log(`Cluster ${clusterIndex + 1}:`);
          console.log(`  Type: ${cluster.type}`);
          console.log("  Tiles:");
          cluster.tiles.forEach((tile, tileIndex) => {
            console.log(`    ${tileIndex + 1}. (${tile.x}, ${tile.y})`);
          });
        });
      }

      // Call the function to print clusters
      printClusters(clusters);
    } catch (error) {
      console.error("Error fetching land use data:", error);
    }

    this.cameras.main.scrollX = -this.startX;
    this.cameras.main.scrollY = -this.startY;

    // MAP INTERACTIVITIY:
    // (see TileArrayTempate.png for tile numbers)
    var placeTile = false;

    for (i = 0; i < this.mapTiles.length; i++) {
      const scene = this;

      //for pointerover
      this.mapTiles[i].on("pointerover", function (pointer) {
        //console.log(mapTiles.indexOf(this));

        pX = this.x;
        pY = this.y;

        let tile0 = scene.mapTiles.indexOf(this);
        let mapTex0 = scene.mapTiles[tile0].texture.key;

        let useType = scene.mapTilesType[tile0];
        console.log(mapTex0);

        let tilePosArray = [];

        if (smallTile === true) {
          mapTexArray = [];
          mapTexArray.push(mapTex0);
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
            mapTexArray.push(scene.mapTiles[tileCheck].texture.key);
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

        if (destroy === true) {
          placeTile = true;
          tileArray[0].setTint(0x000000);
        } else if (
          mapTexArray[0] === "destroy" &&
          allAreEqual(mapTexArray) === true &&
          road === false &&
          bike === false
        ) {
          placeTile = true;
          for (i = 0; i < tileArray.length; i++) {
            tileArray[i].setTint(0x00ff00);
          }
        } else if (road === true) {
          if (mapTexArray[0] === "destroy") {
            placeTile = true;
            tileArray[0].setTint(0x00ff00);
          } else {
            placeTile = false;
            tileArray[0].setTint(0xf0000f);
          }
        } else if (mapTexArray[0] === "road" && bike === true) {
          placeTile = true;
          tileArray[0].setTint(0x00ff00);
        } else {
          placeTile = false;
          for (i = 0; i < tileArray.length; i++) {
            tileArray[i].setTint(0xf0000f);
          }
        }

        function sendData() {
          let info = mapTex0;
          console.log(info);

          return info;
        }

        //getInfo.text = sendData();

        scene.getInfo.text = useType;

        return tileArray;
      });

      //for pointerdown
      this.mapTiles[i].on("pointerdown", function (pointer) {
        if (placeTile === true && this.texture.key !== "road") {
          tileArray[0].setTexture(newTile, n);

          if (tileArray.length >= 4 && road === false) {
            for (i = 1; i < tileArray.length; i++) {
              hideTileArray.push(tileArray[i]);
            }

            for (i = 0; i < hideTileArray.length; i++) {
              hideTileArray[i].setTexture("empty");
            }
          } else {
          }
        } else {
        }

        if (destroy === true) {
          this.play("bulldozing");

          if (hideTileArray.length > 0) {
            for (i = 0; i < hideTileArray.length; i++) {
              hideTileArray[i].play("bulldozing");
            }
            hideTileArray = [];
          }
        } else if (wind === true) {
          this.play("power_wind");
        } else if (water === true) {
          this.play("water");
        }

        //Set road sprites:
        else if (road === true) {
          //none
          if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // straight - 1
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // straight - 2
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 1);
          }

          // straight - 3
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 1);
          }

          // straight - 4
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // straight (middle) - 1,4
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // straight (middle) - 2,3
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 1);
          }

          // road + - 5
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // road + - 6
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // road + - 7
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // road + - 8
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
          }

          // road + (top turn) - 1,2
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[2].setTexture(newTile, 1);
            tileArray[0].setTexture(newTile, 3);
          }

          // road + (bottom turn) - 3,4
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 2);
            tileArray[3].setTexture(newTile, 1);
          }

          // road + (left turn) - 1,3
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 4);
            tileArray[3].setTexture(newTile, 1);
          }

          // road + (right turn) - 2,4
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 5);
            tileArray[2].setTexture(newTile, 1);
          }

          // top turn - 1,7
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[9].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[1].setTexture(newTile, 2);
          }

          // top turn - 2,6
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[10].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 2);
          }

          // bottom turn - 3,7
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[11].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 3);
          }

          // bottom turn - 4,6
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[12].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[4].setTexture(newTile, 3);
          }

          // left turn - 1,5
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[1].setTexture(newTile, 5);
          }

          // left turn - 3,8
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 5);
          }

          // right turn - 2,5
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[10].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 4);
          }

          // right turn - 4,8
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[4].setTexture(newTile, 4);
          }

          // top turn - 1,4,7
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[1].setTexture(newTile, 2);
          }

          // top turn - 2,3,6
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 2);
            tileArray[3].setTexture(newTile, 1);
          }

          // bottom turn - 1,4,6
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[4].setTexture(newTile, 3);
          }

          // bottom turn - 2,3,7
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 3);
          }

          // 3 road - 1,5,7
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[9].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[1].setTexture(newTile, 7);
          }

          // 3 road - 1,7,9
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[9].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[1].setTexture(newTile, 8);
          }

          // 3 road - 2,5,6
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[10].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 8);
          }

          // 3 road - 2,5,10
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[10].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 9);
          }

          // 3 road - 2,6,10
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[10].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 7);
          }

          // 3 road - 3,7,8
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key == "road" &&
            tileArray[11].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 6);
          }

          // 3 road - 3,7,11
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[11].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 9);
          }

          // 3 road - 4,6,8
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key == "road" &&
            tileArray[12].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[4].setTexture(newTile, 9);
          }

          // 3 road - 4,6,12
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[12].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[4].setTexture(newTile, 6);
          }

          // 4 road - 1,5,7,9
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[9].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[1].setTexture(newTile, 10);
          }

          // 4 road - 2,5,6,10
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road" &&
            tileArray[10].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[2].setTexture(newTile, 10);
          }

          // 4 road - 3,7,8,11
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key == "road" &&
            tileArray[11].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 1);
            tileArray[3].setTexture(newTile, 10);
          }

          // 4 road - 4,6,8,12
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key == "road" &&
            tileArray[12].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            tileArray[4].setTexture(newTile, 10);
          }

          // none - 1,3,7
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key == "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            //play error sound
          }

          // none - 2,4,6
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key == "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            //play error sound
          }

          // none - 1,2,5
          else if (
            tileArray[1].texture.key == "road" &&
            tileArray[2].texture.key == "road" &&
            tileArray[3].texture.key !== "road" &&
            tileArray[4].texture.key !== "road" &&
            tileArray[5].texture.key == "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key !== "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            //play error sound
          }

          // none - 3,4,8
          else if (
            tileArray[1].texture.key !== "road" &&
            tileArray[2].texture.key !== "road" &&
            tileArray[3].texture.key == "road" &&
            tileArray[4].texture.key == "road" &&
            tileArray[5].texture.key !== "road" &&
            tileArray[6].texture.key !== "road" &&
            tileArray[7].texture.key !== "road" &&
            tileArray[8].texture.key == "road"
          ) {
            this.play("bulldozing");
            this.stop("bulldozing");
            tileArray[0].setTexture(newTile, 0);
            //play error sound
          } else {
          }
        } else if (bike === true) {
          if (tileArray[0].texture.key === "road") {
            let f = tileArray[0].frame.name;
            tileArray[0].setTexture("bike", f);
          } else {
          }
        } else {
        }
      });

      //for pointerout
      this.mapTiles[i].on("pointerout", function (pointer) {
        for (i = 0; i < tileArray.length; i++) {
          if (tileArray.length > 0 && tileArray[i] != -1) {
            tileArray[i].clearTint();
          } else {
          }
        }
      });
    }

    ///UISCENE

    this.UIScene = new UIScene({ scene: this });
    this.setListeners();

    camGame.ignore(this.UIScene.buttons);

    camInfo.ignore(this.UIScene.buttons);
    camInfo.ignore(this.mapTiles);
    camInfo.ignore(Background);

    this.input.on(
      "pointerdown",
      function (pointer) {
        if (!isDraggingSprite) {
          // Only allow map dragging if no sprite is being dragged
          this.dragStartX = pointer.x - this.mapContainer.x;
          this.dragStartY = pointer.y - this.mapContainer.y;
          this.isDragging = true;
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

    spaceBar.on("down", function () {
      if (camGame.zoom == 1) {
        camGame.setZoom(2);
      } else if (camGame.zoom == 2) {
        camGame.setZoom(4);
      } else if (camGame.zoom == 4) {
        camGame.setZoom(6);
      } else if (camGame.zoom == 6) {
        camGame.setZoom(8);
      } else if (camGame.zoom == 8) {
        camGame.setZoom(1);
      } else {
      }
    });

    spaceBar.on("up", function () {});
  }

  async startNewGame(boxSize, mapTilesWidth, mapTilesHeight) {
    await this.fetchLocationAndBoundingBoxes(
      boxSize,
      mapTilesWidth,
      mapTilesHeight
    );
  }

  recreateMap(mapArray) {
    if (this.mapContainer) {
      this.mapContainer.destroy();
    }
    this.mapContainer = this.add.container(0, 0);
    for (let y = 0; y < mapTilesHeight; y++) {
      for (let x = 0; x < mapTilesWidth; x++) {
        const index = y * mapTilesWidth + x;
        const tileType = mapArray[index];
        this.layTilesOnPlayboard(tileType, x, y);
      }
    }
  }

  layTilesOnPlayboard(tileType, x, y) {
    this.getInfo.text = "processing map...";

    // Calculate isometric coordinates
    let isoX = this.startX + ((x - y) * tileWidth) / 2;
    let isoY = this.startY + ((x + y) * tileHeight) / 2;

    let tile = this.add.sprite(isoX, isoY, tileType); // Create sprite using tileType
    let tilePosStr = isoX + ", " + isoY;
    tile.setScale(setScale);
    tile.setOrigin(0.5, 1);
    tile.smoothed = false;
    tile.play({ key: tileType, randomFrame: true });

    /*if (exists(tileType) === true) {
                    tile.play({ key: tileType, randomFrame: true });
                }
                else { }*/

    tile.setInteractive({
      pixelPerfect: true,
      alphaTolerance: 1,
    });
    // Track tile index in mapArray
    const tileIndex = y * mapTilesWidth + x;

    // Add event listener for user interaction
    tile.on("pointerdown", () => {
      // Logic for adding or removing a tile, for example:
      const newTileType = "destroy"; // Example of removing the tile
      tile.setTexture(newTileType);

      // Update the mapArray with the new tile type
      this.mapArray[tileIndex] = newTileType;

      // Optionally, save the updated mapArray to localStorage to persist changes
      localStorage.setItem("savedMap", JSON.stringify(this.mapArray));

      console.log(`Tile at index ${tileIndex} updated to: ${newTileType}`);
    });

    this.mapContainer.add(tile);
    this.mapTiles.push(tile);
    this.mapTilesPos.push(tilePosStr);
    this.mapTilesType.push(tileType);
  }
  // Function to fetch the location and bounding box data
  async fetchLocationAndBoundingBoxes(boxSize, mapTilesWidth, mapTilesHeight) {
    try {
      const { minLat, minLon } = await fetchLocation();
      const minLatNum = parseFloat(minLat);
      const minLonNum = parseFloat(minLon);

      const initialBoundingBox = {
        minLat: minLatNum,
        minLon: minLonNum,
        maxLat: minLatNum + boxSize,
        maxLon: minLonNum + boxSize,
      };
      console.log(mapTilesWidth, mapTilesHeight);

      const countX = mapTilesWidth; // Number of horizontal subdivisions
      const countY = mapTilesHeight; // Number of vertical subdivisions

      console.log(`countX: ${countX}, countY: ${countY}`);

      const results = await processBoundingBoxes(
        initialBoundingBox,
        countX,
        countY
      );

      this.results = results;
      this.mapArray = results.map((result) => result);

      localStorage.setItem("savedMap", JSON.stringify(this.mapArray));
      console.log(this.mapArray);
      // Recreate the map visually
      this.recreateMap(this.mapArray);
    } catch (error) {
      console.error("Error fetching land use data:", error);
      throw error;
    }
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

  async loadMap() {
    const savedMapString = localStorage.getItem("savedMap");
    if (savedMapString) {
      const mapArray = JSON.parse(savedMapString);
      this.mapArray = mapArray;
      this.recreateMap(mapArray);
    } else {
      alert("No saved map found. Starting a new game.");
      await this.startNewGame(boxSize, mapTilesWidth, mapTilesHeight);
    }
  }

  createAnimations() {
    // ANIMATIONS:
    this.anims.create({
      key: "bulldozing",
      frames: this.anims.generateFrameNumbers("destroy", {
        frames: [0, 1, 2, 3, 4],
      }),
      frameRate: 4,
      repeat: 0,
    });

    this.anims.create({
      key: "reservior",
      frames: this.anims.generateFrameNumbers("reservoir", {
        frames: [0, 1, 2],
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "construction",
      frames: this.anims.generateFrameNumbers("construction", {
        frames: [0, 1, 2, 3, 4, 5],
      }),

      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "farmland",
      frames: this.anims.generateFrameNumbers("farmland", {
        frames: [0, 1, 2, 3, 4, 5, 6, 7],
      }),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: "house",
      frames: this.anims.generateFrameNumbers("house", {
        frames: [0, 1, 2, 3, 4, 5, 6, 7],
      }),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: "detached",
      frames: this.anims.generateFrameNumbers("house", {
        frames: [0, 1, 2, 3, 4, 5, 6, 7],
      }),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: "wetland",
      frames: this.anims.generateFrameNumbers("wetland", { frames: [0, 1, 2] }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: "water",
      frames: this.anims.generateFrameNumbers("water", { frames: [0, 1, 2] }),
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: "landfill",
      frames: this.anims.generateFrameNumbers("landfill", {
        frames: [0, 1, 2],
      }),
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: "dump_station",
      frames: this.anims.generateFrameNumbers("dump_station", {
        frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      }),
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: "park",
      frames: this.anims.generateFrameNumbers("park", {
        frames: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
        ],
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "pitch",
      frames: this.anims.generateFrameNumbers("pitch", {
        frames: [0, 1, 2, 3, 4],
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "recreation_ground",
      frames: this.anims.generateFrameNumbers("pitch", {
        frames: [0, 1, 2, 3, 4],
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "neighbourhood",
      frames: this.anims.generateFrameNumbers("neighbourhood", {
        frames: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        ],
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "residential",
      frames: this.anims.generateFrameNumbers("residential", {
        frames: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
          37, 38, 39,
        ],
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "scrub",
      frames: this.anims.generateFrameNumbers("scrub", { frames: [0, 1] }),
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: "retail",
      frames: this.anims.generateFrameNumbers("retail", {
        frames: [0, 1, 2, 3],
      }),
      frameRate: 1,
      repeat: -1,
    });
  }

  setListeners() {
    this.emitter.on("DESTROY", this.Destroy.bind(this));
    this.emitter.on("PLANT TREES", this.PlantTrees.bind(this));
    this.emitter.on("BUILD 32", this.Build32.bind(this));
    this.emitter.on("BUILD 64", this.Build64.bind(this));
    this.emitter.on("BUILD 96", this.Build96.bind(this));
    this.emitter.on("BUILD 128", this.Build128.bind(this));
    this.emitter.on("BUILD ROAD", this.BuildRoad.bind(this));
    this.emitter.on("BUILD BIKE LANE", this.BuildBikeLane.bind(this));
    this.emitter.on("BUILD WATER", this.BuildWater.bind(this));
    this.emitter.on("BUILD HOUSE", this.BuildHouse.bind(this));
    this.emitter.on("BUILD MEADOW", this.BuildMeadow.bind(this));
    this.emitter.on("BUILD WIND", this.BuildWind.bind(this));
    this.emitter.on("BUILD GREEN", this.BuildGreen.bind(this));
    this.emitter.on("GROW FOREST", this.GrowForest.bind(this));
  }

  //EVENTS:

  Destroy() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "destroy";
    n = 0;

    destroy = true;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  PlantTrees() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "brian";
    n = 12;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;

    console.log(newTile, n);
  }

  Build32() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "brian";
    n = 3;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  Build64() {
    smallTile = true;
    mediumTile = true;
    largeTile = false;
    xLargeTile = false;

    newTile = "skyscraper";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  Build96() {
    smallTile = true;
    mediumTile = true;
    largeTile = true;
    xLargeTile = false;

    newTile = "hydrogen";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  Build128() {
    smallTile = true;
    mediumTile = true;
    largeTile = true;
    xLargeTile = true;

    newTile = "solar";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  BuildRoad() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "road";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = true;
    bike = false;
  }

  BuildBikeLane() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "bike";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = true;
  }

  BuildHouse() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "house_b";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  BuildWater() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "wind";
    n = 0;

    destroy = false;
    grow = false;
    water = true;
    wind = false;

    road = false;
    bike = false;
  }

  BuildMeadow() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "brian";
    n = 8;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  BuildWind() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "brian";
    n = 13;

    destroy = false;
    grow = false;
    water = false;
    wind = true;

    road = false;
    bike = false;
  }

  BuildGreen() {
    smallTile = true;
    mediumTile = false;
    largeTile = false;
    xLargeTile = false;

    newTile = "brian";
    n = 9;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  GrowForest() {
    smallTile = true;
    mediumTile = true;
    largeTile = false;
    xLargeTile = false;

    newTile = "green_building";
    n = 0;

    destroy = false;
    grow = false;
    water = false;
    wind = false;

    road = false;
    bike = false;
  }

  //UPDATES:

  update() {}
}
