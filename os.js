
let cityBoundaryData; // Variable to store the boundary data


async function fetchCityData() {
    const cityName = document.getElementById('cityInput').value;
    console.log("Fetching data for:", cityName);
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURI(cityName)}&format=json`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("Coordinates data:", data);
        if (data.length > 0) {
            // const cityCenter = await calculateCityCenter(cityName); // Calculate city center
            // console.log("City center coordinates:", cityCenter);
            fetchCityShape(data[0].lat, data[0].lon);
            fetchRestaurantDetails(data[0].lat, data[0].lon);
        } else {
            alert("City not found");
        }
    } catch (error) {
        console.error('Error fetching city data:', error);
    }
}



////funciton fetching the location of the  user
export async function fetchLocation() {
    
    return new Promise((resolve, reject) => {
        function success(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            console.log(`Latitude: ${latitude} °, Longitude: ${longitude} °`);
            const minLat = `${latitude}`;
            const minLon = `${longitude}`;

            // Resolve the promise with the coordinates
            resolve({ minLat, minLon });
        }

        function error() {
            console.log("Not able to fetch your location. Please check browser settings");
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

// Fetch city shape data from Overpass API
async function fetchCityShape(lat, lon) {
    console.log("Fetching shape for coordinates:", lat, lon);
    const query = `[out:json][timeout:25];relation(185049);(._;>;);out body;`;
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    const data = await response.json();
    console.log("Shape data:", data);
    cityBoundaryData = data; // Store the boundary data in the variable
    displayJSON(data);
    const elementsWithoutTags = filterElementsWithoutTags(data);
    displayMap(elementsWithoutTags);
  

    // we can proceed with the cartesianCoords for further use, such as in a Phaser game
}

// Filter elements without tags
function filterElementsWithoutTags(data) {
    if (data && data.elements) {
        const elementsWithoutTags = data.elements.filter(element => !element.tags || Object.keys(element.tags).length === 0);
        console.log("Filtered elements without tags:", elementsWithoutTags);
        return elementsWithoutTags;
    } else {
        console.error("No data or elements array found");
        return [];
    }
}

// Display JSON data on the webpage
function displayJSON(data) {
    const jsonDataViewer = document.getElementById('jsonDataViewer');
    if (data && Object.keys(data).length > 0) {
        jsonDataViewer.textContent = JSON.stringify(data, null, 2);
    } else {
        jsonDataViewer.textContent = "No data available.";
    }
}

// Display map with fetched data
function displayMap(elementsWithoutTags) {
    if (elementsWithoutTags.length === 0 || !elementsWithoutTags[0].lat || !elementsWithoutTags[0].lon) {
        console.error("No valid elements to display on the map.");
        return;
    }

    const map = L.map('map').setView([elementsWithoutTags[0].lat, elementsWithoutTags[0].lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    elementsWithoutTags.forEach(element => {
        if (element.lat && element.lon) {
            L.circleMarker([element.lat, element.lon], {
                color: '#8B0000',
                fillColor: '#8B0000',
                fillOpacity: 0.7,
                radius: 5
            }).addTo(map).bindPopup('No tags available for this location');
        }
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
async function fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon, apiKey) {
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiKey}`;

    // Calculate center of the bounding box and the radius
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const radius = calculateRadius(minLat, minLon, maxLat, maxLon);

    try {
        console.log('Sending request to Google Maps API...');
        const response = await fetch(`${corsProxy}${url}&location=${centerLat},${centerLon}&radius=${radius}&type=establishment`);
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response received:', data);

        if (data.results.length === 0) {
            console.log('No amenities found in the specified area.');
            return [];
        } else {
            // Extract amenity type, name, latitude, and longitude
            const amenities = [];

            data.results.forEach(element => {
                const lat = element.geometry.location.lat;
                const lon = element.geometry.location.lng;
                amenities.push({
                    type: element.types[0],
                    name: element.name,
                    lat: lat,
                    lon: lon
                });
            });

            console.log('Amenities:', amenities);
            return amenities;
        }
    } catch (error) {
        console.error('Error fetching amenities:', error);
        return [];
    }
}

