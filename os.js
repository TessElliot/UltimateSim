export const landUseTypesDict = {};
// //import { titleSceneInstance } from "./scenes/TitleScene.js";
import { getLocation } from "./location.js"; // Adjust path as necessary
// const landUseMap = new Map(); // Key: Tile ID or Coordinates, Value: landUses data
export const landUseInfo = new Map();
const API_KEY = "349b2ad7a8cbe62ab39fc0097c80adea"; // Replace with your actual API key

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
  console.log("here see");
  console.log(boundingBoxes);

  return boundingBoxes;
}

const url = "";

async function fetchLocationUsingApi(lat, lon) {
  // console.log(lat, lon);
  ///this function will trigger api to get the nearest bouding box of "initial box", then set that bounding box as "initial box"
  // which is already in database..hence all the a=subsequesnt database's bouding box will exactly match with the ones generted by generateBOudingbOx function"
  //then we can just fetch the respective landuse type from database and yield them one by one.

  try {
    const response = await fetch(
      `http://localhost:8800/closestBbox?lat=${lat}&lon=${lon}`
    );
    //if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const boundingBoxData = await response.json();
    // Extract the first (and only) result from the array
    const closestBbox = boundingBoxData[0];

    // Return as an object with the required properties
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
  const url = `http://localhost:8800/initialBox`;

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
    // lat = 35.202991;
    // lon = 97.425428;
    console.log("helllow");

    const lat = initialBox.minLat;
    const lon = initialBox.minLon;
    console.log(lat, lon);

    const FinitialBox = await fetchLocationUsingApi(lat, lon);
    console.log("Hello");
    console.log(
      FinitialBox.minLat,
      FinitialBox.minLon,
      FinitialBox.maxLat,
      FinitialBox.maxLon
    );

    const boundingBoxes = generateSpiralBoundingBoxes(
      FinitialBox.minLat,
      FinitialBox.minLon,
      FinitialBox.maxLat,
      FinitialBox.maxLon,
      countX,
      countY
    );

    let countdown = boundingBoxes.length;

    const data = await loadtheMap(boundingBoxes);

    for (const box of boundingBoxes) {
      // Find the corresponding landuseType from the data based on matching IDs
      const matchingBox = data.find((item) => item.id === box.id);

      if (matchingBox) {
        const tileType = matchingBox.landuseType;
        // console.log(matchingBox);
        console.log("herewego");
        console.log(matchingBox.landUseData);

        // // Already parsed on server, no need for JSON.parse here
        const tileKey = Object.keys(matchingBox.landUseData)[0];
        const tileData = matchingBox.landUseData[tileKey];
        landUseInfo.set(tileKey, tileData);

        yield { tileType, box }; // Yield both the tileType and the corresponding box
      } else {
        // If there's no matching box, you can choose to handle it here
        console.warn(
          `No matching land use type found for box with ID: ${box.id}`
        );
      }

      // Introduce a delay of 0.25 seconds before yielding the next value
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } catch (error) {
    console.error(" Error fetching bounding boxes:", error);
  }
}
