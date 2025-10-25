// managers/TileInteractionManager.js
// Manages all tile hover, click, and interaction behaviors

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

        // Cluster preview animation state
        this.clusterPreviewTimeouts = [];
        this.isPreviewAnimating = false;
    }

    /**
     * Add all event listeners to a tile (hover, click, out)
     */
    addListenerToTile(tile) {
        // Register tile with TileTypesManager for base hover interactions FIRST
        const tileIndex = this.scene.mapTiles.indexOf(tile);
        if (tileIndex !== -1 && this.scene.tileTypesManager) {
            this.scene.tileTypesManager.registerTile(tile, tileIndex);
        }

        // Add TileInteractionManager listeners
        // Note: TileTypesManager already added its listeners, so these stack on top
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

        // Info mode is now handled by TileTypesManager.displayTileInfo()
        if (this.scene.gameState.infoBool) {
            return;
        }

        // Check if any build tool is active
        const hasActiveTool = this.scene.gameState.destroy ||
                             this.scene.gameState.road ||
                             this.scene.gameState.bike ||
                             this.scene.gameState.wind ||
                             this.scene.gameState.solar ||
                             this.scene.gameState.trees ||
                             this.scene.gameState.upgrade ||
                             this.scene.gameState.mediumTile ||
                             this.scene.gameState.largeTile;

        // Only show placement feedback if a tool is active
        if (hasActiveTool) {
            const category = this.scene.tileTypesManager && this.scene.tileTypesManager.getTileCategory(useType);

            // === A KEY HELD = CLUSTER PREVIEW MODE ===
            if (this.scene.inputManager && this.scene.inputManager.isAKeyHeld) {

                // A + Solar (upgrade mode)
                if (this.scene.gameState.upgrade === 'solar') {
                    if (category === 'greenery') {
                        // A + Solar over greenery → preview greenery cluster → powerplant
                        console.log(`✅ A + Solar over greenery - showing greenery cluster preview`);
                        this.showGreeneryClusterPreview(tile, 'power:plant (solar)');
                        return;
                    } else {
                        // A + Solar over residential → preview residential cluster → _solar
                        console.log(`✅ A + Solar over residential - showing cluster preview`);
                        this.showClusterPreview(tile);
                        return;
                    }
                }

                // A + Greenery/Trees
                if (this.scene.gameState.trees) {
                    if (category === 'greenery') {
                        // A + Trees over greenery → preview greenery cluster → wood
                        console.log(`✅ A + Trees over greenery - showing greenery cluster preview for wood`);
                        this.showGreeneryClusterPreview(tile, 'wood');
                        return;
                    }
                }
            }

            // === NO A KEY = SINGLE TILE HOVER FEEDBACK ===

            // Single tile only - set tileArray to [hoveredTile]
            this.tileArray = [tile];
            this.mapTexArray = [tile.texture.key];

            // Validate and show green/red tint
            this.validateAndShowPlacementFeedback(tile0);
        }
        // If no tool active, do nothing - let TileTypesManager handle base tinting
    }

    /**
     * POINTERDOWN - Actually place the tile
     */
    handlePointerDown(tile, pointer) {
        console.log(`🎯 TileInteractionManager.handlePointerDown CALLED - tile: ${tile.texture.key}, destroy: ${this.scene.gameState.destroy}, placeTile: ${this.scene.gameState.placeTile}`);

        const pX = tile.x;
        const pY = tile.y;

        // Log land use data
        const tileKey = this.gridToTileKey.get(`${tile.gridX}_${tile.gridY}`);
        const landUseData = landUseInfo.get(tileKey);

        // Calculate surrounding tiles
        const tilePosArray = this.calculateSurroundingTilePositions(pX, pY);

        // Get affected tiles
        const affectedTiles = this.getAffectedTiles(tilePosArray);
        const tileaArray = affectedTiles.tiles.filter(t => t && typeof t.setTexture === 'function');

        const tile0 = this.scene.mapTiles.indexOf(tile);
        const id = tile.id;
        let newTileType = null;

        // Early return if in move mode - let scene handle map dragging
        if (this.scene.gameState.moveBool) {
            return;
        }

        // Early return if placement not allowed
        if (this.scene.gameState.placeTile === false) {
            return;
        }

        // Handle different placement modes
        // Check if 'A' is held + upgrade/trees mode = cluster upgrade
        if (this.scene.inputManager && this.scene.inputManager.isAKeyHeld && this.scene.gameState.upgrade) {
            const landUse = this.scene.mapArray[tile0];
            const category = this.scene.tileTypesManager && this.scene.tileTypesManager.getTileCategory(landUse);

            if (category === 'greenery' && this.scene.gameState.upgrade === 'solar') {
                // A + Solar over greenery → upgrade cluster to powerplant
                console.log(`🔑 A + Solar over greenery: Upgrading cluster to powerplant`);
                newTileType = this.upgradeGreeneryClusterToTile(tile, 'power:plant (solar)');
            } else {
                // A + Solar/other over residential → standard cluster upgrade
                console.log(`🔑 A + Click: Cluster upgrade mode`);
                newTileType = this.upgradeCluster(tile, this.scene.gameState.upgrade);
            }
        } else if (this.scene.inputManager && this.scene.inputManager.isAKeyHeld && this.scene.gameState.trees) {
            const landUse = this.scene.mapArray[tile0];
            const category = this.scene.tileTypesManager && this.scene.tileTypesManager.getTileCategory(landUse);

            if (category === 'greenery') {
                // A + Trees over greenery → upgrade cluster to wood
                console.log(`🔑 A + Trees over greenery: Upgrading cluster to wood`);
                newTileType = this.upgradeGreeneryClusterToTile(tile, 'wood');
            }
        } else if (this.scene.gameState.upgrade) {
            const landUse = this.scene.mapArray[tile0];
            const category = this.scene.tileTypesManager && this.scene.tileTypesManager.getTileCategory(landUse);

            if (category === 'greenery' && this.scene.gameState.upgrade === 'solar') {
                // Solar over greenery (no A) → place single powerplant
                console.log(`☀️ Solar over greenery: Placing single powerplant`);
                newTileType = this.placeTile(tile, tile0, [tile]);
            } else {
                // Upgrade residential tile
                console.log(`⬆️ Upgrade mode: ${this.scene.gameState.upgrade}`);
                newTileType = this.upgradeTile(tile, tile0, this.scene.gameState.upgrade);

                // If upgrade failed but we have newTile (hybrid mode), try standard placement
                if (newTileType === null && this.scene.gameState.newTile) {
                    console.log(`ℹ️ Upgrade failed, falling back to placement of ${this.scene.gameState.newTile}`);
                    newTileType = this.placeTile(tile, tile0, [tile]);
                }
            }
        } else if (this.scene.gameState.road) {
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
        // Don't clear tints if 'A' is held (cluster preview mode)
        if (this.scene.inputManager && this.scene.inputManager.isAKeyHeld) {
            return; // Keep cluster preview tints visible
        }

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
    // handleInfoMode() removed - now handled by TileTypesManager.displayTileInfo()

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
        const landUse = this.scene.mapArray[tile0];
        const isGreenery = this.scene.tileTypesManager &&
                          this.scene.tileTypesManager.getTileCategory(landUse) === 'greenery';

        // Destroy mode - check FIRST (doesn't require greenery)
        if (this.scene.gameState.destroy) {
            return currentTexture !== "ground";
        }

        // UPGRADE MODE
        if (this.scene.gameState.upgrade) {
            // Greenery + solar = place powerplant (ignore currentTexture_solar check)
            if (isGreenery && this.scene.gameState.upgrade === 'solar') {
                return this.scene.gameState.newTile !== null;
            }

            // Non-greenery (residential) = check if currentTexture_solar exists
            const upgradedTileType = `${currentTexture}_${this.scene.gameState.upgrade}`;
            return this.scene.textures.exists(upgradedTileType);
        }

        // For ALL other building tools: must be on greenery category
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
        console.log(`🎨 Setting texture to: "${this.scene.gameState.newTile}" (frame: ${this.scene.gameState.frameNumber})`);
        console.log(`🎨 Texture exists in scene?: ${this.scene.textures.exists(this.scene.gameState.newTile)}`);

        if (this.tileArray[0] && typeof this.tileArray[0].setTexture === 'function') {
            this.tileArray[0].setTexture(this.scene.gameState.newTile, this.scene.gameState.frameNumber);
            // Clear the green tint from hover validation
            if (typeof this.tileArray[0].clearTint === 'function') {
                this.tileArray[0].clearTint();
            }
        }

        // Update map tiles
        this.scene.mapTiles[tile0].setTexture(this.scene.gameState.newTile, 0);
        this.scene.mapArray[tile0] = this.scene.gameState.newTile;

        // Clear the green tint from hover validation
        if (typeof this.scene.mapTiles[tile0].clearTint === 'function') {
            this.scene.mapTiles[tile0].clearTint();
        }

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
     * Upgrade a tile to its upgraded variant (e.g., neighborhood -> neighborhood_solar)
     */
    upgradeTile(tile, tile0, upgradeType) {
        const currentTileType = tile.texture.key;
        const upgradedTileType = `${currentTileType}_${upgradeType}`;

        console.log(`⬆️ Attempting to upgrade: ${currentTileType} -> ${upgradedTileType}`);

        // Check if the upgraded texture exists (e.g., house_solar, detached_solar)
        if (!this.scene.textures.exists(upgradedTileType)) {
            console.log(`ℹ️ No upgrade available for ${currentTileType}, will use standard placement instead`);
            return null;  // Let standard placement handle it
        }

        // Update the tile texture
        tile.setTexture(upgradedTileType, 0);
        this.scene.mapArray[tile0] = upgradedTileType;

        // Clear any tint
        if (typeof tile.clearTint === 'function') {
            tile.clearTint();
        }

        // Play animation if exists
        if (this.scene.anims.exists(upgradedTileType)) {
            tile.play({ key: upgradedTileType, randomFrame: true });
        } else {
            tile.anims.stop();
        }

        console.log(`✅ Upgraded to: ${upgradedTileType}`);

        // Emit tile placed event
        this.scene.emitter.emit('TILE_PLACED', {
            oldTileType: currentTileType,
            newTileType: upgradedTileType
        });

        return upgradedTileType;
    }

    /**
     * Upgrade an entire cluster of connected tiles in spiral pattern
     */
    upgradeCluster(clickedTile, upgradeType) {
        const currentTileType = clickedTile.texture.key;
        const upgradedTileType = `${currentTileType}_${upgradeType}`;

        console.log(`🌀 Clicked tile type: ${currentTileType}`);

        // Check if the upgraded texture exists
        if (!this.scene.textures.exists(upgradedTileType)) {
            console.warn(`❌ Upgrade texture not found: ${upgradedTileType}`);
            return null;
        }

        // Find all connected tiles of the same type using flood-fill
        const cluster = this.findConnectedTilesOfSameType(clickedTile, currentTileType);

        console.log(`✨ Found cluster of ${cluster.length} connected ${currentTileType} tiles`);

        // Find center of cluster for spiral animation
        const centerTile = this.findClusterCenter(cluster);

        // Apply upgrade in spiral pattern
        this.applyClusterUpgradeInSpiral(cluster, centerTile, upgradeType);

        // Return null because we're handling multiple tiles asynchronously
        return null;
    }

    /**
     * Upgrade an entire greenery cluster to a specific tile type in spiral pattern
     * Used for: A + Solar → powerplant, A + Trees → wood
     */
    upgradeGreeneryClusterToTile(clickedTile, targetTileType) {
        console.log(`🌀 Upgrading greenery cluster to: ${targetTileType}`);

        // Check if target texture exists
        if (!this.scene.textures.exists(targetTileType)) {
            console.warn(`❌ Target texture not found: ${targetTileType}`);
            return null;
        }

        // Find all connected greenery tiles (category-based, not texture-based)
        const cluster = this.findConnectedTilesOfCategory(clickedTile, 'greenery');

        console.log(`✨ Found greenery cluster of ${cluster.length} tiles`);

        // Find center of cluster for spiral animation
        const centerTile = this.findClusterCenter(cluster);

        // Apply upgrade in spiral pattern (pass null for upgradeType, use targetTileType directly)
        this.applyClusterUpgradeInSpiral(cluster, centerTile, null, targetTileType);

        // Return null because we're handling multiple tiles asynchronously
        return null;
    }

    /**
     * Find all tiles connected to the start tile with the same type
     */
    findConnectedTilesOfSameType(startTile, tileType) {
        const visited = new Set();
        const cluster = [];
        const queue = [startTile];

        while (queue.length > 0) {
            const currentTile = queue.shift();
            const currentIndex = this.scene.mapTiles.indexOf(currentTile);

            if (visited.has(currentIndex)) continue;
            if (currentTile.texture.key !== tileType) continue;

            visited.add(currentIndex);
            cluster.push(currentTile);

            // Find adjacent tiles (4-directional)
            const neighbors = this.scene.mapTiles.filter(tile => {
                const dx = Math.abs(tile.x - currentTile.x);
                const dy = Math.abs(tile.y - currentTile.y);
                return (dx === 32 && dy === 0) || (dx === 0 && dy === 32);
            });

            // Add unvisited neighbors of same type to queue
            for (const neighbor of neighbors) {
                const neighborIndex = this.scene.mapTiles.indexOf(neighbor);
                if (!visited.has(neighborIndex) && neighbor.texture.key === tileType) {
                    queue.push(neighbor);
                }
            }
        }

        return cluster;
    }

    /**
     * Find all tiles connected to the start tile with the same CATEGORY
     * Used for greenery cluster operations (finds grass+park+forest together)
     */
    findConnectedTilesOfCategory(startTile, category) {
        const visited = new Set();
        const cluster = [];
        const queue = [startTile];

        while (queue.length > 0) {
            const currentTile = queue.shift();
            const currentIndex = this.scene.mapTiles.indexOf(currentTile);

            if (currentIndex === -1 || visited.has(currentIndex)) {
                continue;
            }

            visited.add(currentIndex);

            // Check if this tile belongs to the target category
            const landUse = this.scene.mapArray[currentIndex];
            const tileCategory = this.scene.tileTypesManager && this.scene.tileTypesManager.getTileCategory(landUse);

            if (tileCategory === category) {
                cluster.push(currentTile);

                // Find adjacent tiles (4-directional)
                const neighbors = this.scene.mapTiles.filter(tile => {
                    const dx = Math.abs(tile.x - currentTile.x);
                    const dy = Math.abs(tile.y - currentTile.y);
                    return (dx === 32 && dy === 0) || (dx === 0 && dy === 32);
                });

                // Add unvisited neighbors to queue
                for (const neighbor of neighbors) {
                    const neighborIndex = this.scene.mapTiles.indexOf(neighbor);
                    if (!visited.has(neighborIndex)) {
                        queue.push(neighbor);
                    }
                }
            }
        }

        return cluster;
    }

    /**
     * Find the center tile of a cluster
     */
    findClusterCenter(tiles) {
        if (tiles.length === 0) return null;

        const avgX = tiles.reduce((sum, t) => sum + t.x, 0) / tiles.length;
        const avgY = tiles.reduce((sum, t) => sum + t.y, 0) / tiles.length;

        return tiles.reduce((closest, tile) => {
            const distCurrent = Math.sqrt(
                Math.pow(tile.x - avgX, 2) + Math.pow(tile.y - avgY, 2)
            );
            const distClosest = Math.sqrt(
                Math.pow(closest.x - avgX, 2) + Math.pow(closest.y - avgY, 2)
            );
            return distCurrent < distClosest ? tile : closest;
        });
    }

    /**
     * Show cluster preview with green tint in spiral pattern (while 'A' is held)
     */
    showClusterPreview(tile) {
        const currentTileType = tile.texture.key;
        const upgradeType = this.scene.gameState.upgrade;
        const upgradedTileType = `${currentTileType}_${upgradeType}`;

        console.log(`👁️ showClusterPreview called for ${currentTileType}`);

        // Cancel any existing preview animation
        // This allows moving to a new tile while previous animation is running
        this.clearClusterPreviewTimeouts();

        // Clear tints from previous cluster before showing new one
        if (this.tileArray && this.tileArray.length > 0) {
            this.tileArray.forEach(t => {
                if (t && typeof t.clearTint === 'function') {
                    t.clearTint();
                }
            });
        }

        // Check if upgrade exists for this tile
        if (!this.scene.textures.exists(upgradedTileType)) {
            // Show red tint for non-upgradeable tile
            console.log(`❌ No upgrade: ${upgradedTileType} - showing red tint on tile at (${tile.x}, ${tile.y})`);
            tile.setTint(0xff0000);
            console.log(`🔴 Applied RED tint to ${currentTileType} at (${tile.x}, ${tile.y})`);
            this.tileArray = [tile];
            return;
        }

        // Find cluster of connected tiles
        const cluster = this.findConnectedTilesOfSameType(tile, currentTileType);

        console.log(`✨ Found cluster of ${cluster.length} tiles for preview`);

        // Set animation lock
        this.isPreviewAnimating = true;

        // Sort tiles in spiral order from hovered tile (not center)
        const spiralOrder = [...cluster].sort((a, b) => {
            const distA = Math.sqrt(
                Math.pow(a.x - tile.x, 2) + Math.pow(a.y - tile.y, 2)
            );
            const distB = Math.sqrt(
                Math.pow(b.x - tile.x, 2) + Math.pow(b.y - tile.y, 2)
            );
            return distA - distB;
        });

        console.log(`🌀 Starting spiral tint animation for ${spiralOrder.length} tiles from hovered tile at (${tile.x}, ${tile.y})`);

        // Show green tint on all tiles in cluster in spiral pattern
        const delayPerTile = 10; // Same as TileTypesManager
        spiralOrder.forEach((clusterTile, orderIndex) => {
            const timeoutId = setTimeout(() => {
                if (clusterTile && typeof clusterTile.setTint === 'function') {
                    const tileIndex = this.scene.mapTiles.indexOf(clusterTile);
                    clusterTile.setTint(0x00ff00);
                    console.log(`🟢 [${orderIndex + 1}/${spiralOrder.length}] Applied GREEN tint to ${clusterTile.texture.key} at (${clusterTile.x}, ${clusterTile.y}) - mapTiles[${tileIndex}]`);
                }

                // Release lock when last tile is tinted
                if (orderIndex === spiralOrder.length - 1) {
                    this.isPreviewAnimating = false;
                    console.log(`✅ Spiral animation complete - lock released`);
                }
            }, orderIndex * delayPerTile);

            // Store timeout ID for potential cancellation
            this.clusterPreviewTimeouts.push(timeoutId);
        });

        // Store in tileArray for cleanup by handlePointerOut
        this.tileArray = cluster;
    }

    /**
     * Show greenery cluster preview with green tint in spiral pattern
     * Used for: A + Solar over greenery, A + Trees over greenery
     */
    showGreeneryClusterPreview(tile, targetTileType) {
        const tile0 = this.scene.mapTiles.indexOf(tile);
        const landUse = this.scene.mapArray[tile0];
        const category = this.scene.tileTypesManager && this.scene.tileTypesManager.getTileCategory(landUse);

        console.log(`👁️ showGreeneryClusterPreview called - category: ${category}, target: ${targetTileType}`);

        // Must be greenery category
        if (category !== 'greenery') {
            console.log(`❌ Not greenery - showing red tint`);
            tile.setTint(0xff0000);
            this.tileArray = [tile];
            return;
        }

        // Cancel any existing preview animation
        this.clearClusterPreviewTimeouts();

        // Clear tints from previous cluster
        if (this.tileArray && this.tileArray.length > 0) {
            this.tileArray.forEach(t => {
                if (t && typeof t.clearTint === 'function') {
                    t.clearTint();
                }
            });
        }

        // Find cluster of connected greenery tiles (category-based, not texture-based)
        const cluster = this.findConnectedTilesOfCategory(tile, 'greenery');

        console.log(`✨ Found greenery cluster of ${cluster.length} tiles for preview`);

        // Set animation lock
        this.isPreviewAnimating = true;

        // Sort tiles in spiral order from hovered tile
        const spiralOrder = [...cluster].sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - tile.x, 2) + Math.pow(a.y - tile.y, 2));
            const distB = Math.sqrt(Math.pow(b.x - tile.x, 2) + Math.pow(b.y - tile.y, 2));
            return distA - distB;
        });

        console.log(`🌀 Starting spiral tint animation for ${spiralOrder.length} greenery tiles`);

        // Show green tint on all tiles in cluster in spiral pattern
        const delayPerTile = 10;
        spiralOrder.forEach((clusterTile, orderIndex) => {
            const timeoutId = setTimeout(() => {
                if (clusterTile && typeof clusterTile.setTint === 'function') {
                    clusterTile.setTint(0x00ff00);
                    console.log(`🟢 [${orderIndex + 1}/${spiralOrder.length}] Applied GREEN tint to ${clusterTile.texture.key}`);
                }

                // Release lock when last tile is tinted
                if (orderIndex === spiralOrder.length - 1) {
                    this.isPreviewAnimating = false;
                    console.log(`✅ Greenery spiral animation complete`);
                }
            }, orderIndex * delayPerTile);

            this.clusterPreviewTimeouts.push(timeoutId);
        });

        // Store in tileArray for cleanup
        this.tileArray = spiralOrder;
    }

    /**
     * Clear all cluster preview animation timeouts
     */
    clearClusterPreviewTimeouts() {
        this.clusterPreviewTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.clusterPreviewTimeouts = [];
        this.isPreviewAnimating = false;
    }

    /**
     * Apply upgrade to cluster in spiral pattern from center
     */
    applyClusterUpgradeInSpiral(tiles, centerTile, upgradeType, targetTileType = null) {
        if (!tiles || tiles.length === 0) return;

        // Sort tiles by distance from center (spiral outward)
        const spiralOrder = [...tiles].sort((a, b) => {
            const distA = Math.sqrt(
                Math.pow(a.x - centerTile.x, 2) + Math.pow(a.y - centerTile.y, 2)
            );
            const distB = Math.sqrt(
                Math.pow(b.x - centerTile.x, 2) + Math.pow(b.y - centerTile.y, 2)
            );
            return distA - distB;
        });

        // Apply upgrades in spiral order with delay
        const delayPerTile = 15;
        let upgradeCount = 0;

        spiralOrder.forEach((tile, orderIndex) => {
            setTimeout(() => {
                const currentType = tile.texture.key;

                // Determine new tile type
                let newTileType;
                if (targetTileType) {
                    // Direct tile type (for greenery clusters → powerplant/wood)
                    newTileType = targetTileType;
                } else {
                    // Suffix upgrade (for residential clusters → tileName_solar)
                    newTileType = `${currentType}_${upgradeType}`;
                }

                if (this.scene.textures.exists(newTileType)) {
                    console.log(`🔧 BEFORE: tile.texture.key = "${tile.texture.key}"`);

                    // Update texture
                    tile.setTexture(newTileType, 0);

                    console.log(`🔧 AFTER setTexture: tile.texture.key = "${tile.texture.key}"`);

                    // Update mapArray
                    const tileIndex = this.scene.mapTiles.indexOf(tile);
                    if (tileIndex !== -1) {
                        console.log(`🔧 Updating mapArray[${tileIndex}] from "${this.scene.mapArray[tileIndex]}" to "${newTileType}"`);
                        this.scene.mapArray[tileIndex] = newTileType;
                        console.log(`🔧 Confirmed: mapArray[${tileIndex}] = "${this.scene.mapArray[tileIndex]}"`);
                    }

                    // Clear tint
                    if (typeof tile.clearTint === 'function') {
                        tile.clearTint();
                    }

                    // Play animation if exists
                    if (this.scene.anims.exists(newTileType)) {
                        console.log(`🎬 Playing animation: "${newTileType}"`);
                        tile.play({ key: newTileType, randomFrame: true });
                        console.log(`🎬 Animation status: ${tile.anims.isPlaying ? 'PLAYING' : 'NOT PLAYING'}, current anim: "${tile.anims.currentAnim ? tile.anims.currentAnim.key : 'none'}"`);
                    } else {
                        console.log(`⚠️ No animation found for "${newTileType}"`);
                        tile.anims.stop();
                    }

                    // Update tile changes for saving
                    if (tile.id !== undefined) {
                        const changeIndex = this.scene.tileChanges.findIndex(t => t.id === tile.id);
                        if (changeIndex !== -1) {
                            this.scene.tileChanges[changeIndex].newTileType = newTileType;
                        } else {
                            this.scene.tileChanges.push({ id: tile.id, newTileType: newTileType });
                        }
                    }

                    // Re-register with TileTypesManager to update category arrays
                    if (this.scene.tileTypesManager && tileIndex !== -1) {
                        console.log(`🔄 Re-registering tile ${tileIndex} with TileTypesManager`);
                        this.scene.tileTypesManager.registerTile(tile, tileIndex);
                    }

                    upgradeCount++;
                    console.log(`☀️ Upgraded ${currentType} -> ${solarType} (${upgradeCount}/${spiralOrder.length})`);
                }

                // On last tile, update simulation and save state
                if (orderIndex === spiralOrder.length - 1) {
                    console.log(`✅ Cluster upgrade complete! ${upgradeCount} tiles upgraded`);

                    // Update city simulation
                    if (this.scene.citySim) {
                        this.scene.citySim.immediateUpdate();
                    }

                    // Save state for undo/redo
                    if (!this.scene.isLoadingMap) {
                        this.scene.saveState();
                    }

                    // Emit event for cluster upgrade completion
                    this.scene.emitter.emit('TILE_PLACED', {
                        oldTileType: currentType,
                        newTileType: newTileType
                    });
                }
            }, orderIndex * delayPerTile);
        });
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