// Calculate radius for the bounding box
function calculateRadius(minLat, minLon, maxLat, maxLon) {
    const R = 6371; // Earth's radius in km
    const dLat = (maxLat - minLat) * Math.PI / 180;
    const dLon = (maxLon - minLon) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(minLat * Math.PI / 180) * Math.cos(maxLat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance * 1000 / 2; // Convert to meters and divide by 2 for radius
}

// New function to find the most frequent types
function findMostFrequentTypes(amenities) {
    const typeCount = {};
    let maxCount = 0;

    amenities.forEach(amenity => {
        const type = amenity.type;
        typeCount[type] = (typeCount[type] || 0) + 1;
        if (typeCount[type] > maxCount) {
            maxCount = typeCount[type];
        }
    });

    const mostFrequentTypes = [];
    for (const type in typeCount) {
        if (typeCount[type] === maxCount) {
            mostFrequentTypes.push(type);
        }
    }

    return mostFrequentTypes;
}



////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

function generateBoundingBoxes(minLat, minLon, maxLat, maxLon, countX, countY) {
    const latDiff = (maxLat - minLat);
    const lonDiff = (maxLon - minLon);
    const boundingBoxes = [];

    // Calculate the center position index
    const centerX = Math.floor(countX / 2);
    const centerY = Math.floor(countY / 2);

    for (let i = 0; i < countY; i++) {
        for (let j = 0; j < countX; j++) {
            const newMinLat = minLat + (i - centerY) * latDiff;
            const newMinLon = minLon + (j - centerX) * lonDiff;
            const newMaxLat = newMinLat + latDiff;
            const newMaxLon = newMinLon + lonDiff;

            // Slightly overlap bounding boxes
            boundingBoxes.push({
                minLat: newMinLat, 
                minLon: newMinLon, 
                maxLat: newMaxLat, 
                maxLon: newMaxLon  
            });
        }
    }
    console.log(boundingBoxes);
    return boundingBoxes;    
}

// Function to fetch land use data within a bounding box
export async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
    const query = `
    [out:json];
    (
      way["power"](${minLat},${minLon},${maxLat},${maxLon});
      way["building"](${minLat},${minLon},${maxLat},${maxLon});
      way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
      way["leisure"](${minLat},${minLon},${maxLat},${maxLon});
      way["natural"](${minLat},${minLon},${maxLat},${maxLon});
      way["place"](${minLat},${minLon},${maxLat},${maxLon});
    );
    out body geom;
    >;
    out skel qt;
    `;

    const url = 'https://overpass-api.de/api/interpreter';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const landUses = {};
        const invalidPolygons = [];
        let prioritizedType = null;
        let hasPowerPlant = false;
        let buildingLevels = [];

        if (data.elements) {
            data.elements.forEach(element => {
                const type = element.tags && (element.tags.power || element.tags.building || element.tags.landuse || element.tags.leisure || element.tags.natural || element.tags.place);

                if (element.tags && element.tags.power === 'plant') {
                    hasPowerPlant = true;
                    prioritizedType = 'power:plant';
                }

                if (element.tags && element.tags.building) {
                    const buildingType = element.tags.building;

                    if (buildingType.toLowerCase() === "yes") {
                        return;
                    }

                    let levels = null;
                    if (element.tags['building:levels']) {
                        levels = parseInt(element.tags['building:levels'], 10);
                    }
                    buildingLevels.push({
                        id: element.id,
                        levels: levels,
                        type: buildingType
                    });

                    if (!prioritizedType) {
                        prioritizedType = 'building';
                    }
                }

                if (type && element.geometry && element.geometry.length > 0) {
                    const coordinates = element.geometry.map(point => [point.lon, point.lat]);

                    if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
                        coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

                        const polygon = turf.polygon([coordinates]);
                        const area = turf.area(polygon);

                        if (!landUses[type]) {
                            landUses[type] = 0;
                        }
                        landUses[type] += area;
                    } else {
                        invalidPolygons.push({
                            type: type,
                            geometry: coordinates
                        });
                    }
                }
            });
        }

        let maxAreaType = null;
        let maxArea = 0;

        Object.keys(landUses).forEach(type => {
            if (landUses[type] > maxArea) {
                maxArea = landUses[type];
                maxAreaType = type;
            }
        });

        if (hasPowerPlant) {
            maxAreaType = 'power:plant';
        }

        return [maxAreaType, prioritizedType || null, hasPowerPlant, buildingLevels];
    } catch (error) {
        console.error('Error fetching land use data:', error);
        return [null, null, false, []];
    }
}

