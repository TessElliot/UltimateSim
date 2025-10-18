// overpass.js – ESM version with retry logic and timeout protection

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (response.ok) {
                return response;
            }

            // If 504, 429, or 503, wait and retry
            if ([504, 429, 503].includes(response.status)) {
                const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                console.log(`Overpass ${response.status}, retry ${i + 1}/${maxRetries} after ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }

            throw new Error(`HTTP ${response.status}`);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`Request timeout, retry ${i + 1}/${maxRetries}...`);
            } else {
                console.log(`Request error: ${error.message}, retry ${i + 1}/${maxRetries}...`);
            }

            if (i === maxRetries - 1) {
                throw error; // Final retry failed
            }

            const waitTime = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

/**
 * Fetch land‑use stats for a bounding box and return:
 *   [maxAreaType, prioritizedType, hasPowerPlant, hasHighway, landUses, serializedLandUseInfo]
 */
export async function fetchLandUseInBoundingBox(
    minLat,
    minLon,
    maxLat,
    maxLon,
    box
) {
    // Keep ALL queries as you requested
    const query = `
   [out:json][timeout:25];
   (
     way["power"](${minLat},${minLon},${maxLat},${maxLon});
     way["building"](${minLat},${minLon},${maxLat},${maxLon});
     way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
     way["leisure"](${minLat},${minLon},${maxLat},${maxLon});
     way["natural"](${minLat},${minLon},${maxLat},${maxLon});
     way["place"](${minLat},${minLon},${maxLat},${maxLon});
     way["highway"](${minLat},${minLon},${maxLat},${maxLon});
     node["natural"](${minLat},${minLon},${maxLat},${maxLon});
   );
   out body geom;
   >;
   out skel qt;`;

    // Try multiple Overpass servers for better reliability
    const servers = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.ru/cgi/interpreter"
    ];

    let lastError;

    // Try each server once before giving up
    for (const url of servers) {
        try {
            const response = await fetchWithRetry(url, {
                method: "POST",
                body: `data=${encodeURIComponent(query)}`,
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }, 2); // 2 retries per server

            const data = await response.json();

            const landUses = {};
            const tileKey = `${box.minLat.toFixed(6)}_${box.minLon.toFixed(6)}`;

            let prioritizedType = null;
            let hasPowerPlant = false;
            let powerPlantType = null;
            let hasHighway = false;

            // ---- Parse elements ----
            data.elements?.forEach((el) => {
                const tags = el.tags || {};
                let type =
                    tags.building && tags.building !== "yes"
                        ? tags.building
                        : tags.landuse && tags.landuse !== "yes"
                            ? tags.landuse
                            : tags.leisure && tags.leisure !== "yes"
                                ? tags.leisure
                                : tags.natural && tags.natural !== "yes"
                                    ? tags.natural
                                    : tags.place && tags.place !== "yes"
                                        ? tags.place
                                        : null;

                if (["motorway", "trunk"].includes(tags.highway)) {
                    hasHighway = true;
                    prioritizedType = "national_highway";
                }
                if (tags.power === "plant") {
                    hasPowerPlant = true;
                    powerPlantType = tags["plant:source"] || "unknown";
                    prioritizedType = `power:plant (${powerPlantType})`;
                }

                if (type && el.geometry?.length > 3) {
                    const coords = el.geometry.map((p) => [p.lon, p.lat]);
                    // Ensure polygon closed
                    if (
                        coords[0][0] === coords.at(-1)[0] &&
                        coords[0][1] === coords.at(-1)[1]
                    ) {
                        try {
                            const polygon = turf.polygon([coords]);
                            const area = turf.area(polygon);
                            landUses[type] = (landUses[type] || 0) + area;
                        } catch (turfError) {
                            // Skip invalid polygons silently
                            console.warn(`Invalid polygon for type ${type}`);
                        }
                    }
                }
            });

            // ---- Decide maxAreaType ----
            let maxAreaType = Object.entries(landUses).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
            if (maxAreaType === "yes") maxAreaType = null;
            if (hasHighway) maxAreaType = "national_highway";
            if (hasPowerPlant) maxAreaType = `power:plant (${powerPlantType})`;

            // ---- Serialize ----
            const tileData = {
                lat: box.minLat,
                lon: box.minLon,
                tags: {},
                landUses,
                maxAreaType,
            };

            const serializedLandUseInfo = JSON.stringify({ [tileKey]: tileData });

            return [
                maxAreaType,
                prioritizedType || null,
                hasPowerPlant,
                hasHighway,
                landUses,
                serializedLandUseInfo,
            ];

        } catch (err) {
            console.warn(`Overpass server ${url} failed:`, err?.message || err);
            lastError = err;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before trying next server
            continue;
        }
    }

    // All servers failed
    console.error("All Overpass servers failed:", lastError);
    return [null, null, false, false, {}, "{}"];
}