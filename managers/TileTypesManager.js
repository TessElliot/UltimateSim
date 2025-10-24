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

        // Tiles are already interactive from GameScene setup
        // We just add our category-based hover handlers

        // Add base hover handler (runs before other handlers)
        tile.on('pointerover', (pointer) => {
            this.handleBaseTileHover(tile, index, pointer);
        });

        tile.on('pointerout', (pointer) => {
            this.handleBaseTileOut(tile, index, pointer);
        });

        // Add default click handler for greenery tiles
        tile.on('pointerdown', (pointer) => {
            this.handleBaseTileClick(tile, index, pointer);
        });
    }

    /**
     * Handle base tile hover - shows category-based tint
     * This runs BEFORE any tool/mode interactions
     * Tints all connected tiles of the same category (flood-fill) with SPIRAL ANIMATION
     */
    handleBaseTileHover(tile, index, pointer) {
        // Only apply base tinting if no active tool/mode is selected
        if (this.shouldApplyBaseTint()) {
            // Skip if already animating to prevent performance issues
            if (this.isAnimating) {
                return;
            }

            this.hoveredTile = tile;

            // Determine category and apply appropriate tint
            const landUse = this.scene.mapArray[index];
            let category = this.getTileCategory(landUse);

            if (category) {
                this.hoveredCategory = category;
                const tintColor = this.categoryColors[category];

                // Find all connected tiles of the same category using flood-fill
                const connectedTiles = this.findConnectedTilesOfCategory(tile, category);

                // Store the tinted tiles for cleanup later
                this.tintedCluster = connectedTiles;

                // Apply tint with spiral animation FROM the hovered tile
                this.applyTintInSpiral(connectedTiles, tile, tintColor);

                console.log(`✨ Tile ${index} (${landUse}) - ${category} cluster tint applied to ${connectedTiles.length} connected tiles`);
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
     * Handle base tile out - removes category-based tint from cluster
     */
    handleBaseTileOut(tile) {
        // Only clear base tinting if no active tool/mode is selected
        if (this.shouldApplyBaseTint()) {
            if (this.hoveredTile === tile) {
                // Cancel any ongoing animation timeouts
                this.clearAnimationTimeouts();

                // Clear tint from all tiles in the cluster
                if (this.tintedCluster && this.tintedCluster.length > 0) {
                    this.tintedCluster.forEach(clusterTile => {
                        if (clusterTile && typeof clusterTile.clearTint === 'function') {
                            clusterTile.clearTint();
                        }
                    });
                }

                // Reset tracking variables
                this.hoveredTile = null;
                this.hoveredCategory = null;
                this.tintedCluster = [];
            }
        }
    }

    /**
     * Handle base tile click - auto-place trees on green-tinted tiles
     * ONLY works on tiles that are currently showing green tint (hover + click)
     */
    handleBaseTileClick(tile, index, pointer) {
        // Only auto-place if no active tool/mode is selected
        if (this.shouldApplyBaseTint()) {
            // Check if this tile is part of the currently tinted cluster
            const isTinted = this.tintedCluster && this.tintedCluster.includes(tile);

            // Check if the tinted cluster is greenery (green tint)
            const isGreenTinted = this.hoveredCategory === 'greenery';

            // ONLY place trees if the tile is currently showing green tint
            if (isTinted && isGreenTinted) {
                console.log(`🌳 Auto-placing trees on green-tinted tile ${index}`);

                // Activate trees mode temporarily
                this.scene.gameState.resetAllModes();
                this.scene.gameState.trees = true;
                this.scene.gameState.smallTile = true;
                this.scene.gameState.placeTile = true;
                this.scene.gameState.newTile = 'tree_b';

                // Let the TileInteractionManager handle the actual placement
                // by triggering its pointerdown handler
                // (this will automatically validate and place the tree)

                // After placement, reset back to initial interaction state (no tint)
                // Use setTimeout to let the placement complete first
                setTimeout(() => {
                    this.scene.gameState.resetAllModes();
                    // Clear any tints to return to initial state
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
                }, 50);
            }
        }
    }

    /**
     * Determine if base tinting should be applied
     * Returns true only when no tool/mode is active
     */
    shouldApplyBaseTint() {
        const gameState = this.scene.gameState;

        // Check if any mode or tool is active
        const hasActiveMode = gameState.infoBool ||
                             gameState.moveBool ||
                             gameState.rotateBool ||
                             gameState.zoomBool ||
                             gameState.homeBool ||
                             gameState.destroy ||
                             gameState.wind ||
                             gameState.solar ||
                             gameState.trees ||
                             gameState.mediumTile ||
                             gameState.largeTile;

        return !hasActiveMode;
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
    }
}
