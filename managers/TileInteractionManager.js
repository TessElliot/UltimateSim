// managers/TileInteractionManager.js
// Manages all tile hover, click, and interaction behaviors

import { findClimateNumber } from '../helpers/tileUtils.js';
import { updateAllRoadPatterns } from '../helpers/connector.js';
import { updateAllRailPatterns } from '../helpers/connector_rail.js';
import { landUseInfo } from '../services/os.js';

export class TileInteractionManager {
    constructor(scene, gridToTileKey, tileWidth, tileHeight) {
        this.scene = scene;
        this.gridToTileKey = gridToTileKey;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;

        // Local state for hover/click interactions
        this.tileArray = [];
        this.mapTexArray = [];
    }

    /**
     * Add all event listeners to a tile (hover, click, out)
     */
    addListenerToTile(tile) {
        // Clear any previous listeners FIRST
        tile.removeAllListeners();

        // Register tile with TileTypesManager for base hover interactions
        const tileIndex = this.scene.mapTiles.indexOf(tile);
        if (tileIndex !== -1 && this.scene.tileTypesManager) {
            this.scene.tileTypesManager.registerTile(tile, tileIndex);
        }

        // Add TileInteractionManager listeners
        tile.on('pointerover', (pointer) => this.handlePointerOver(tile, pointer));
        tile.on('pointerdown', (pointer) => this.handlePointerDown(tile, pointer));
        tile.on('pointerout', (pointer) => this.handlePointerOut(tile, pointer));
    }

    /**
     * POINTEROVER - Show hover effects and validate placement
     */
    handlePointerOver(tile, pointer) {
        // Reset arrays
        this.tileArray = [];
        this.mapTexArray = [];

        const pX = tile.x;
        const pY = tile.y;

        // Don't show hover effects during navigation modes
        if (this.scene.gameState.moveBool || this.scene.gameState.rotateBool ||
            this.scene.gameState.zoomBool || this.scene.gameState.homeBool) {
            return;
        }

        const tile0 = this.scene.mapTiles.indexOf(tile);
        const useType = this.scene.mapArray[tile0];
        const displayClimateNum = findClimateNumber(tile.texture.key);

        // Handle info mode
        if (this.scene.gameState.infoBool) {
            this.handleInfoMode(tile, tile0, useType, displayClimateNum, pointer);
            return;
        }

        // Check if any build tool is active
        const hasActiveTool = this.scene.gameState.destroy ||
                             this.scene.gameState.wind ||
                             this.scene.gameState.solar ||
                             this.scene.gameState.trees ||
                             this.scene.gameState.mediumTile ||
                             this.scene.gameState.largeTile;

        // Only show placement feedback if a tool is active
        if (!hasActiveTool) {
            return; // Let base category tinting handle this
        }

        // Calculate affected tiles based on tile size
        const tilePosArray = this.calculateAffectedTilePositions(pX, pY);

        // Get tiles and textures at those positions
        const affectedTiles = this.getAffectedTiles(tilePosArray);
        this.tileArray = affectedTiles.tiles;
        this.mapTexArray = affectedTiles.textures;

        // Validate placement and show tint feedback
        this.validateAndShowPlacementFeedback(tile0);
    }