// Function to fetch land use data for multiple bounding boxes in parallel
export async function fetchLandUseForAllBoundingBoxes(boundingBoxes) {
    const promises = boundingBoxes.map(box =>
        fetchLandUseInBoundingBox(box.minLat, box.minLon, box.maxLat, box.maxLon)
    );

    try {
        const results = await Promise.all(promises);
        //console.log('All bounding boxes fetched:', results);
        return results;
    } catch (error) {
        //console.error('Error fetching land use data for all bounding boxes:', error);
        return [];
    }
}



export async function processBoundingBoxes(initialBox, countX, countY) {

    const { minLat, minLon, maxLat, maxLon } = initialBox;
    console.log(countX,countY);
    const boundingBoxes = generateBoundingBoxes(minLat, minLon, maxLat, maxLon, countX, countY);
    const results = new Array(countX * countY).fill(null); // Initialize with nulls
    let index = 0;

    console.log(`Processing ${boundingBoxes.length} bounding boxes...`);

    for (const box of boundingBoxes) {
        try {
            const [maxAreaType, prioritizedType, hasPowerPlant, buildingLevels] = await fetchLandUseInBoundingBox(box.minLat, box.minLon, box.maxLat, box.maxLon);
            
            if (maxAreaType) {
                results[index] = maxAreaType;
                console.log(`Bounding box (${box.minLat}, ${box.minLon}, ${box.maxLat}, ${box.maxLon}) added type: ${maxAreaType}`);
            } else {
                console.log(`Bounding box (${box.minLat}, ${box.minLon}, ${box.maxLat}, ${box.maxLon}) returned no valid type. Adding 'no data' at index ${index}.`);
                results[index] = 'no data';
            }
        } catch (error) {
            console.error(`Error fetching data for bounding box (${box.minLat}, ${box.minLon}, ${box.maxLat}, ${box.maxLon}):`, error);
            results[index] = 'error';
        }
        index++;
    }

  

    console.log('All maximum area types:', results);
    return results;
}
 








    

// Your Google API Key
const apiKey = 'AIzaSyA6H9FgMEuwHwB4fX_4GlvC1BHdN85m7fM';




export function groupTiles(mapTilesHeight, mapTilesWidth, results) {
    const clusters = [];
    const visited = new Array(mapTilesHeight * mapTilesWidth).fill(false);

    function isValidCluster(x, y, size) {
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                const index = ny * mapTilesWidth + nx;
                if (nx >= mapTilesWidth || ny >= mapTilesHeight || visited[index] || results[index] !== results[y * mapTilesWidth + x]) {
                    return false;
                }
            }
        }
        return true;
    }

    function markVisited(x, y, size) {
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                visited[(y + dy) * mapTilesWidth + (x + dx)] = true;
            }
        }
    }

    for (let y = 0; y < mapTilesHeight; y++) {
        for (let x = 0; x < mapTilesWidth; x++) {
            const index = y * mapTilesWidth + x;
            if (!visited[index]) {
                // Check for large 3x3 cluster
                if (x + 2 < mapTilesWidth && y + 2 < mapTilesHeight && isValidCluster(x, y, 3)) {
                    const cluster = [];
                    for (let dy = 0; dy < 3; dy++) {
                        for (let dx = 0; dx < 3; dx++) {
                            cluster.push({ x: x + dx, y: y + dy });
                        }
                    }
                    clusters.push({ type: results[index], size: 3, tiles: cluster });
                    markVisited(x, y, 3);
                }
                // Check for medium 2x2 cluster
                else if (x + 1 < mapTilesWidth && y + 1 < mapTilesHeight && isValidCluster(x, y, 2)) {
                    const cluster = [];
                    for (let dy = 0; dy < 2; dy++) {
                        for (let dx = 0; dx < 2; dx++) {
                            cluster.push({ x: x + dx, y: y + dy });
                        }
                    }
                    clusters.push({ type: results[index], size: 2, tiles: cluster });
                    markVisited(x, y, 2);
                }
                // Skip single tiles and tiles not part of a valid 2x2 or 3x3 cluster
            }
        }
    }

    return clusters;
}