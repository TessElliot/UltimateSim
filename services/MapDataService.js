// MapDataService.js
// Handles all map data operations: database, localStorage, and data management

const backendBaseUrl = "http://localhost:8800";

export class MapDataService {
    constructor() {
        this.lastFetchedMap = null;
    }

    // =====================================================
    // DATABASE OPERATIONS (Crowd-Sourced Maps)
    // =====================================================

    /**
     * Check if a map exists in the crowd-sourced database
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object|null>} Map data if found, null otherwise
     */
    async checkDatabaseForMap(lat, lon) {
        try {
            console.log(`🔍 Checking crowd-sourced database for map at: ${lat}, ${lon}`);

            const response = await fetch(
                `${backendBaseUrl}/checkMap?lat=${lat}&lon=${lon}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.exists) {
                console.log(`✅ Map found in database! (Created: ${data.mapData.createdAt})`);
                return data.mapData;
            } else {
                console.log(`❌ No map found in database for this location`);
                return null;
            }
        } catch (error) {
            console.warn("Database check failed:", error.message);
            return null; // Graceful degradation - continue without database
        }
    }

    /**
     * Save a newly fetched map to the crowd-sourced database
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {Object} mapData - Map data to save
     * @returns {Promise<boolean>} Success status
     */
    async saveMapToDatabase(lat, lon, mapData) {
        try {
            console.log(`💾 Saving map to database for: ${lat}, ${lon}`);

            const response = await fetch(`${backendBaseUrl}/saveMap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat,
                    lon,
                    gridWidth: mapData.gridWidth,
                    gridHeight: mapData.gridHeight,
                    tiles: mapData.tiles,
                    landUseInfo: mapData.landUseInfo
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log(`✅ Map saved to database (ID: ${result.mapId})`);
                console.log(`🎁 Future players at this location will load instantly!`);
                return true;
            }

            return false;
        } catch (error) {
            console.warn("Failed to save map to database:", error.message);
            return false; // Non-critical - game continues without database save
        }
    }

    // =====================================================
    // LOCALSTORAGE OPERATIONS
    // =====================================================

    /**
     * Save map to localStorage (for current player's resume/save)
     * @param {Object} mapData - Map data to save
     * @param {Array} tileChanges - Player's modifications
     */
    saveMapToLocalStorage(mapData, tileChanges = []) {
        try {
            const dataToSave = {
                tiles: mapData.tiles,
                gridWidth: mapData.gridWidth,
                gridHeight: mapData.gridHeight,
                tileChanges: tileChanges,
                landUseInfo: mapData.landUseInfo
            };

            localStorage.setItem("savedMap", JSON.stringify(dataToSave));
            console.log("💾 Saved map to localStorage");
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
        }
    }

    /**
     * Save original map to localStorage (pristine OSM data)
     * Only saves if originalMap doesn't already exist
     * @param {Object} mapData - Original map data
     */
    saveOriginalMapToLocalStorage(mapData) {
        try {
            if (!localStorage.getItem("originalMap")) {
                const dataToSave = {
                    tiles: mapData.tiles,
                    gridWidth: mapData.gridWidth,
                    gridHeight: mapData.gridHeight,
                    tileChanges: [],
                    landUseInfo: mapData.landUseInfo
                };

                localStorage.setItem("originalMap", JSON.stringify(dataToSave));
                console.log("💾 Saved original map to localStorage");
            }
        } catch (error) {
            console.error("Failed to save original map to localStorage:", error);
        }
    }

    /**
     * Load map from localStorage
     * @returns {Object|null} Saved map data or null if not found
     */
    loadMapFromLocalStorage() {
        try {
            const savedMapString = localStorage.getItem("savedMap");
            if (savedMapString) {
                const mapData = JSON.parse(savedMapString);
                console.log("📂 Loaded map from localStorage");
                return mapData;
            }
            return null;
        } catch (error) {
            console.error("Failed to load from localStorage:", error);
            return null;
        }
    }

    /**
     * Load original map from localStorage
     * @returns {Object|null} Original map data or null if not found
     */
    loadOriginalMapFromLocalStorage() {
        try {
            const originalMapString = localStorage.getItem("originalMap");
            if (originalMapString) {
                const mapData = JSON.parse(originalMapString);
                console.log("📂 Loaded original map from localStorage");
                return mapData;
            }
            return null;
        } catch (error) {
            console.error("Failed to load original map from localStorage:", error);
            return null;
        }
    }

    /**
     * Clear all localStorage map data
     */
    clearLocalStorage() {
        localStorage.removeItem("savedMap");
        localStorage.removeItem("originalMap");
        console.log("🗑️ Cleared localStorage map data");
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Get map data size in KB
     * @param {Object} mapData - Map data to measure
     * @returns {number} Size in KB
     */
    getMapSizeKB(mapData) {
        const jsonString = JSON.stringify(mapData);
        return (jsonString.length / 1024).toFixed(2);
    }

    /**
     * Validate map data structure
     * @param {Object} mapData - Map data to validate
     * @returns {boolean} True if valid
     */
    isValidMapData(mapData) {
        return (
            mapData &&
            Array.isArray(mapData.tiles) &&
            mapData.tiles.length > 0 &&
            typeof mapData.gridWidth === 'number' &&
            typeof mapData.gridHeight === 'number' &&
            mapData.landUseInfo !== undefined
        );
    }
}