    /**
     * POINTERDOWN - Actually place the tile
     */
    handlePointerDown(tile, pointer) {
        const pX = tile.x;
        const pY = tile.y;

        // Log land use data
        const tileKey = this.gridToTileKey.get(`${tile.gridX}_${tile.gridY}`);
        const landUseData = landUseInfo.get(tileKey);
        console.log("Land data:", landUseData);

        // Calculate surrounding tiles
        const tilePosArray = this.calculateSurroundingTilePositions(pX, pY);

        // Get affected tiles
        const affectedTiles = this.getAffectedTiles(tilePosArray);
        const tileaArray = affectedTiles.tiles.filter(t => t && typeof t.setTexture === 'function');

        const tile0 = this.scene.mapTiles.indexOf(tile);
        const id = tile.id;
        let newTileType = null;

        // Debug: Show state before early return check
        console.log(`🔍 handlePointerDown - placeTile: ${this.scene.gameState.placeTile}, destroy: ${this.scene.gameState.destroy}, road: ${this.scene.gameState.road}, tile texture: ${tile.texture.key}`);

        // Early return if in move mode - let scene handle map dragging
        if (this.scene.gameState.moveBool) {
            console.log('🚫 Early return: moveBool is true (move mode active)');
            return;
        }

        // Early return if placement not allowed
        if (this.scene.gameState.placeTile === false) {
            console.log('❌ Early return: placeTile is false');
            return;
        }

        // Handle different placement modes
        console.log(`🔀 Checking placement mode - road: ${this.scene.gameState.road}, placeTile: ${this.scene.gameState.placeTile}, destroy: ${this.scene.gameState.destroy}`);

        if (this.scene.gameState.road) {
            console.log('🛣️ Road mode');
            newTileType = this.placeRoad(tile, tileaArray);
        } else if (this.scene.gameState.placeTile && tile.texture.key !== "road" && !this.scene.gameState.destroy) {
            console.log('🏗️ Tile placement mode');
            newTileType = this.placeTile(tile, tile0, tileaArray);
        } else if (this.scene.gameState.destroy) {
            console.log('💥 Destroy mode');
            newTileType = this.bulldozeTile(tile, tile0, tileaArray, tilePosArray);
        } else if (this.scene.gameState.bike && tileaArray[0] && tileaArray[0].texture && tileaArray[0].texture.key === "road") {
            console.log('🚴 Bike lane mode');
            tileaArray[0].setTexture("bike", tileaArray[0].frame.name);
            newTileType = "bike";
        } else {
            console.log('⚠️ No matching placement mode!');
        }

        console.log(id, newTileType);

        // Update tile changes tracking
        if (newTileType !== null && id !== undefined) {
            const tileIndex = this.scene.mapTiles.indexOf(tile);
            if (tileIndex !== -1) {
                this.scene.mapArray[tileIndex] = newTileType;
            }

            const changeIndex = this.scene.tileChanges.findIndex(t => t.id === id);
            if (changeIndex !== -1) {
                this.scene.tileChanges[changeIndex].newTileType = newTileType;
            } else {
                this.scene.tileChanges.push({ id, newTileType });
            }

            console.log("Tile changes updated:", this.scene.tileChanges);

            // Auto-save removed - use explicit Save button instead
        }

        // Update city simulation
        this.scene.citySim?.immediateUpdate();

        // Save state for undo/redo
        if (newTileType !== null && id !== undefined && !this.scene.isLoadingMap) {
            this.scene.saveState();
        }

        // Update land use text display
        const tileKeyDown = this.gridToTileKey.get(`${tile.gridX}_${tile.gridY}`);
        const landUseDataDown = landUseInfo.get(tileKeyDown);
        if (this.scene.landUseText) {
            if (landUseDataDown && landUseDataDown.maxAreaType) {
                this.scene.landUseText.text = 'Land Use: ' + landUseDataDown.maxAreaType;
            } else {
                this.scene.landUseText.text = '';
            }
        }
    }

    /**
     * POINTEROUT - Clear hover effects
     */
    handlePointerOut(tile, pointer) {
        // Filter valid tiles
        this.tileArray = this.tileArray.filter(t => t && typeof t.clearTint === 'function');

        // Clear tints
        for (let j = 0; j < this.tileArray.length; j++) {
            if (this.tileArray[j] && typeof this.tileArray[j].clearTint === 'function') {
                this.tileArray[j].clearTint();
            }
        }

        // Reset info mode display
        if (this.scene.gameState.infoBool) {
            for (let i = 0; i < this.scene.mapTiles.length; i++) {
                let mapTex = this.scene.mapTiles[i];
                if (mapTex) {
                    mapTex.alpha = 1.0;
                }
            }
        }

        // Clear info text and typewriter interval (now uses DOM element)
        if (this.scene.infoTextElement) {
            // Clear typewriter interval if active
            if (this.scene.landuseTypewriterInterval) {
                clearInterval(this.scene.landuseTypewriterInterval);
                this.scene.landuseTypewriterInterval = null;
            }
            this.scene.infoTextElement.textContent = '';
            this.scene.infoTextElement.classList.remove('show');
        }
    }

    // ========================================================================
    // HELPER METHODS - Info Mode
    // ========================================================================

