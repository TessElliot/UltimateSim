export const landUseTypesDict = {};
import { fetchLandUseInBoundingBox } from './overpass.js';
// //import { titleSceneInstance } from "./scenes/TitleScene.js";
import { getLocation } from "./location.js"; // Adjust path as necessary
// const landUseMap = new Map(); // Key: Tile ID or Coordinates, Value: landUses data
export const landUseInfo = new Map();
const API_KEY = "349b2ad7a8cbe62ab39fc0097c80adea"; // Replace with your actual API key
// const backendBaseUrl = "https://ultimatesim-backend.onrender.com";
const backendBaseUrl = "http://localhost:8800";
export async function fetchWeatherAlerts(lat, lon) {
  const url = `https://api.weather.gov/alerts/active?point=${lat},${lon}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter for significant events
    const significantEvents = data.features.filter((alert) => {
      const event = alert.properties.event.toLowerCase();
      return (
        event.includes("flood") ||
        event.includes("tornado") ||
        event.includes("storm") ||
        event.includes("rain") ||
        event.includes("wind") ||
        event.includes("watch") ||
        event.includes("warning")
      );
    });

    if (significantEvents.length > 0) {
      console.log(" Significant Weather Alerts:");
      significantEvents.forEach((alert) => {
        console.log(`${alert.properties.event}: ${alert.properties.headline}`);
      });
    } else {
      console.log("No significant weather alerts at this location.");
    }

    return significantEvents;
  } catch (error) {
    console.error("Error fetching weather alerts:", error.message);
    return [];
  }
}

export async function fetchLatLon() {
  const { lat, lon } = getLocation();

  console.log("fetchLatLon called. Latitude:", lat, "Longitude:", lon); // Debug log

  if (lat && lon) {
    console.log(
      `Using provided coordinates: Latitude - ${lat}, Longitude - ${lon}`
    );

    // Directly return the latitude and longitude as an object
    return {
      minLat: lat,
      minLon: lon,
    };
  } else {
    console.log("Latitude and longitude are not set.");
    return null;
  }
}

export async function fetchLocation() {
  return new Promise((resolve, reject) => {
    function success(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log("here is the player's fetched location");
      console.log(`Latitude: ${latitude} °, Longitude: ${longitude} °`);
      const minLat = `${latitude}`;
      const minLon = `${longitude}`;

      // Resolve the promise with the coordinates
      resolve({ minLat, minLon });
    }

    function error() {
      console.log(
        "Not able to fetch your location. Please check browser settings"
      );
      reject(new Error("Unable to fetch location"));
    }

    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser");
      reject(new Error("Geolocation is not supported"));
    } else {
      console.log("Locating...");
      navigator.geolocation.getCurrentPosition(success, error);
    }
  });
}

// // Display JSON data on the webpage
// function displayJSON(data) {
//   const jsonDataViewer = document.getElementById("jsonDataViewer");
//   if (data && Object.keys(data).length > 0) {
//     jsonDataViewer.textContent = JSON.stringify(data, null, 2);
//   } else {
//     jsonDataViewer.textContent = "No data available.";
//   }
// }

function generateSpiralBoundingBoxes(
  minLat,
  minLon,
  maxLat,
  maxLon,
  countX,
  countY
) {
  console.log(maxLat);
  countY = countX;
  console.log(countX, countY);
  const latDiff = maxLat - minLat;
  const lonDiff = maxLon - minLon;
  const boundingBoxes = [];

  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  let dirIndex = 0;
  let steps = 1;
  let stepsTaken = 0;
  let x = Math.floor(countX / 2);
  let y = Math.floor(countY / 2);

  for (let i = 0; i < countX * countY; i++) {
    const newMinLat = minLat + (y - Math.floor(countY / 2)) * latDiff;
    const newMinLon = minLon + (x - Math.floor(countX / 2)) * lonDiff;
    const newMaxLat = newMinLat + latDiff;
      const newMaxLon = newMinLon + lonDiff;
      console.log('Type of newMinLat:', typeof newMinLat);
    const id = `${newMinLat.toFixed(6)}_${newMinLon.toFixed(
      6
    )}_${newMaxLat.toFixed(6)}_${newMaxLon.toFixed(6)}`;

    boundingBoxes.push({
      id,
      minLat: parseFloat(newMinLat.toFixed(6)),
      minLon: parseFloat(newMinLon.toFixed(6)),
      maxLat: parseFloat(newMaxLat.toFixed(6)),
      maxLon: parseFloat(newMaxLon.toFixed(6)),
      x: x, // Store grid coordinates for spiral layout
      y: y,
      order: i + 1,
    });

    const [dx, dy] = directions[dirIndex];
    x += dx;
    y += dy;
    stepsTaken++;

    if (stepsTaken === steps) {
      dirIndex = (dirIndex + 1) % 4;
      stepsTaken = 0;
      if (dirIndex % 2 === 0) {
        steps++;
      }
    }
  }
  console.log(boundingBoxes);

  return boundingBoxes;
}

const url = "";

async function fetchLocationUsingApi(lat, lon) {
    try {
        const response = await fetch(
            `${backendBaseUrl}/closestBbox?lat=${lat}&lon=${lon}`
        );

        if (!response.ok) {
            return null;
        }

        const boundingBoxData = await response.json();

        if (!boundingBoxData || boundingBoxData.length === 0) {
            return null;
        }

        const closestBbox = boundingBoxData[0];

        // Calculate distance to verify it's actually close
        const distance = Math.sqrt(
            Math.pow(closestBbox.minLat - lat, 2) +
            Math.pow(closestBbox.minLon - lon, 2)
        );

        // If too far away (> 0.01 degrees ~1km), return null
        if (distance > 0.01) {
            console.log(`Closest tile too far: ${distance.toFixed(4)} degrees`);
            return null;
        }

        return {
            minLat: closestBbox.minLat,
            maxLat: closestBbox.maxLat,
            minLon: closestBbox.minLon,
            maxLon: closestBbox.maxLon,
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function loadtheMap(boundingBoxes) {
  const url = `${backendBaseUrl}/initialBox`;

  try {
    const response = await fetch(url, {
      method: "POST", // Use POST to send data
      headers: {
        "Content-Type": "application/json", // Indicate that we're sending JSON data
      },
      body: JSON.stringify(boundingBoxes), // Convert the array to a JSON string
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // Assuming the server returns JSON
    console.log("Response from server:", data);
    return data; // Return the server response
  } catch (error) {
    console.error("Error:", error);
    return null; // If error occurs, return null or handle it as needed
  }
}

export async function* processBoundingBoxes(initialBox, countX, countY) {
    try {
        const lat = initialBox.minLat;
        const lon = initialBox.minLon;
        console.log("Starting location:", lat, lon);

        // Step 1: Try to find closest pre-computed tile in database
        let FinitialBox = null;
        let useOverpass = false;

        try {
            FinitialBox = await fetchLocationUsingApi(lat, lon);
            if (FinitialBox) {
                console.log("✅ Found database match:", FinitialBox.minLat, FinitialBox.minLon);
            } else {
                console.log("❌ No database match - location not pre-computed");
                useOverpass = true;
            }
        } catch (error) {
            console.warn("Database lookup failed:", error);
            useOverpass = true;
        }

        // 🆕 If no database match, manually align to grid
        if (!FinitialBox) {
            const boxSize = 0.0026;

            // Snap to grid using same logic as dataFetch.js
            // Round to nearest grid point
            const gridLat = Math.round(lat / boxSize) * boxSize;
            const gridLon = Math.round(lon / boxSize) * boxSize;

            FinitialBox = {
                minLat: parseFloat(gridLat.toFixed(6)),
                minLon: parseFloat(gridLon.toFixed(6)),
                maxLat: parseFloat((gridLat + boxSize).toFixed(6)),
                maxLon: parseFloat((gridLon + boxSize).toFixed(6))
            };

            console.log("📍 Aligned to grid:", FinitialBox.minLat, FinitialBox.minLon);
        }

        // Generate bounding boxes (now always has FinitialBox)
        const boundingBoxes = generateSpiralBoundingBoxes(
            FinitialBox.minLat,
            FinitialBox.minLon,
            FinitialBox.maxLat,
            FinitialBox.maxLon,
            countX,
            countY
        );

        console.log(`Generated ${boundingBoxes.length} bounding boxes`);

        // Step 2: Try to load from database ONLY if we found a database match
        let data = null;

        if (!useOverpass) {
            try {
                data = await loadtheMap(boundingBoxes);

                if (!data || data.length === 0) {
                    console.warn("Database returned no data - falling back to Overpass");
                    useOverpass = true;
                } else {
                    console.log(`✅ Loaded ${data.length} tiles from database`);
                }
            } catch (error) {
                console.error("Database load failed:", error);
                console.log("Falling back to Overpass API");
                useOverpass = true;
            }
        } else {
            console.log("🌍 Using Overpass API for this location");
        }

        // Yield metadata
        yield {
            mode: useOverpass ? 'overpass' : 'database',
            totalTiles: boundingBoxes.length,
            useOverpass: useOverpass
        };

        // Step 3: Process tiles
        let processedCount = 0;
        for (const box of boundingBoxes) {
            let tileType, landUseData;

            if (useOverpass) {
                if (processedCount % 10 === 0) {
                    console.log(`🌐 Fetching from Overpass: ${processedCount}/${boundingBoxes.length}`);
                }

                try {
                    const [
                        maxAreaType,
                        prioritizedType,
                        hasPowerPlant,
                        hasHighway,
                        landUses,
                        serializedData,
                    ] = await fetchLandUseInBoundingBox(
                        box.minLat,
                        box.minLon,
                        box.maxLat,
                        box.maxLon,
                        box
                    );

                    if (hasHighway) {
                        tileType = "road";
                    } else if (maxAreaType) {
                        tileType = maxAreaType;
                    } else {
                        tileType = "no data";
                    }

                    landUseData = JSON.parse(serializedData);

                } catch (error) {
                    console.error(`Overpass error for ${box.id}:`, error);
                    tileType = "no data";
                    landUseData = {};
                }

                // Rate limit: 1 request per second
                await new Promise((resolve) => setTimeout(resolve, 3000));

            } else {
                // Use pre-loaded database data
                const matchingBox = data.find((item) => item.id === box.id);

                if (matchingBox) {
                    tileType = matchingBox.landuseType;
                    landUseData = matchingBox.landUseData;
                } else {
                    console.warn(`No matching data for box: ${box.id}`);
                    tileType = "no data";
                    landUseData = {};
                }
            }

            const tileKey = Object.keys(landUseData)[0];
            if (tileKey && landUseData[tileKey]) {
                landUseInfo.set(tileKey, landUseData[tileKey]);
            }

            // 🔍 LOG EVERY TILE THAT STREAMS IN
            console.log(`🌍 Streaming tile ${processedCount + 1}: type="${tileType}", box.id="${box.id}", coords=(${box.x},${box.y})`);

            yield { tileType, box };

            processedCount++;

            if (!useOverpass) {
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }

        console.log(`✅ Finished processing ${processedCount} tiles`);

    } catch (error) {
        console.error("❌ Error in processBoundingBoxes:", error);
    }
}
