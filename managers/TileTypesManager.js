/**
 * TileTypesManager
 * Manages categorization of tiles and provides base hover interactions
 * Independent of tool/mode-based interactions
 */
export default class TileTypesManager {
    constructor(scene) {
        this.scene = scene;

        // Category arrays
        this.commercialTiles = [];
        this.industrialTiles = [];
        this.residentialTiles = [];
        this.greeneryTiles = [];

        // Category definitions
        this.categoryDefinitions = {
            commercial: ['commercial', 'retail'],
            industrial: ['industrial', 'warehouse', 'garage'],
            residential: ['house', 'detached', 'residential', 'neighborhood', 'neighbourhood', 'apartments', 'apartment', 'terrace'],
            greenery: ['no_data', 'woods', 'wood', 'grass', 'meadow', 'shrub', 'park', 'golf_course']
        };

        // Category tint colors
        this.categoryColors = {
            commercial: 0x0000FF,  // Blue
            industrial: 0xFFFF00,  // Yellow
            residential: 0xFFA500, // Orange
            greenery: 0x00FF00     // Green
        };

        // Track currently hovered tile and cluster
        this.hoveredTile = null;
        this.hoveredCategory = null;
        this.tintedCluster = []; // Array of tiles that have been tinted
        this.activeTimeouts = []; // Track active animation timeouts for cancellation
        this.isAnimating = false; // Lock to prevent re-triggering during animation

        // Track which tiles have been registered to prevent duplicate listeners
        this.registeredTiles = new Set();

        // NEW UNIFIED ARCHITECTURE: Store cluster for upgrade on click
        this.savedClusterForUpgrade = [];
        this.currentUpgradeMode = null;
    }

    /**
     * Initialize the category manager
     * Called once when first tiles are ready
     */
    initialize() {
        console.log('🏗️ Initializing TileTypesManager for streaming tiles...');

        // Clear existing arrays
        this.commercialTiles = [];
        this.industrialTiles = [];
        this.residentialTiles = [];
        this.greeneryTiles = [];

        // Ready to receive streaming tiles
        console.log('✅ TileTypesManager ready to categorize streaming tiles');
    }

    /**
     * Register a single tile as it streams in
     * This is called for each tile during the streaming process
     */
    registerTile(tile, index) {
        if (!tile) return;

        // Get land use for this tile
        const landUse = this.scene.mapArray[index];
        if (!landUse) return;

        // Categorize the tile
        if (this.categoryDefinitions.commercial.includes(landUse)) {
            this.commercialTiles.push({ tile, index, landUse });
        } else if (this.categoryDefinitions.industrial.includes(landUse)) {
            this.industrialTiles.push({ tile, index, landUse });
        } else if (this.categoryDefinitions.residential.includes(landUse)) {
            this.residentialTiles.push({ tile, index, landUse });
        } else if (this.categoryDefinitions.greenery.includes(landUse)) {
            this.greeneryTiles.push({ tile, index, landUse });
        }

        // Only set up interaction if this tile hasn't been registered yet
        if (!this.registeredTiles.has(index)) {
            this.setupTileInteraction(tile, index);
            this.registeredTiles.add(index);
        }
    }

