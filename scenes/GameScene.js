import { processBoundingBoxes } from '../os.js'; // Adjust path if necessary

const spriteWidth = 32;
const spriteHeight = spriteWidth / 2;

var factor = 4;

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

let isDraggingSprite = false;
console.log("mai.js is loaded");

export class GameScene extends Phaser.Scene {
    

    constructor() {
        super("playingGame");
    }

    preload() {

        this.load.image('button', 'assets/button.png');
        this.load.image('button_clicked', 'assets/button_clicked.png');
        this.load.image('UI_bkgd', 'assets/UI_bkgd.png');

        this.load.image('red', 'assets/red_tile.png');
        this.load.image('blue', 'assets/blue_tile.png');
        this.load.image('empty', 'assets/empty.png');

        this.load.image('green_building', 'assets/forest_building.png');
        this.load.image('skyscraper', 'assets/building.png');
        this.load.image('forest', 'assets/brian_forest.png');
        this.load.image('solar', 'assets/solar.png');
        this.load.image('hydrogen', 'assets/hydrogen.png');

        this.load.spritesheet('tiles', 'assets/test_spritesheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('tiles_med', 'assets/test_med_spritesheet.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('destroy', 'assets/ground_anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('grow', 'assets/grow_anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('brian', 'assets/brian_spritesheet.png', { frameWidth: 32, frameHeight: 64 });
        this.load.spritesheet('farm', 'assets/farm.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('house_b', 'assets/house.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('water_b', 'assets/water_anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('pond_b', 'assets/pond_anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('tree_b', 'assets/tree_anim.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('road', 'assets/road.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('bike', 'assets/road_with_bike.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('wind', 'assets/wind_power_anim.png', { frameWidth: 32, frameHeight: 64 });
        
    }
    
    async create() {

        this.emitter = EventDispatcher.getInstance();

        let mapTiles = [];
        let mapTilesPos = [];

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
        camGame.centerOn = (0,0);

        console.log(gWidth, gHeight);
        console.log(camGame.centerOn);

        // BACKGROUND:
        const Background_color = this.add.graphics({ fillStyle: { color: 0xA7E3FF } });
        const Background = new Phaser.Geom.Rectangle(0, 0, 1000, 600);
        Background_color.fillRectShape(Background);

        // ANIMATIONS:
            this.anims.create({
            
            key: 'bulldozing',
            frames: [
                { key: 'destroy', frame: 0 },
                { key: 'destroy', frame: 1 },
                { key: 'destroy', frame: 2 },
                { key: 'destroy', frame: 3 },
                { key: 'destroy', frame: 4 },
                { key: 'destroy', frame: 5 },
                { key: 'destroy', frame: 6 },
                { key: 'destroy', frame: 7 }
            ],
            frameRate: 4,
            repeat: 0
        });

            this.anims.create({
            key: 'growing',
            frames: [
                { key: 'grow', frame: 0 },
                { key: 'grow', frame: 1 },
                { key: 'grow', frame: 2 },
                { key: 'grow', frame: 3 },
            ],
            frameRate: 4,
            repeat: 0
        });

            this.anims.create({
            key: 'farming',
            frames: [
                { key: 'farm', frame: 0 },
                { key: 'farm', frame: 1 },
                { key: 'farm', frame: 2 },
                { key: 'farm', frame: 3 },
                { key: 'farm', frame: 4 },
                { key: 'farm', frame: 5 },
                { key: 'farm', frame: 6 },
                { key: 'farm', frame: 7 },
            ],
            frameRate: 4,
            repeat: -1,
        });

            this.anims.create({
            key: 'house',
            frames: [
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 1 },
                { key: 'house_b', frame: 2 },
                { key: 'house_b', frame: 3 },
                { key: 'house_b', frame: 4 },
                { key: 'house_b', frame: 5 },
                { key: 'house_b', frame: 6 },
                { key: 'house_b', frame: 7 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
                { key: 'house_b', frame: 0 },
            ],
            frameRate: 4,
            repeat: -1
        });

            this.anims.create({
            key: 'water',
            frames: [
                { key: 'water_b', frame: 0 },
                { key: 'water_b', frame: 1 },
                { key: 'water_b', frame: 2 },
            ],
            frameRate: 6,
            repeat: -1
        });

            this.anims.create({
            key: 'pond',
            frames: [
                { key: 'pond_b', frame: 0 },
                { key: 'pond_b', frame: 1 },
                { key: 'pond_b', frame: 2 },
            ],
            frameRate: 6,
            repeat: -1
        });

            this.anims.create({
            key: 'tree',
            frames: [
                { key: 'tree_b', frame: 0 },
                { key: 'tree_b', frame: 1 },
                { key: 'tree_b', frame: 2 },
                { key: 'tree_b', frame: 3 },
                { key: 'tree_b', frame: 4 },
                { key: 'tree_b', frame: 5 },
            ],
            frameRate: 3,
            repeat: -1
        });

            this.anims.create({
            key: 'power_wind',
            frames: [
                { key: 'wind', frame: 0 },
                { key: 'wind', frame: 1 },
                { key: 'wind', frame: 2 },
                { key: 'wind', frame: 3 },
                { key: 'wind', frame: 4 },
                { key: 'wind', frame: 5 },
                { key: 'wind', frame: 6 },
                { key: 'wind', frame: 7 },
            ],
            frameRate: 4,
            repeat: -1,
        });

    // CREATE MAP:

        const mapTilesWidth = 10;
        const mapTilesHeight = 10;

        const tileWidthHalf = tileWidth / 2;
        const tileHeightHalf = tileHeight / 2;

        const mapContainer = this.add.container(0, 0);

        const startX = (gWidth / 2) - ((spriteWidth * mapTilesWidth / 2) * setScale);
        const startY = gHeight / 2;

        console.log(startX, startY);
        // op.js (in folder y)
        // const tileTypesArray = require('Desktop/Maps/openstreet/os.js');  




    // Tile placement and making them interactive
////////////////////////////////////////////////////////////////////////////////////////////////////


// Creating a new array with 100 random selections from tileTypesArray

const totalTiles = 100;
const numberOfTilesToLay = 100;
const initialBoundingBox = {
    // minLat: 35.516584,
    // minLon: -96.978297,
    // maxLat: 35.633830,
    // maxLon: -97.027519,
    minLat: 35.425420,
    minLon: -97.683103,
    maxLat: 35.455629,
    maxLon: -97.607916,
};

const countX = 10; // Number of horizontal subdivisions
const countY = 10; // Number of vertical subdivisions


try {
    // Fetch the land use data
    const results = await processBoundingBoxes(initialBoundingBox, countX, countY);

    // Print the fetched data to the console
    const desiredCount = 100;
    const currentCount = results.length;
    
    if (currentCount < desiredCount) {
        // Calculate how many artificial elements to add
        const elementsToAdd = desiredCount - currentCount;
        console.log(`Adding ${elementsToAdd} artificial elements`);

        // Create artificial elements (for example, with a placeholder type)
        const artificialElements = Array(elementsToAdd).fill('artificial:placeholder');
        
        // Add the artificial elements to the results
        results.push(...artificialElements);
    }
    for (let y = 0; y < mapTilesHeight; y++) {
        for (let x = 0; x < mapTilesWidth; x++) {
            let index = y * mapTilesWidth + x; // Calculate index based on x and y
          

           
          //console.log("Looping",landUseData[0]);
            let tileType = results[index]; // Get tile type 
    
            // Calculate isometric coordinates
            let isoX = startX + (x - y) * tileWidthHalf;
            let isoY = startY + (x + y) * tileHeightHalf;
    
            let tile = this.add.sprite(isoX, isoY, tileType); // Create sprite using tileType
            let tilePosStr = isoX + ', ' + isoY;
            tile.setScale(setScale);
            tile.setOrigin(0.5, 1);
    
            if (tileType === 'residential') {
                tile.play({ key: 'tree', randomFrame: true });


            } else if (tileType === 'water') {
                tile.play({ key: 'water', randomFrame: true });
            } else if (tileType === 'industrial') {
                tile.play({ key: 'power_wind', randomFrame: true });
            } else if (tileType === 'green_building') {
                tile.play({ key: 'green_building', randomFrame: true });
            } else if (tileType === 'skyscraper') {
                tile.play({ key: 'skyscraper', randomFrame: true });
            } else {
                // Default case
                tile.play({ key: 'default_animation_key', randomFrame: true });
            }
    
            tile.setInteractive({
                pixelPerfect: true,
                alphaTolerance: 1
            });
    
            mapContainer.add(tile);
        }
    }
} catch (error) {
    console.error('Error fetching land use data:', error);
}

        

        console.log(mapTiles[0]);
        console.log(mapTilesPos[0]);

        this.cameras.main.scrollX = -startX;
        this.cameras.main.scrollY = -startY;

    // MAP INTERACTIVITIY:
        // (see TileArrayTempate.png for tile numbers)
        var placeTile = false;

        for (i = 0; i < mapTiles.length; i++) {

            //for pointerover
            mapTiles[i].on('pointerover', function (pointer) {

                console.log(mapTiles.indexOf(this));

                pX = this.x;
                pY = this.y;

                let tile0 = mapTiles.indexOf(this);
                let mapTex0 = mapTiles[tile0].texture.key;

                let tilePosArray = [];

                if (smallTile === true) {

                    mapTexArray = [];
                    mapTexArray.push(mapTex0);

                    tileArray = [];

                    let tile0Pos = pX + ', ' + pY;

                    tilePosArray = [];

                    tilePosArray.push(tile0Pos);

                }
                else { }

                if (mediumTile === true) {

                    let x1 = pX - tileWidth / 2;
                    let y1 = pY - tileHeight / 2;

                    let x2 = pX;
                    let y2 = pY - tileHeight;

                    let x3 = pX + tileWidth / 2;
                    let y3 = pY - tileHeight / 2;
                     
                    let tile1Pos = x1 + ', ' + y1;
                    let tile2Pos = x2 + ', ' + y2;
                    let tile3Pos = x3 + ', ' + y3;

                    tilePosArray.push(tile1Pos, tile2Pos, tile3Pos);

                }
                else { }

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

                    let tile4Pos = x4 + ', ' + y4;
                    let tile5Pos = x5 + ', ' + y5;
                    let tile6Pos = x6 + ', ' + y6;
                    let tile7Pos = x7 + ', ' + y7;
                    let tile8Pos = x8 + ', ' + y8;

                    tilePosArray.push(tile4Pos, tile5Pos, tile6Pos, tile7Pos, tile8Pos);

                }
                else { }

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

                    let tile9Pos = x9 + ', ' + y9;
                    let tile10Pos = x10 + ', ' + y10;
                    let tile11Pos = x11 + ', ' + y11;
                    let tile12Pos = x12 + ', ' + y12;
                    let tile13Pos = x13 + ', ' + y13;
                    let tile14Pos = x14 + ', ' + y14;
                    let tile15Pos = x15 + ', ' + y15;

                    tilePosArray.push(tile9Pos, tile10Pos, tile11Pos, tile12Pos, tile13Pos, tile14Pos, tile15Pos); 
                }
                else { }

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

                    let tile1Pos = x1 + ', ' + y1;
                    let tile2Pos = x2 + ', ' + y2;
                    let tile3Pos = x3 + ', ' + y3;
                    let tile4Pos = x4 + ', ' + y4;
                    let tile5Pos = x5 + ', ' + y5;
                    let tile6Pos = x6 + ', ' + y6;
                    let tile7Pos = x7 + ', ' + y7;
                    let tile8Pos = x8 + ', ' + y8;
                    let tile9Pos = x9 + ', ' + y9;
                    let tile10Pos = x10 + ', ' + y10;
                    let tile11Pos = x11 + ', ' + y11;
                    let tile12Pos = x12 + ', ' + y12;

                    tilePosArray.push(tile1Pos, tile2Pos, tile3Pos, tile4Pos, tile5Pos, tile6Pos, tile7Pos, tile8Pos, tile9Pos, tile10Pos, tile11Pos, tile12Pos);

                }
                else { }

                for (i = 0; i < tilePosArray.length; i++) {

                    let tileCheck = mapTilesPos.indexOf(tilePosArray[i]);

                    if (tileCheck !== -1) {

                        mapTexArray.push(mapTiles[tileCheck].texture.key);
                        tileArray.push(mapTiles[tileCheck]);
                    }
                    else { }

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
                }

                else if (mapTexArray[0] === 'destroy' && allAreEqual(mapTexArray) === true && road === false && bike === false) {

                    placeTile = true;
                    for (i = 0; i < tileArray.length; i++) {
                        tileArray[i].setTint(0x00ff00);
                    }
                }

                else if (road === true) {

                    if (mapTexArray[0] === 'destroy') {

                        placeTile = true;
                        tileArray[0].setTint(0x00ff00);
                    }

                    else {
                        placeTile = false;
                        tileArray[0].setTint(0xf0000f);                   
                    }
                }

                else if (mapTexArray[0] === 'road' && bike === true) {
                    placeTile = true;
                    tileArray[0].setTint(0x00ff00);
                }

                else {
                    placeTile = false;
                    for (i = 0; i < tileArray.length; i++) {
                        tileArray[i].setTint(0xf0000f);
                    }
                }

                return tileArray;
                

            });

            

            //for pointerdown
            mapTiles[i].on('pointerdown', function (pointer) {


                if (placeTile === true && this.texture.key !== 'road') {

                    tileArray[0].setTexture(newTile, n);
                    

                    if (tileArray.length >= 4 && road === false) {

                        for (i = 1; i < tileArray.length; i++) {

                            hideTileArray.push(tileArray[i]);
                        }

                        for (i = 0; i < hideTileArray.length; i++) {

                            hideTileArray[i].setTexture('empty');
                        }
                    }

                    else { }
                }

                else {}

                if (destroy === true) {

                    this.play('bulldozing');

                    if (hideTileArray.length > 0) {

                        for (i = 0; i < hideTileArray.length; i++) {
                            hideTileArray[i].play('bulldozing');
                        }
                        hideTileArray = [];
                    }
                }

                else if (wind === true) {

                    this.play('power_wind');
                }

                else if (water === true) {

                    this.play('water');
                }

                //Set road sprites:

                else if (road === true) {
                        
                        //none
                        if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // straight - 1
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // straight - 2
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 1);
                        }

                        // straight - 3                   
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 1);
                        }

                        // straight - 4
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // straight (middle) - 1,4
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // straight (middle) - 2,3
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 1);
                        }

                        // road + - 5
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // road + - 6
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // road + - 7
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // road + - 8
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                        }

                        // road + (top turn) - 1,2
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[2].setTexture(newTile, 1);
                            tileArray[0].setTexture(newTile, 3);
                        }