    handleInfoMode(tile, tile0, useType, displayClimateNum, pointer) {
        // Dim all tiles
        this.scene.mapTiles.forEach(mapTex => {
            if (mapTex) mapTex.alpha = 0.2;
        });

        // Highlight current tile
        tile.alpha = 1;

        // Update info text with typewriter effect and mouse position (landuse info only)
        if (this.scene.infoTextElement) {
            const text = `Land Use: '${useType}' with Climate Impact of: ${displayClimateNum}`;

            // Position the info box at an equilateral angle from the mouse cursor
            if (pointer) {
                const offsetX = 15; // 15px to the right of cursor
                const offsetY = 15; // 15px below cursor (equilateral angle)
                this.scene.infoTextElement.style.left = (pointer.x + offsetX) + 'px';
                this.scene.infoTextElement.style.top = (pointer.y + offsetY) + 'px';
            }

            // Reset for typewriter effect
            this.scene.infoTextElement.textContent = '';
            this.scene.infoTextElement.classList.add('show');

            // Trigger typewriter effect
            let charIndex = 0;
            const typeSpeed = 30; // milliseconds per character

            // Clear any existing typewriter interval
            if (this.scene.landuseTypewriterInterval) {
                clearInterval(this.scene.landuseTypewriterInterval);
            }

            this.scene.landuseTypewriterInterval = setInterval(() => {
                if (charIndex < text.length) {
                    this.scene.infoTextElement.textContent += text.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(this.scene.landuseTypewriterInterval);
                    this.scene.landuseTypewriterInterval = null;
                }
            }, typeSpeed);
        }
    }

    // ========================================================================
    // HELPER METHODS - Position Calculation
    // ========================================================================

    /**
     * Calculate positions of tiles affected by placement (based on tile size)
     */
    calculateAffectedTilePositions(pX, pY) {
        const tilePosArray = [];
        tilePosArray.push(`${pX}, ${pY}`); // Always include center tile

        if (this.scene.gameState.smallTile && !this.scene.gameState.mediumTile) {
            return tilePosArray;
        }

        // Medium tile (4 tiles)
        if (this.scene.gameState.mediumTile) {
            tilePosArray.push(
                `${pX - this.tileWidth / 2}, ${pY - this.tileHeight / 2}`,
                `${pX}, ${pY - this.tileHeight}`,
                `${pX + this.tileWidth / 2}, ${pY - this.tileHeight / 2}`
            );
        }

        // Large tile (9 tiles)
        if (this.scene.gameState.largeTile) {
            tilePosArray.push(
                `${pX - this.tileWidth}, ${pY - this.tileHeight}`,
                `${pX - this.tileWidth / 2}, ${pY - this.tileHeight * 1.5}`,
                `${pX}, ${pY - this.tileHeight * 2}`,
                `${pX + this.tileWidth / 2}, ${pY - this.tileHeight * 1.5}`,
                `${pX + this.tileWidth}, ${pY - this.tileHeight}`
            );
        }

        // XLarge tile (additional tiles)
        if (this.scene.gameState.xLargeTile) {
            tilePosArray.push(
                `${pX + this.tileWidth * 1.5}, ${pY - this.tileHeight * 1.5}`,
                `${pX + this.tileWidth}, ${pY - this.tileHeight * 2}`,
                `${pX - this.tileWidth / 2}, ${pY - this.tileHeight * 2.5}`,
                `${pX}, ${pY - this.tileHeight * 3}`,
                `${pX + this.tileWidth / 2}, ${pY - this.tileHeight * 2.5}`,
                `${pX - this.tileWidth}, ${pY - this.tileHeight * 2}`,
                `${pX - this.tileWidth * 1.5}, ${pY - this.tileHeight * 1.5}`
            );
        }

        return tilePosArray;
    }

    /**
     * Calculate surrounding tiles (for click detection and patterns)
     */
    calculateSurroundingTilePositions(pX, pY) {
        return [
            `${pX}, ${pY}`, // Center
            `${pX + this.tileWidth / 2}, ${pY - this.tileHeight / 2}`, // Top-right
            `${pX + this.tileWidth}, ${pY}`, // Right
            `${pX + this.tileWidth / 2}, ${pY + this.tileHeight / 2}`, // Bottom-right
            `${pX - this.tileWidth / 2}, ${pY - this.tileHeight / 2}`, // Top-left
            `${pX}, ${pY - this.tileHeight}`, // Top
            `${pX - this.tileWidth / 2}, ${pY + this.tileHeight / 2}`, // Bottom-left
            `${pX - this.tileWidth}, ${pY}`, // Left
            `${pX}, ${pY + this.tileHeight}` // Bottom
        ];
    }