    /**
     * Set up base pointer interaction for a single tile
     * This runs independently of any tool/mode selection
     * Note: Tiles are already made interactive by GameScene, we just add our handlers
     */
    setupTileInteraction(tile, index) {
        if (!tile) return;

        console.log(`🎯 TileTypesManager: Setting up listeners for tile ${index} (${tile.texture.key})`);

        // Tiles are already interactive from GameScene setup
        // We just add our category-based hover handlers

        // Add base hover handler (runs before other handlers)
        tile.on('pointerover', (pointer) => {
            console.log(`🔵 TileTypesManager: pointerover fired for tile ${index}`);
            this.handleBaseTileHover(tile, index, pointer);
        });

        tile.on('pointerout', (pointer) => {
            console.log(`🔴 TileTypesManager: pointerout fired for tile ${index}`);
            this.handleBaseTileOut(tile, index, pointer);
        });

        // Add default click handler for greenery tiles
        tile.on('pointerdown', (pointer) => {
            console.log(`⚫ TileTypesManager: pointerdown fired for tile ${index}`);
            this.handleBaseTileClick(tile, index, pointer);
        });

        console.log(`✅ TileTypesManager: Listeners registered for tile ${index}`);
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Handle base tile hover - routes to appropriate tinting method based on mode
     * This is the SINGLE ENTRY POINT for all hover interactions
     */
    handleBaseTileHover(tile, index, pointer) {
        console.log(`🌟 TileTypesManager.handleBaseTileHover called for tile ${index}`);

        const mode = this.getTintingMode();
        console.log(`🎮 Current mode: ${mode}`);

        // Skip if already animating to prevent performance issues
        if (this.isAnimating) {
            return;
        }

        this.hoveredTile = tile;

        switch(mode) {
            case 'base':
                this.applyBaseCategoryTint(tile, index);
                break;
            case 'solar':
                this.applySolarTint(tile, index);
                break;
            case 'trees':
                this.applyTreesTint(tile, index);
                break;
            case 'wind':
                this.applyWindTint(tile, index);
                break;
            case 'info':
                this.displayTileInfo(tile, index);
                break;
            case 'none':
                // Do nothing (navigation mode)
                break;
            default:
                // Unknown mode - do nothing
                break;
        }
    }

    // OLD ARCHITECTURE - COMMENTED OUT:
    // handleBaseTileHover(tile, index, pointer) {
    //     console.log(`🌟 TileTypesManager.handleBaseTileHover called for tile ${index}`);
    //     const shouldApply = this.shouldApplyBaseTint();
    //     console.log(`🔍 shouldApplyBaseTint returned: ${shouldApply}`);
    //     if (shouldApply) {
    //         if (this.isAnimating) return;
    //         this.hoveredTile = tile;
    //         const landUse = this.scene.mapArray[index];
    //         let category = this.getTileCategory(landUse);
    //         if (category) {
    //             this.hoveredCategory = category;
    //             const tintColor = this.categoryColors[category];
    //             const connectedTiles = this.findConnectedTilesOfCategory(tile, category);
    //             this.tintedCluster = connectedTiles;
    //             this.applyTintInSpiral(connectedTiles, tile, tintColor);
    //             console.log(`✨ Tile ${index} (${landUse}) - ${category} cluster tint applied to ${connectedTiles.length} connected tiles`);
    //         }
    //     }
    // }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Apply base category tinting (no tools active)
     * No A key: Tint only hovered tile
     * A key held: Tint entire cluster in spiral
     */
    applyBaseCategoryTint(tile, index) {
        const landUse = this.scene.mapArray[index];
        let category = this.getTileCategory(landUse);

        if (category) {
            this.hoveredCategory = category;
            const tintColor = this.categoryColors[category];

            // Check if spiral mode is enabled
            const spiralMode = this.scene.inputManager?.spiralMode;

            if (!spiralMode) {
                // Spiral mode OFF: Tint ONLY the hovered tile
                console.log(`🎯 Spiral mode OFF - tinting single tile ${index} (${landUse})`);
                tile.setTint(tintColor);
                this.tintedCluster = [tile];
            } else {
                // Spiral mode ON: Tint entire cluster in spiral
                console.log(`🌀 Spiral mode ON - tinting cluster for tile ${index} (${landUse})`);
                const connectedTiles = this.findConnectedTilesOfCategory(tile, category);
                this.tintedCluster = connectedTiles;
                this.applyTintInSpiral(connectedTiles, tile, tintColor);
                console.log(`✨ ${category} cluster tint applied to ${connectedTiles.length} connected tiles`);
            }
        }
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Apply solar tinting based on A key state
     * No A key: Tint only hovered tile
     * A key held: Spiral tint entire cluster
     * MATCHES the pattern of applyBaseCategoryTint for consistency
     */
    applySolarTint(tile, index) {
        const landUse = this.scene.mapArray[index];
        const category = this.getTileCategory(landUse);
        const spiralMode = this.scene.inputManager?.spiralMode;

        console.log(`☀️ applySolarTint - category: ${category}, spiral mode: ${spiralMode}`);

        // Solar works on: residential OR greenery
        if (category !== 'residential' && category !== 'greenery') {
            console.log(`❌ Solar doesn't work on ${category} - showing red tint`);
            tile.setTint(0xff0000);
            this.tintedCluster = [tile];
            this.savedClusterForUpgrade = [];
            return;
        }

        // Find cluster by category (always find it, so we have it saved for click)
        // Works for both greenery (grass + park + forest) and residential (house + house_b + apartment)
        const cluster = this.findConnectedTilesOfCategory(tile, category);

        console.log(`✨ Found cluster of ${cluster.length} tiles`);

        // ALWAYS save cluster for click handler (even if not showing spiral)
        this.savedClusterForUpgrade = cluster;
        this.currentUpgradeMode = 'solar';

        if (!spiralMode) {
            // Spiral mode OFF: Tint ONLY the hovered tile
            console.log(`🎯 Spiral mode OFF - tinting single tile ${index}`);
            tile.setTint(0x00ff00);
            this.tintedCluster = [tile];
        } else {
            // Spiral mode ON: Tint entire cluster in spiral
            console.log(`🌀 Spiral mode ON - spiral tinting ${cluster.length} tiles`);
            this.tintedCluster = cluster;
            this.applyTintInSpiral(cluster, tile, 0x00ff00);
        }
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Apply trees tinting - to be implemented
     */
    applyTreesTint(tile, index) {
        console.log(`🌲 applyTreesTint - TODO: implement`);
        // TODO: Similar to solar, but only works on greenery
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Apply wind tinting - to be implemented
     */
    applyWindTint(tile, index) {
        console.log(`💨 applyWindTint - TODO: implement`);
        // TODO: Similar to solar, but only works on greenery
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Display tile info when in info mode (spacebar held)
     */
    displayTileInfo(tile, index, pointer) {
        const landUse = this.scene.mapArray[index];
        const textureKey = tile.texture.key;
        const category = this.getTileCategory(landUse);

        // Dim all tiles except the hovered one
        this.scene.mapTiles.forEach(mapTex => {
            if (mapTex) mapTex.setAlpha(0.2);
        });

        // Highlight current tile to full opacity
        if (tile) {
            tile.setAlpha(1.0);
        }

        if (this.scene.infoTextElement) {
            const infoText = `Tile ${index} | Texture: "${textureKey}" | Land Use: "${landUse}" | Category: "${category || 'none'}"`;
            this.scene.infoTextElement.textContent = infoText;
            this.scene.infoTextElement.classList.add('show');

            // Position the info box near the cursor (if pointer is available)
            if (pointer) {
                const offsetX = 15; // 15px to the right of cursor
                const offsetY = 15; // 15px below cursor
                this.scene.infoTextElement.style.left = (pointer.x + offsetX) + 'px';
                this.scene.infoTextElement.style.top = (pointer.y + offsetY) + 'px';
            }
        }
    }

    /**
     * Apply tint in a spiral pattern FROM the center (hovered tile)
     * Uses the same spiral logic as renderGridInSpiral
     */
    applyTintInSpiral(tiles, centerTile, tintColor) {
        if (!tiles || tiles.length === 0) return;

        // Set animation lock
        this.isAnimating = true;

        // Clear any existing animation timeouts first
        this.clearAnimationTimeouts();

        // Generate spiral order from center (sorted by distance)
        const spiralOrder = this.generateSpiralOrder(tiles, centerTile);

        // Apply tints in spiral order with delay
        const delayPerTile = 10; // milliseconds between each tile tint
        spiralOrder.forEach((tile, orderIndex) => {
            const timeoutId = setTimeout(() => {
                if (tile && typeof tile.setTint === 'function') {
                    tile.setTint(tintColor);
                }

                // Release lock when last tile is tinted
                if (orderIndex === spiralOrder.length - 1) {
                    this.isAnimating = false;
                }
            }, orderIndex * delayPerTile);

            // Store timeout ID for potential cancellation
            this.activeTimeouts.push(timeoutId);
        });
    }

    /**
     * Clear all active animation timeouts and release animation lock
     */
    clearAnimationTimeouts() {
        this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.activeTimeouts = [];
        this.isAnimating = false; // Release lock when clearing animations
    }

    /**
     * Generate spiral order for tiles starting from center tile
     * Based on the spiral algorithm from renderGridInSpiral / generateSpiralBoundingBoxes
     */
    generateSpiralOrder(tiles, centerTile) {
        if (!tiles || tiles.length === 0) return [];

        // Sort tiles by distance from center (spiral outward)
        const spiralOrder = [...tiles].sort((a, b) => {
            const distA = Math.sqrt(
                Math.pow(a.x - centerTile.x, 2) +
                Math.pow(a.y - centerTile.y, 2)
            );
            const distB = Math.sqrt(
                Math.pow(b.x - centerTile.x, 2) +
                Math.pow(b.y - centerTile.y, 2)
            );
            return distA - distB;
        });

        return spiralOrder;
    }

    /**
     * Flood-fill algorithm to find all connected tiles of the same category
     * Returns array of all tiles that are touching and share the same category
     */
    findConnectedTilesOfCategory(startTile, category) {
        const visited = new Set();
        const connectedTiles = [];
        const queue = [startTile];

        while (queue.length > 0) {
            const currentTile = queue.shift();
            const currentIndex = this.scene.mapTiles.indexOf(currentTile);

            // Skip if already visited or invalid
            if (currentIndex === -1 || visited.has(currentIndex)) {
                continue;
            }

            // Check if this tile belongs to the same category
            const currentLandUse = this.scene.mapArray[currentIndex];
            const currentCategory = this.getTileCategory(currentLandUse);

            if (currentCategory === category) {
                // Mark as visited and add to connected tiles
                visited.add(currentIndex);
                connectedTiles.push(currentTile);

                // Get neighbors and add unvisited ones to queue
                const neighbors = this.scene.getNeighborsForTile(currentTile, this.scene);
                neighbors.forEach(neighbor => {
                    const neighborIndex = this.scene.mapTiles.indexOf(neighbor);
                    if (neighborIndex !== -1 && !visited.has(neighborIndex)) {
                        queue.push(neighbor);
                    }
                });
            }
        }

        return connectedTiles;
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Find all tiles connected to start tile with EXACT SAME TEXTURE
     * Used for residential cluster upgrades (house with house only, not mixed residential types)
     */
    findConnectedTilesOfSameTexture(startTile, textureKey) {
        const visited = new Set();
        const connectedTiles = [];
        const queue = [startTile];

        while (queue.length > 0) {
            const currentTile = queue.shift();
            const currentIndex = this.scene.mapTiles.indexOf(currentTile);

            if (currentIndex === -1 || visited.has(currentIndex)) continue;
            if (currentTile.texture.key !== textureKey) continue;

            visited.add(currentIndex);
            connectedTiles.push(currentTile);

            // Get 4-directional neighbors
            const neighbors = this.scene.mapTiles.filter(tile => {
                const dx = Math.abs(tile.x - currentTile.x);
                const dy = Math.abs(tile.y - currentTile.y);
                return (dx === 32 && dy === 0) || (dx === 0 && dy === 32);
            });

            neighbors.forEach(neighbor => {
                const neighborIndex = this.scene.mapTiles.indexOf(neighbor);
                if (!visited.has(neighborIndex) && neighbor.texture.key === textureKey) {
                    queue.push(neighbor);
                }
            });
        }

        return connectedTiles;
    }

    /**
     * Handle base tile out - removes tint from cluster
     */
    handleBaseTileOut(tile) {
        if (this.hoveredTile === tile) {
            // Cancel any ongoing animation timeouts
            this.clearAnimationTimeouts();

            // Clear all tints using utility method
            this.clearAllTints();
        }
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Handle base tile click - routes to appropriate handler based on mode
     */
    handleBaseTileClick(tile, index, pointer) {
        console.log(`⚫ TileTypesManager.handleBaseTileClick - tile ${index}`);

        const mode = this.getTintingMode();
        console.log(`🎮 Click mode: ${mode}`);

        // Debug: Show tintedCluster state
        console.log(`🔍 tintedCluster length: ${this.tintedCluster ? this.tintedCluster.length : 0}`);
        console.log(`🔍 Clicked tile in tintedCluster? ${this.tintedCluster && this.tintedCluster.includes(tile)}`);
        console.log(`🔍 savedClusterForUpgrade length: ${this.savedClusterForUpgrade ? this.savedClusterForUpgrade.length : 0}`);

        // Only handle clicks if tile is in tinted cluster
        if (!this.tintedCluster || !this.tintedCluster.includes(tile)) {
            console.log(`⚠️ Tile not in tinted cluster - ignoring click`);
            console.log(`⚠️ This might be because pointerout cleared the tint before click registered`);
            return;
        }

        switch(mode) {
            case 'base':
                this.handleBaseClick(tile, index);
                break;

            case 'solar':
                this.handleSolarClick(tile, index);
                break;

            case 'trees':
                this.handleTreesClick(tile, index);
                break;

            case 'wind':
                this.handleWindClick(tile, index);
                break;

            default:
                console.log(`⚠️ No click handler for mode: ${mode}`);
                break;
        }
    }

    // OLD ARCHITECTURE - COMMENTED OUT:
    // handleBaseTileClick(tile, index, pointer) {
    //     if (this.shouldApplyBaseTint()) {
    //         if (this.scene.inputManager && this.scene.inputManager.isAKeyHeld) {
    //             console.log(`🔑 A key held - skipping auto-placement`);
    //             return;
    //         }
    //         const isTinted = this.tintedCluster && this.tintedCluster.includes(tile);
    //         const isGreenTinted = this.hoveredCategory === 'greenery';
    //         if (isTinted && isGreenTinted) {
    //             console.log(`🌳 Auto-placing trees on green-tinted tile ${index}`);
    //             this.scene.gameState.resetAllModes();
    //             this.scene.gameState.trees = true;
    //             this.scene.gameState.smallTile = true;
    //             this.scene.gameState.placeTile = true;
    //             this.scene.gameState.newTile = 'wood';
    //             setTimeout(() => {
    //                 this.scene.gameState.resetAllModes();
    //                 if (this.tintedCluster && this.tintedCluster.length > 0) {
    //                     this.tintedCluster.forEach(clusterTile => {
    //                         if (clusterTile && typeof clusterTile.clearTint === 'function') {
    //                             clusterTile.clearTint();
    //                         }
    //                     });
    //                 }
    //                 this.tintedCluster = [];
    //                 this.hoveredTile = null;
    //                 this.hoveredCategory = null;
    //             }, 50);
    //         }
    //     }
    // }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Handle base click (no tools active) - auto-place trees on greenery
     * DISABLED FOR NOW - causing interference with solar upgrades
     */
    handleBaseClick(tile, index) {
        console.log(`🌳 handleBaseClick called - DISABLED to prevent interference`);
        // TODO: Re-implement tree auto-placement after solar upgrades are working
        // const isGreenTinted = this.hoveredCategory === 'greenery';
        // if (!isGreenTinted) return;
        // if (this.scene.inputManager && this.scene.inputManager.isAKeyHeld) return;
        // // Place tree logic here
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Handle solar click
     * No A key: Upgrade tile at index 0 only
     * A key held: Upgrade entire cluster
     */
    handleSolarClick(tile, index) {
        if (!this.savedClusterForUpgrade || this.savedClusterForUpgrade.length === 0) {
            console.log(`⚠️ No saved cluster - ignoring click`);
            return;
        }

        const landUse = this.scene.mapArray[index];
        const category = this.getTileCategory(landUse);
        const spiralMode = this.scene.inputManager?.spiralMode;

        console.log(`☀️ handleSolarClick - category: ${category}, spiral mode: ${spiralMode}, cluster size: ${this.savedClusterForUpgrade.length}`);

        let tilesToUpgrade;

        if (!spiralMode) {
            // Spiral mode OFF: Upgrade ONLY index 0
            tilesToUpgrade = [this.savedClusterForUpgrade[0]];
            console.log(`🎯 Upgrading index 0 only`);
        } else {
            // Spiral mode ON: Upgrade ENTIRE cluster
            tilesToUpgrade = this.savedClusterForUpgrade;
            console.log(`🌀 Upgrading entire cluster (${tilesToUpgrade.length} tiles)`);
        }

        // Determine upgrade type
        const upgradeType = (category === 'greenery') ? 'power:plant (solar)' : '_solar';

        // Apply upgrades in spiral pattern
        this.applyUpgradeInSpiral(tilesToUpgrade, tile, upgradeType, category);
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Handle trees click - to be implemented
     */
    handleTreesClick(tile, index) {
        console.log(`🌲 handleTreesClick - TODO: implement`);
        // TODO: Similar to solar click, place wood on greenery
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Handle wind click - to be implemented
     */
    handleWindClick(tile, index) {
        console.log(`💨 handleWindClick - TODO: implement`);
        // TODO: Similar to solar click, place wind turbines on greenery
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Apply texture upgrades in spiral pattern from center
     * This is the core method that changes tile textures
     */
    applyUpgradeInSpiral(tiles, centerTile, upgradeType, category) {
        // Sort by distance for spiral effect
        const spiralOrder = [...tiles].sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - centerTile.x, 2) + Math.pow(a.y - centerTile.y, 2));
            const distB = Math.sqrt(Math.pow(b.x - centerTile.x, 2) + Math.pow(b.y - centerTile.y, 2));
            return distA - distB;
        });

        const delayPerTile = 15;
        let upgradeCount = 0;

        spiralOrder.forEach((tile, orderIndex) => {
            setTimeout(() => {
                const currentType = tile.texture.key;
                let newTileType;

                if (category === 'greenery') {
                    // Greenery → direct tile type (power:plant)
                    newTileType = upgradeType;
                } else {
                    // Residential → concatenate suffix (house + _solar = house_solar)
                    newTileType = currentType + upgradeType;
                }

                console.log(`🔧 [${orderIndex + 1}/${spiralOrder.length}] Upgrading: ${currentType} → ${newTileType}`);

                // Check if texture exists
                if (this.scene.textures.exists(newTileType)) {
                    console.log(`🔧 BEFORE upgrade - tile.texture.key: ${tile.texture.key}`);

                    // Update texture
                    tile.setTexture(newTileType, 0);

                    console.log(`🔧 AFTER setTexture - tile.texture.key: ${tile.texture.key}`);

                    // Update mapArray
                    const tileIndex = this.scene.mapTiles.indexOf(tile);
                    if (tileIndex !== -1) {
                        console.log(`🔧 Updating mapArray[${tileIndex}] from "${this.scene.mapArray[tileIndex]}" to "${newTileType}"`);
                        this.scene.mapArray[tileIndex] = newTileType;
                        console.log(`🔧 Verified: mapArray[${tileIndex}] = "${this.scene.mapArray[tileIndex]}"`);
                    }

                    // Clear tint
                    if (tile.clearTint) {
                        tile.clearTint();
                    }

                    // Play animation if exists
                    if (this.scene.anims.exists(newTileType)) {
                        tile.play({ key: newTileType, randomFrame: true });
                    }

                    // Update tile changes for saving
                    if (tile.id !== undefined) {
                        const changeIndex = this.scene.tileChanges.findIndex(t => t.id === tile.id);
                        if (changeIndex !== -1) {
                            this.scene.tileChanges[changeIndex].newTileType = newTileType;
                            console.log(`📝 Updated tileChanges[${changeIndex}] to ${newTileType}`);
                        } else {
                            this.scene.tileChanges.push({ id: tile.id, newTileType: newTileType });
                            console.log(`📝 Added new tileChange: id=${tile.id}, newTileType=${newTileType}`);
                        }
                    }

                    // Emit climate event for EACH tile upgrade
                    this.scene.emitter.emit('TILE_PLACED', {
                        oldTileType: currentType,
                        newTileType: newTileType
                    });

                    upgradeCount++;
                } else {
                    console.warn(`⚠️ Texture not found: ${newTileType}`);
                }

                // On last tile: update simulation & save state
                if (orderIndex === spiralOrder.length - 1) {
                    console.log(`✅ Upgrade complete! ${upgradeCount}/${spiralOrder.length} tiles upgraded`);

                    if (this.scene.citySim) {
                        this.scene.citySim.immediateUpdate();
                    }

                    if (!this.scene.isLoadingMap) {
                        this.scene.saveState();
                    }

                    // Clear saved cluster
                    this.savedClusterForUpgrade = [];
                    this.currentUpgradeMode = null;
                }
            }, orderIndex * delayPerTile);
        });
    }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Clear all tints and reset state
     */
    clearAllTints() {
        if (this.tintedCluster && this.tintedCluster.length > 0) {
            this.tintedCluster.forEach(clusterTile => {
                if (clusterTile && typeof clusterTile.clearTint === 'function') {
                    clusterTile.clearTint();
                }
            });
        }
        this.tintedCluster = [];
        this.hoveredTile = null;
        this.hoveredCategory = null;

        // Restore all tiles to full opacity (in case we were in info mode)
        this.scene.mapTiles.forEach(mapTex => {
            if (mapTex) mapTex.setAlpha(1.0);
        });

        // Clear info text if visible
        if (this.scene.infoTextElement) {
            this.scene.infoTextElement.textContent = '';
            this.scene.infoTextElement.classList.remove('show');
        }
    }

    // OLD ARCHITECTURE - COMMENTED OUT:
    // /**
    //  * Determine if base tinting should be applied
    //  * Returns true only when no tool/mode is active
    //  */
    // shouldApplyBaseTint() {
    //     const gameState = this.scene.gameState;
    //     const hasActiveMode = gameState.infoBool ||
    //                          gameState.moveBool ||
    //                          gameState.rotateBool ||
    //                          gameState.zoomBool ||
    //                          gameState.homeBool ||
    //                          gameState.destroy ||
    //                          gameState.wind ||
    //                          gameState.solar ||
    //                          gameState.trees ||
    //                          gameState.mediumTile ||
    //                          gameState.largeTile;
    //     return !hasActiveMode;
    // }

    /**
     * NEW UNIFIED ARCHITECTURE:
     * Determine the current tinting mode based on gameState
     * Returns: 'base', 'solar', 'trees', 'wind', 'destroy', 'road', 'bike', or 'none'
     */
    getTintingMode() {
        const gs = this.scene.gameState;

        // Debug: Show current state
        console.log(`🔍 getTintingMode - upgrade: ${gs.upgrade}, solar: ${gs.solar}, trees: ${gs.trees}, destroy: ${gs.destroy}`);

        // Check for active tool states (in priority order)
        // SIMPLIFIED: Only check upgrade property, not both upgrade and solar
        if (gs.upgrade === 'solar') {
            console.log(`✅ Returning 'solar' mode`);
            return 'solar';
        }
        if (gs.trees) return 'trees';
        if (gs.wind) return 'wind';
        if (gs.destroy) return 'destroy';
        if (gs.road) return 'road';
        if (gs.bike) return 'bike';

        // Check for info mode (display tile info)
        if (gs.infoBool) {
            return 'info';
        }

        // Check for navigation modes (no tinting)
        if (gs.moveBool || gs.rotateBool || gs.zoomBool || gs.homeBool) {
            return 'none';
        }

        // Default: base category tinting
        console.log(`⚠️ No active mode - returning 'base'`);
        return 'base';
    }

    /**
     * Get the category of a tile based on its land use
     */
    getTileCategory(landUse) {
        if (!landUse) return null;

        if (this.categoryDefinitions.commercial.includes(landUse)) {
            return 'commercial';
        } else if (this.categoryDefinitions.industrial.includes(landUse)) {
            return 'industrial';
        } else if (this.categoryDefinitions.residential.includes(landUse)) {
            return 'residential';
        } else if (this.categoryDefinitions.greenery.includes(landUse)) {
            return 'greenery';
        }

        return null;
    }

    /**
     * Get all tiles in a specific category
     */
    getTilesByCategory(category) {
        switch(category) {
            case 'commercial':
                return this.commercialTiles;
            case 'industrial':
                return this.industrialTiles;
            case 'residential':
                return this.residentialTiles;
            case 'greenery':
                return this.greeneryTiles;
            default:
                return [];
        }
    }

    /**
     * Add a land use type to a category
     */
    addToCategory(category, landUseType) {
        if (this.categoryDefinitions[category]) {
            if (!this.categoryDefinitions[category].includes(landUseType)) {
                this.categoryDefinitions[category].push(landUseType);
                console.log(`✅ Added '${landUseType}' to ${category} category`);
                // Re-initialize to update arrays
                this.initialize();
            }
        }
    }

    /**
     * Remove a land use type from a category
     */
    removeFromCategory(category, landUseType) {
        if (this.categoryDefinitions[category]) {
            const index = this.categoryDefinitions[category].indexOf(landUseType);
            if (index > -1) {
                this.categoryDefinitions[category].splice(index, 1);
                console.log(`✅ Removed '${landUseType}' from ${category} category`);
                // Re-initialize to update arrays
                this.initialize();
            }
        }
    }

    /**
     * Clean up and destroy
     */
    destroy() {
        this.commercialTiles = [];
        this.industrialTiles = [];
        this.residentialTiles = [];
        this.greeneryTiles = [];
        this.hoveredTile = null;
        this.hoveredCategory = null;
        this.tintedCluster = [];
        this.registeredTiles.clear();

        // NEW UNIFIED ARCHITECTURE: Clean up new properties
        this.savedClusterForUpgrade = [];
        this.currentUpgradeMode = null;
    }
}