                        // road + (bottom turn) - 3,4
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 2);
                            tileArray[3].setTexture(newTile, 1);
                        }

                        // road + (left turn) - 1,3
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 4);
                            tileArray[3].setTexture(newTile, 1);
                        }

                        // road + (right turn) - 2,4
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 5);
                            tileArray[2].setTexture(newTile, 1);
                        }

                        // top turn - 1,7
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[9].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[1].setTexture(newTile, 2);
                        }

                        // top turn - 2,6
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[10].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 2);
                        }

                        // bottom turn - 3,7
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[11].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 3);
                        }

                        // bottom turn - 4,6
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[12].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[4].setTexture(newTile, 3);
                        }

                        // left turn - 1,5
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[1].setTexture(newTile, 5);
                        }

                        // left turn - 3,8
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 5);
                        }

                        // right turn - 2,5
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[10].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 4);
                        }

                        // right turn - 4,8
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[4].setTexture(newTile, 4);
                        }

                        // top turn - 1,4,7
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[1].setTexture(newTile, 2);
                        }

                        // top turn - 2,3,6
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 2);
                            tileArray[3].setTexture(newTile, 1);
                        }


                        // bottom turn - 1,4,6
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[4].setTexture(newTile, 3);
                        }

                        // bottom turn - 2,3,7
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 3);
                        }

                        // 3 road - 1,5,7
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[9].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[1].setTexture(newTile, 7);
                        }

                        // 3 road - 1,7,9
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[9].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[1].setTexture(newTile, 8);
                        }

                        // 3 road - 2,5,6
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[10].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 8);
                        }

                        // 3 road - 2,5,10
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[10].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 9);
                        }

                        // 3 road - 2,6,10
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[10].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 7);
                        }

                        // 3 road - 3,7,8
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key == 'road' &&
                            tileArray[11].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 6);
                        }

                        // 3 road - 3,7,11
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[11].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 9);
                        }

                        // 3 road - 4,6,8
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key == 'road' &&
                            tileArray[12].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[4].setTexture(newTile, 9);
                        }

                        // 3 road - 4,6,12
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[12].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[4].setTexture(newTile, 6);
                        }

                        // 4 road - 1,5,7,9
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[9].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[1].setTexture(newTile, 10);
                        }

                        // 4 road - 2,5,6,10
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road' &&
                            tileArray[10].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[2].setTexture(newTile, 10);
                        }

                        // 4 road - 3,7,8,11
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key == 'road' &&
                            tileArray[11].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 1);
                            tileArray[3].setTexture(newTile, 10);
                        }

                        // 4 road - 4,6,8,12
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key == 'road' &&
                            tileArray[12].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            tileArray[4].setTexture(newTile, 10);
                        }

                        // none - 1,3,7
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key == 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            //play error sound
                        }

                        // none - 2,4,6 
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key == 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            //play error sound
                        }

                        // none - 1,2,5 
                        else if (
                            tileArray[1].texture.key == 'road' &&
                            tileArray[2].texture.key == 'road' &&
                            tileArray[3].texture.key !== 'road' &&
                            tileArray[4].texture.key !== 'road' &&
                            tileArray[5].texture.key == 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key !== 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            //play error sound
                        }

                        // none - 3,4,8  
                        else if (
                            tileArray[1].texture.key !== 'road' &&
                            tileArray[2].texture.key !== 'road' &&
                            tileArray[3].texture.key == 'road' &&
                            tileArray[4].texture.key == 'road' &&
                            tileArray[5].texture.key !== 'road' &&
                            tileArray[6].texture.key !== 'road' &&
                            tileArray[7].texture.key !== 'road' &&
                            tileArray[8].texture.key == 'road') {
                            this.play('bulldozing');
                            this.stop('bulldozing');
                            tileArray[0].setTexture(newTile, 0);
                            //play error sound
                        }

                        else { }
                    }

                else if (bike === true) {

                    if (tileArray[0].texture.key === 'road') {

                        let f = tileArray[0].frame.name;
                        tileArray[0].setTexture('bike', f);

                    }
                    else { }

                }

                else { }
            });

            //for pointerout
            mapTiles[i].on('pointerout', function (pointer) { 

                for (i = 0; i < tileArray.length; i++) {

                    if (tileArray.length > 0 && tileArray[i] != -1) {
                        tileArray[i].clearTint();
                    }
                    else { }
                }
            });
        }

        this.UIScene = new UIScene({ scene: this });
        this.setListeners();

        camGame.ignore(this.UIScene.buttons);

        this.input.on('pointerdown', function (pointer) {
            if (!isDraggingSprite) { // Only allow map dragging if no sprite is being dragged
                this.dragStartX = pointer.x - mapContainer.x;
                this.dragStartY = pointer.y - mapContainer.y;
                this.isDragging = true;
            }
        }, this);

        this.input.on('pointermove', function (pointer) {
            if (this.isDragging && !isDraggingSprite) {
                mapContainer.x = pointer.x - this.dragStartX;
                mapContainer.y = pointer.y - this.dragStartY;
            }
        }, this);

        this.input.on('pointerup', function () {
            this.isDragging = false;
            if (this.tempSprite) { // Ensure to stop dragging the sprite as well
                isDraggingSprite = false;
            }
        }, this);

    // KEYBOARD INPUTS:
        //Space to Zoom,
        var spaceBar = this.input.keyboard.addKey('SPACE');
        var leftArrow = this.input.keyboard.addKey('LEFT');
        var rightArrow = this.input.keyboard.addKey('RIGHT');
        var upArrow = this.input.keyboard.addKey('UP');
        var downArrow = this.input.keyboard.addKey('DOWN');

        spaceBar.on('down', function () {

            if (camGame.zoom == 1) {
                camGame.setZoom(2);
            }

            else if (camGame.zoom == 2) {
                camGame.setZoom(4);
            }

            else if (camGame.zoom == 4) {
                camGame.setZoom(8);

            }
            else if (camGame.zoom == 8) {
                camGame.setZoom(1)
            }
            else {}
        });

        spaceBar.on('up', function () {
            
        });
    }

    setListeners() {
        this.emitter.on('DESTROY', this.Destroy.bind(this));
        this.emitter.on('PLANT TREES', this.PlantTrees.bind(this));
        this.emitter.on('BUILD 32', this.Build32.bind(this));
        this.emitter.on('BUILD 64', this.Build64.bind(this));
        this.emitter.on('BUILD 96', this.Build96.bind(this));
        this.emitter.on('BUILD 128', this.Build128.bind(this));
        this.emitter.on('BUILD ROAD', this.BuildRoad.bind(this));
        this.emitter.on('BUILD BIKE LANE', this.BuildBikeLane.bind(this));
        this.emitter.on('BUILD WATER', this.BuildWater.bind(this));
        this.emitter.on('BUILD HOUSE', this.BuildHouse.bind(this));
        this.emitter.on('BUILD MEADOW', this.BuildMeadow.bind(this));
        this.emitter.on('BUILD WIND', this.BuildWind.bind(this));
        this.emitter.on('BUILD GREEN', this.BuildGreen.bind(this));
        this.emitter.on('GROW FOREST', this.GrowForest.bind(this));
    }

//EVENTS:

    Destroy() {

        smallTile = true;
        mediumTile = false;
        largeTile = false;
        xLargeTile = false;

        newTile = 'destroy';
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

        newTile = 'brian';
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

        newTile = 'brian';
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

        newTile = 'skyscraper';
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

        newTile = 'hydrogen';
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

        newTile = 'solar';
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

        newTile = 'road';
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

        newTile = 'bike';
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

        newTile = 'house_b';
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

        newTile = 'wind';
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

        newTile = 'brian';
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

        newTile = 'brian';
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

        newTile = 'brian';
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

        newTile = 'green_building';
        n = 0;

        destroy = false;
        grow = false;
        water = false;
        wind = false;

        road = false;
        bike = false;
    }


//UPDATES:

    update() {

    }   
}