    /**
     * Get actual tile objects and textures at given positions
     */
    getAffectedTiles(tilePosArray) {
        const tiles = [];
        const textures = [];

        for (const pos of tilePosArray) {
            const tileIndex = this.scene.mapTilesPos.indexOf(pos);
            if (tileIndex !== -1) {
                tiles.push(this.scene.mapTiles[tileIndex]);
                textures.push(this.scene.mapTiles[tileIndex].texture.key);
            }
        }

        return { tiles, textures };
    }

    // ========================================================================
    // HELPER METHODS - Placement Validation
    // ========================================================================

    /**
     * Validate placement and show green/red tint feedback
     */
    validateAndShowPlacementFeedback(tile0) {
        const canPlace = this.canPlaceTile(tile0);

        // Set placeTile based on validation
        // This determines if clicking will place a tile
        this.scene.gameState.placeTile = canPlace;

        // Show visual feedback
        const tintColor = canPlace ? 0x00ff00 : 0xf0000f; // Green or red

        this.tileArray.forEach(t => {
            if (t && typeof t.setTint === 'function') {
                t.setTint(tintColor);
            }
        });
    }

    /**
     * Check if tile can be placed based on current mode and tile state
     * HARD RULE: Building tools can ONLY work on greenery tiles
     */
    canPlaceTile(tile0) {
        const currentTexture = this.mapTexArray[0];

        // HARD RULE: Check if tile is in greenery category (for ALL build modes except destroy)
        const landUse = this.scene.mapArray[tile0];
        const isGreenery = this.scene.tileTypesManager &&
                          this.scene.tileTypesManager.getTileCategory(landUse) === 'greenery';

        // Destroy mode - can destroy anything except ground
        if (this.scene.gameState.destroyBool) {
            return currentTexture !== "ground";
        }

        // For ALL building tools: must be on greenery
        if (!isGreenery) {
            return false;
        }

        // Road mode - can only place on ground AND greenery
        if (this.scene.gameState.road) {
            return currentTexture === "ground";
        }

        // Bike lane - can only place on roads (still must be greenery category)
        if (this.scene.gameState.bike) {
            return currentTexture === "road";
        }

        // Small tile placement - must be ground AND greenery
        if (this.scene.gameState.smallTile && !this.scene.gameState.mediumTile) {
            return currentTexture === "ground";
        }

        // Medium/large tiles - all affected tiles must be ground AND greenery
        if (this.scene.gameState.mediumTile || this.scene.gameState.largeTile) {
            // Check all affected tiles are greenery
            const allGreenery = this.tileArray.every((tile, idx) => {
                const tileIndex = this.scene.mapTiles.indexOf(tile);
                if (tileIndex === -1) return false;
                const tileLandUse = this.scene.mapArray[tileIndex];
                return this.scene.tileTypesManager.getTileCategory(tileLandUse) === 'greenery';
            });

            return allGreenery && this.mapTexArray.every(tex => tex === "ground");
        }

        return false;
    }

    // ========================================================================
    // HELPER METHODS - Tile Placement
    // ========================================================================

    /**
     * Place a road tile
     */
    placeRoad(tile, tileaArray) {
        if (tileaArray[0] && typeof tileaArray[0].setTexture === 'function') {
            tileaArray[0].setTexture("road");
        }

        if (this.scene.economySim) {
            this.scene.economySim.chargeFor("road");
        }

        updateAllRoadPatterns(this.scene);
        updateAllRailPatterns(this.scene);

        // Emit tile placed event
        this.scene.emitter.emit('TILE_PLACED', {
            oldTileType: tile.texture.key,
            newTileType: 'road'
        });

        return "road";
    }

