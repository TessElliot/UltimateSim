// utils/GameState.js
// Centralized state management for game modes and tile operations

export class GameState {
    constructor() {
        // Tool modes
        this.moveBool = false;
        this.zoomBool = false;
        this.rotateBool = false;
        this.infoBool = false;
        this.homeBool = false;
        this.destroy = false;

        // Tile sizes
        this.smallTile = false;
        this.mediumTile = false;
        this.largeTile = false;
        this.xLargeTile = false;

        // Build modes
        this.road = false;
        this.bike = false;
        this.trees = false;
        this.wind = false;
        this.solar = false;

        // Upgrade modes
        this.upgrade = null;  // e.g., 'solar' for upgrading tiles
        this.clusterUpgrade = null;  // For cluster upgrade mode

        // Tile placement state
        this.placeTile = false;
        this.newTile = null;
        this.frameNumber = 0;

        // Loading and interaction states
        this.isDraggingSprite = false;
        this.zoomNow = false;
        this.isLoading = true;
    }

    /**
     * Reset all tool modes to false
     */
    resetAllModes() {
        this.moveBool = false;
        this.zoomBool = false;
        this.rotateBool = false;
        this.infoBool = false;
        this.homeBool = false;
        this.destroy = false;
        this.smallTile = false;
        this.mediumTile = false;
        this.largeTile = false;
        this.xLargeTile = false;
        this.road = false;
        this.bike = false;
        this.trees = false;
        this.wind = false;
        this.solar = false;
        this.upgrade = null;
        this.clusterUpgrade = null;
        this.placeTile = false;
        this.newTile = null;
        this.frameNumber = 0;
    }

    /**
     * Set a specific tool/build mode
     * @param {Object} config - Configuration object for the tool
     * @example
     * gameState.setTool({
     *   smallTile: true,
     *   newTile: "wind",
     *   wind: true
     * })
     */
    setTool(config) {
        console.log('⚙️ setTool called with config:', config);
        console.log('⚙️ Before resetAllModes - destroy:', this.destroy, 'newTile:', this.newTile);
        this.resetAllModes();
        console.log('⚙️ After resetAllModes - destroy:', this.destroy, 'newTile:', this.newTile);
        Object.assign(this, config);
        console.log('⚙️ After Object.assign - destroy:', this.destroy, 'newTile:', this.newTile, 'solar:', this.solar, 'wind:', this.wind, 'trees:', this.trees);
    }

    /**
     * Check if any build mode is active
     */
    isBuildModeActive() {
        return this.road || this.bike || this.trees ||
            this.wind || this.solar || this.destroy;
    }

    /**
     * Check if any navigation mode is active
     */
    isNavigationModeActive() {
        return this.moveBool || this.zoomBool ||
            this.rotateBool || this.homeBool;
    }

    /**
     * Get current active mode name
     */
    getActiveMode() {
        if (this.moveBool) return 'move';
        if (this.zoomBool) return 'zoom';
        if (this.rotateBool) return 'rotate';
        if (this.infoBool) return 'info';
        if (this.homeBool) return 'home';
        if (this.destroy) return 'destroy';
        if (this.wind) return 'wind';
        if (this.solar) return 'solar';
        if (this.trees) return 'trees';
        if (this.road) return 'road';
        if (this.bike) return 'bike';
        return 'none';
    }

    /**
     * Get info text for current mode
     */
    getInfoText() {
        const mode = this.getActiveMode();

        // Special case for zoom - include current zoom level
        if (mode === 'zoom' && this.scene) {
            const currentZoom = this.scene.cameras?.main?.zoom || 1;
            return `Zoom Map (SPACE) - ${currentZoom}x`;
        }
        const infoTexts = {
            move: 'Move Map (SHIFT)',
            zoom: 'Zoom Map (SPACE)',
            rotate: 'Rotate Map (R)',
            info: 'Get Map Info',
            home: 'Center Map (F)',
            destroy: 'Bulldoze -1',
            wind: 'Build Wind Power +8',
            solar: 'Build Solar Power +6',
            trees: 'Plant Trees +5',
            road: 'Build Road',
            bike: 'Build Bike Lane'
        };

        // if (this.mediumTile && !this.largeTile) {
        //     return 'Build Green Apartments +3';
        // }
        // if (this.largeTile) {
        //     return 'Build Hydrogen Power +10';
        // }

        return infoTexts[mode] || '';
    }
}