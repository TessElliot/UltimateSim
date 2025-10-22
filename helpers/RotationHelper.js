// RotationHelper.js
// Handles map rotation logic - methods copied exactly from GameScene

import { updateAllRoadPatterns } from "../helpers/connector.js";
import { updateAllRailPatterns } from "../helpers/connector_rail.js";
import { fixBeachTileFrames } from "../helpers/tileUtils.js";

export class RotationHelper {
    constructor(scene, tileWidth, tileHeight) {
        this.scene = scene;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    /**
     * Main rotation method - copied exactly from GameScene
     * @param {number} mapTilesWidth - Current map width (module-level variable from GameScene)
     */
    rotateMapClockwise(mapTilesWidth) {
        console.log("rotateMapClockwise called!");
        this.scene.isRotating = true;

        const mapWidth = mapTilesWidth;
        const mapHeight = mapTilesWidth; // Assuming square grid
        const isOddGrid = mapWidth % 2 !== 0;

        // Step 0: Store the current container position BEFORE rotation
        const oldContainerX = this.scene.mapContainer.x;
        const oldContainerY = this.scene.mapContainer.y;

        console.log(`\n========================================`);
        console.log(`🔄 ROTATION #${this.scene.rotationCount + 1} (current angle: ${this.scene.rotationCount * 90}°)`);
        console.log(`========================================`);
        console.log(`📦 Container BEFORE rotation:`);
        console.log(`   x = ${oldContainerX.toFixed(3)}`);
        console.log(`   y = ${oldContainerY.toFixed(3)}`);

        // Step 1: UPDATE gridX and gridY coordinates for rotation
        // This rotates the logical grid coordinates 90° clockwise
        this._updateGridCoordinatesClockwise(mapWidth, isOddGrid);

        // Step 2: REPOSITION all sprites based on their new gridX/gridY
        // This moves tiles to their new visual positions
        this._repositionAllTiles(mapWidth, mapHeight);

        // Step 3: Rotate the container position for 90° clockwise rotation
        // For isometric grid, we need to account for the diamond shape
        const newContainerX = oldContainerY * 1.33;
        const newContainerY = -oldContainerX;

        console.log(`🔄 Container transformation formula:`);
        console.log(`   new_x = old_y * 1.33 = ${oldContainerY.toFixed(3)} * 1.33 = ${newContainerX.toFixed(3)}`);
        console.log(`   new_y = -old_x = -(${oldContainerX.toFixed(3)}) = ${newContainerY.toFixed(3)}`);

        this.scene.mapContainer.x = newContainerX;
        this.scene.mapContainer.y = newContainerY;

        console.log(`📦 Container AFTER rotation:`);
        console.log(`   x = ${this.scene.mapContainer.x.toFixed(3)}`);
        console.log(`   y = ${this.scene.mapContainer.y.toFixed(3)}`);

        // Step 4: REBUILD mapTilesPos array
        this.scene.mapTilesPos = [];
        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];
            this.scene.mapTilesPos.push(tile.x + ", " + tile.y);
        }

        // Step 5: Handle medium tiles (collect and reposition them)
        const mediumTiles = this._collectMediumTiles();
        if (mediumTiles.length > 0) {
            console.log(`🏢 Found ${mediumTiles.length} medium tiles to reposition`);
            this._repositionMediumTiles(mediumTiles);
        }

        // Step 6: Finalize
        this._finalizeRotation();

        // Step 7: Update rotation counter (0-3, wraps around)
        const previousRotationCount = this.scene.rotationCount;
        this.scene.rotationCount = (this.scene.rotationCount + 1) % 4;
        console.log(`🔄 Rotation count: ${this.scene.rotationCount} (${this.scene.rotationCount * 90}° clockwise from original)`);

        // If we just completed a full 360° rotation, print summary
        if (this.scene.rotationCount === 0 && previousRotationCount === 3) {
            console.log(`\n========================================`);
            console.log(`✅ FULL 360° ROTATION COMPLETE`);
            console.log(`========================================`);
            console.log(`📦 Final container position after 4 rotations:`);
            console.log(`   x = ${this.scene.mapContainer.x.toFixed(3)}`);
            console.log(`   y = ${this.scene.mapContainer.y.toFixed(3)}`);
            console.log(`\nℹ️ If formula is correct, container should be back at starting position.`);
            console.log(`========================================\n`);
        }

        // Step 7: Recalculate map boundaries for the new rotated position
        if (this.scene.calculateMapBoundaries) {
            this.scene.calculateMapBoundaries();
        }

