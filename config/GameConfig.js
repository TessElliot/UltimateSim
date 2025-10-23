// GameConfig.js - Centralized game configuration and constants

export const GameConfig = {
    // Backend Configuration
    backendBaseUrl: "http://localhost:8800",

    // Sprite and Tile Dimensions
    spriteWidth: 32,
    spriteHeight: 16, // spriteWidth / 2
    factor: 4,

    // Calculated tile dimensions
    get tileWidth() {
        return this.spriteWidth / this.factor; // 8
    },
    get tileHeight() {
        return this.spriteHeight / this.factor; // 4
    },
    get setScale() {
        return 1 / this.factor; // 0.25
    },

    // Map Configuration
    boxSize: 0.0026,
    mapTilesWidth: 30,
    get mapTilesHeight() {
        return this.mapTilesWidth; // Keep square grid
    },

    // Grid Sizes
    get initialGridSize() {
        return this.mapTilesWidth;
    },
    expandedGridSize: 11,

    // Map Offset
    mapOffset: -0.08,

    // Default Camera/Viewport (matches main.js Phaser config)
    defaultWidth: 1000,
    defaultHeight: 600,

    // Undo/Redo History Depth
    maxHistoryDepth: 5,
};

// Export individual constants for backward compatibility if needed
export const {
    backendBaseUrl,
    spriteWidth,
    spriteHeight,
    factor,
    boxSize,
    mapTilesWidth,
    mapTilesHeight,
    mapOffset,
} = GameConfig;