    /**
     * Place a regular tile (solar, wind, trees, etc.)
     */
    placeTile(tile, tile0, tileaArray) {
        console.log(`🎯 Tile clicked. placeTile: ${this.scene.gameState.placeTile}, texture: ${tile.texture.key}, destroy: ${this.scene.gameState.destroy}, newTile: ${this.scene.gameState.newTile}`);

        // Check each condition individually
        const canPlace = this.scene.gameState.placeTile && tile.texture.key !== "road" && !this.scene.gameState.destroy;
        console.log(`🔍 Placement check - placeTile: ${this.scene.gameState.placeTile}, notRoad: ${tile.texture.key !== "road"}, notDestroy: ${!this.scene.gameState.destroy}, canPlace: ${canPlace}`);

        if (!canPlace) {
            return null;
        }

        console.log(`🔨 Placing tile: ${this.scene.gameState.newTile}`);

        let newTileType = this.scene.gameState.newTile;

        // Handle multi-tile placement (large buildings > 4 tiles)
        if (this.scene.gameState.placeTile && this.tileArray.length > 4) {
            this.placeLargeTile(this.tileArray);
            // Emit tile placed event for multi-tile
            this.scene.emitter.emit('TILE_PLACED', {
                oldTileType: tile.texture.key,
                newTileType: this.scene.gameState.newTile
            });
            // Return null to prevent duplicate tileChanges entry in handlePointerDown
            return null;
        }
        // Handle medium-tile placement (exactly 4 tiles)
        else if (this.scene.gameState.placeTile && this.tileArray.length === 4) {
            this.placeMediumTile(this.tileArray);
            // Emit tile placed event for multi-tile
            this.scene.emitter.emit('TILE_PLACED', {
                oldTileType: tile.texture.key,
                newTileType: this.scene.gameState.newTile
            });
            // Return null to prevent duplicate tileChanges entry in handlePointerDown
            return null;
        }

        // Single-tile placement - set texture on sprite array
        if (this.tileArray[0] && typeof this.tileArray[0].setTexture === 'function') {
            this.tileArray[0].setTexture(this.scene.gameState.newTile, this.scene.gameState.frameNumber);
        }

        // Update map tiles
        this.scene.mapTiles[tile0].setTexture(this.scene.gameState.newTile, 0);
        this.scene.mapArray[tile0] = this.scene.gameState.newTile;

        // Play animation if exists
        if (this.scene.anims.exists(this.scene.gameState.newTile)) {
            this.scene.mapTiles[tile0].play({ key: this.scene.gameState.newTile, randomFrame: true });
        } else {
            this.scene.mapTiles[tile0].anims.stop();
        }

        // Emit tile placed event for single-tile
        this.scene.emitter.emit('TILE_PLACED', {
            oldTileType: tile.texture.key,
            newTileType: this.scene.gameState.newTile
        });

        return newTileType;
    }

    /**
     * Place large tile structures (> 4 tiles)
     */
    placeLargeTile(tileArray) {
        tileArray.forEach((tile, index) => {
            if (!tile || typeof tile.anims === 'undefined') return;

            tile.anims.stop();

            // Center tile (index 2) gets the texture
            if (index === 2) {
                tile.setTexture(this.scene.gameState.newTile);
                tile.setOrigin(0.5, 0.5);

                const tileIndex = this.scene.mapTiles.indexOf(tile);
                if (tileIndex !== -1) {
                    this.scene.mapArray[tileIndex] = this.scene.gameState.newTile;
                }

                const tileId = tile.id;
                if (tileId !== undefined) {
                    const changeIndex = this.scene.tileChanges.findIndex(t => t.id === tileId);
                    if (changeIndex !== -1) {
                        this.scene.tileChanges[changeIndex].newTileType = this.scene.gameState.newTile;
                    } else {
                        this.scene.tileChanges.push({
                            id: tileId,
                            newTileType: this.scene.gameState.newTile,
                        });
                    }
                }

                // Play animation
                if (this.scene.anims.exists(this.scene.gameState.newTile)) {
                    tile.play({ key: this.scene.gameState.newTile, randomFrame: true });
                } else {
                    tile.anims.stop();
                    console.log("Tile animation not found: " + this.scene.gameState.newTile);
                }
            } else {
                // Other tiles become null
                tile.setTexture("null");
                tile.setOrigin(0.5, 0.5);

                const tileIndex = this.scene.mapTiles.indexOf(tile);
                if (tileIndex !== -1) {
                    this.scene.mapArray[tileIndex] = "null";
                }

                const tileId = tile.id;
                if (tileId !== undefined) {
                    const changeIndex = this.scene.tileChanges.findIndex(t => t.id === tileId);
                    if (changeIndex !== -1) {
                        this.scene.tileChanges[changeIndex].newTileType = "null";
                    } else {
                        this.scene.tileChanges.push({ id: tileId, newTileType: "null" });
                    }
                }
            }
        });

        // Auto-save removed - use explicit Save button instead
    }