        this.scene.isRotating = false;
    }

    _buildGridLookup() {
        const lookup = new Map();
        for (const tile of this.scene.mapTiles) {
            const key = `${tile.gridX},${tile.gridY}`;
            lookup.set(key, tile);
        }
        return lookup;
    }

    _calculateRotatedTextures(gridLookup, mapWidth, isOddGrid) {
        const newTextures = [];

        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];

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

        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];
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
            if (this.scene.anims.exists(texture)) {
                tile.play({ key: texture, randomFrame: true });
            }
        }

        return mediumTiles;
    }

    _updateGridCoordinates(gridLookup, mapWidth, isOddGrid) {
        // Update gridX and gridY to match the rotated positions
        // This is CRITICAL for tile lookup, land use data, and placement logic

        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];
            const oldGridX = tile.gridX;
            const oldGridY = tile.gridY;

            // Calculate rotated grid coordinates (same formula as texture rotation)
            let rotatedX, rotatedY;

            if (isOddGrid) {
                // Odd grid: counter-clockwise
                rotatedX = mapWidth - oldGridY - 1;
                rotatedY = oldGridX;

                // Adjust for odd grids
                rotatedX -= Math.floor(mapWidth / 2);
                rotatedY -= Math.floor(mapWidth / 2);
                rotatedX += Math.floor(mapWidth / 2);
                rotatedY += Math.floor(mapWidth / 2);
            } else {
                // Even grid: counter-clockwise
                rotatedX = mapWidth - oldGridY + 1;
                rotatedY = oldGridX;
            }

            // Update the tile's grid coordinates
            tile.gridX = rotatedX;
            tile.gridY = rotatedY;
        }

        console.log(`✅ Updated gridX/gridY for ${this.scene.mapTiles.length} tiles after rotation`);
    }

    _updateGridCoordinatesClockwise(mapWidth, isOddGrid) {
        // Rotate grid coordinates 90° CLOCKWISE
        // Formula: (x, y) -> (y, mapWidth - 1 - x)

        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];
            const oldGridX = tile.gridX;
            const oldGridY = tile.gridY;

            // Clockwise rotation: new position based on old position
            const newGridX = oldGridY;
            const newGridY = mapWidth - 1 - oldGridX;

            tile.gridX = newGridX;
            tile.gridY = newGridY;
        }

        console.log(`✅ Updated gridX/gridY for ${this.scene.mapTiles.length} tiles (clockwise rotation)`);
    }

    _repositionAllTiles(mapWidth, mapHeight) {
        // Recalculate isometric positions for all tiles based on their new gridX/gridY
        // Use the scene's centralized grid start calculation
        const gridStart = this.scene.calculateGridStart(mapHeight);
        const startX = gridStart.startX;
        const startY = gridStart.startY;

        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];

            // Calculate new isometric position based on gridX and gridY
            const isoX = startX + (tile.gridX - tile.gridY) * (this.tileWidth / 2);
            const isoY = startY + (tile.gridX + tile.gridY) * (this.tileHeight / 2);

            // Move the sprite to the new position
            tile.x = isoX;
            tile.y = isoY;
        }

        // Re-sort by depth
        this.scene.mapContainer.sort("y");

        console.log(`✅ Repositioned all ${this.scene.mapTiles.length} tiles to new rotated positions`);
    }

    _collectMediumTiles() {
        const mediumTiles = [];

        for (let i = 0; i < this.scene.mapTiles.length; i++) {
            const tile = this.scene.mapTiles[i];
            // Medium tiles have width of 64
            if (tile.width === 64) {
                mediumTiles.push(tile);
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
            let x1 = pX - this.tileWidth / 2;
            let y1 = pY - this.tileHeight / 2;
            let x2 = pX + this.tileWidth / 2;
            let y2 = pY - this.tileHeight / 2;
            let x3 = pX;
            let y3 = pY - this.tileHeight;

            let tile1Pos = x1 + ", " + y1;
            let tile2Pos = x2 + ", " + y2;
            let tile3Pos = x3 + ", " + y3;

            tilePosArray.push(tile1Pos, tile2Pos, tile3Pos);

            let changeSprite = this.scene.mapTilesPos.indexOf(tilePosArray[0]);
            if (changeSprite !== -1) {
                console.log("Placing medium tile at position 0, index " + changeSprite);
                this.scene.mapTiles[changeSprite].setTexture(tex);
                this.scene.mapTiles[changeSprite].setOrigin(0.25, 0.47);
            } else {
                console.log("ERROR: Could not find position for medium tile anchor!");
            }

            let foundCount = 0;
            for (let j = 1; j < tilePosArray.length; j++) {
                let index = this.scene.mapTilesPos.indexOf(tilePosArray[j]);
                if (index !== -1) {
                    // Only null if it's already null or green_apartments
                    const currentTexture = this.scene.mapTiles[index].texture.key;
                    if (currentTexture === "null" || currentTexture === "green_apartments") {
                        foundCount++;
                        console.log("  Nulling index " + index + ": was " + currentTexture);
                        this.scene.mapTiles[index].setTexture("null");
                        this.scene.mapTiles[index].setOrigin(0.5, 0.5);
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
        this.scene.mapArray = this.scene.mapTiles.map(tile => tile.texture.key);

        // Update road/rail patterns and beach tiles
        updateAllRoadPatterns(this.scene);
        updateAllRailPatterns(this.scene);
        fixBeachTileFrames(this.scene);
    }
}