    /**
     * Place medium tile structures (exactly 4 tiles)
     */
    placeMediumTile(tileArray) {
        // First, set all 4 tiles to null
        tileArray.forEach((tile) => {
            if (!tile || typeof tile.anims === 'undefined') return;

            tile.anims.stop();
            tile.setTexture("null");

            const tileIndex = this.scene.mapTiles.indexOf(tile);
            if (tileIndex !== -1) {
                this.scene.mapArray[tileIndex] = "null";
            }

            const tileId = tile.id;
            if (tileId !== undefined) {
                const changeIndex = this.scene.tileChanges.findIndex(t => t.id === tileId);
                if (changeIndex !== -1) {
                    this.scene.tileChanges[changeIndex].newTileType = "null";
                } else {
                    this.scene.tileChanges.push({ id: tileId, newTileType: "null" });
                }
            }
        });

        // Then set the center tile (index 1) with the actual texture
        const centerTile = tileArray[1];
        if (centerTile && typeof centerTile.setTexture === 'function') {
            const centerTileIndex = this.scene.mapTiles.indexOf(centerTile);
            if (centerTileIndex !== -1) {
                this.scene.mapArray[centerTileIndex] = this.scene.gameState.newTile;
            }

            const centerTileId = centerTile.id;
            if (typeof centerTileId !== "undefined") {
                const existingIndex = this.scene.tileChanges.findIndex(t => t.id === centerTileId);
                if (existingIndex !== -1) {
                    this.scene.tileChanges[existingIndex].newTileType = this.scene.gameState.newTile;
                } else {
                    this.scene.tileChanges.push({
                        id: centerTileId,
                        newTileType: this.scene.gameState.newTile,
                    });
                }
            }

            centerTile.setTexture(this.scene.gameState.newTile);
            centerTile.setOrigin(0.25, 0.47); // Special origin for medium tiles

            if (this.scene.anims.exists(this.scene.gameState.newTile)) {
                centerTile.play({ key: this.scene.gameState.newTile, randomFrame: true });
            }
        }
    }

    /**
     * Bulldoze/destroy a tile
     */
    bulldozeTile(tile, tile0, tileaArray, tilePosArray) {
        if (tileaArray.length === 0) {
            tileaArray.push(tile);
        }

        const currentSpriteWidth = tileaArray[0].width;
        const oldTileType = tile.texture.key;

        // Bulldoze main tile
        tileaArray[0].play("bulldozing");
        tileaArray[0].texture.key = "ground";  // Direct property assignment like original
        this.scene.mapTiles[tile0].texture.key = "ground";  // Direct property assignment
        this.scene.mapTiles[tile0].setOrigin(0.5, 0.5);
        this.scene.mapArray[tile0] = "ground";

        // Emit tile removed event
        this.scene.emitter.emit('TILE_REMOVED', {
            tileType: oldTileType
        });

        // Handle multi-tile bulldozing
        if (currentSpriteWidth === 96) {
            // Large tile
            for (const pos of tilePosArray) {
                const checkForNull = this.scene.mapTilesPos.indexOf(pos);
                if (checkForNull !== -1) {
                    this.scene.mapTiles[checkForNull].play("bulldozing");
                    this.scene.mapTiles[checkForNull].setTexture("ground");
                    this.scene.mapTiles[checkForNull].setOrigin(0.5, 0.5);
                }
            }
        } else if (currentSpriteWidth === 64) {
            // Medium tile
            for (let i = 0; i < 4; i++) {
                const checkForNull = this.scene.mapTilesPos.indexOf(tilePosArray[i]);
                if (checkForNull !== -1) {
                    this.scene.mapTiles[checkForNull].play("bulldozing");
                    this.scene.mapTiles[checkForNull].setTexture("ground");
                    this.scene.mapTiles[checkForNull].setOrigin(0.5, 0.5);
                }
            }
        }

        return "ground";
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.tileArray = [];
        this.mapTexArray = [];
        this.scene = null;
    }
}
