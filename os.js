
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


async function fetchLocation()
{


function success(position){
    const latitude=position.coords.latitude;
    const longitude=position.coords.longitude;

    // mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
    console.log(`Latitude: ${latitude} °, Longitude: ${longitude} °`);

}

function error(){
    status.textContent="Unable to fetch your location";
}
if(!navigator.geolocation){
    status.textContent="Geolocation is not supported in your browser";

} else{
    status.textContent="Locating...";
    navigator.geolocation.getCurrentPosition(success,error);
}

}

window.onload=fetchLocation;




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







// async function fetchRestaurantDetails() {
//     ///overapass api query to fetch restaurants
//     const overpassQuery = `[out:json][timeout:25];
//     // fetch area "Oklahoma City" to search in
//     area["name"="Norman"]->.searchArea;
//     // gather results
//     nwr["amenity"="restaurant"](area.searchArea);
//     // print results with lat/lon
//     out center;
//     `;
    
//     try {
//      //pass query to the api,get respnse using fetch function
//         const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
//         if (!response.ok) {
//             throw new Error('Failed to fetch restaurant data');
//         }
//         const data = await response.json();

//         // if 'data' is populated then console.log it 
//         if (data && data.elements) {
//             console.log("Restaurant data elements:");
//             data.elements.forEach(element => {
//                 console.log("Element ID:", element.id);
//                 console.log("Element Name:", element.tags && element.tags.name);
//                 console.log("Element Latitude:", element.lat || (element.center && element.center.lat));
//                 console.log("Element Longitude:", element.lon || (element.center && element.center.lon));
//                 console.log("---------------------------");
//             });

//             //maps the source data to a new, simplified structure that includes only the id, name, lat, and lon of each element
//             //can get amenity="restaurant" too
//             return data.elements.map(element => {
//                 return {
//                     id: element.id,
//                     name: element.tags && element.tags.name,
//                     lat: element.lat || (element.center && element.center.lat),
//                     lon: element.lon || (element.center && element.center.lon)
//                 };
//             });
//         } else {
//             console.error("No restaurant data found");
//             return [];
//         }
//     } catch (error) {
//         console.error("Error fetching restaurant details:", error);
//         return [];
//     }
// }
/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////



// Define the bounding box coordinates
// const minLatitude = 35.2001;
// const minLongitude = -97.4457;
// const maxLatitude = 35.2201;
// const maxLongitude = -97.4257;
// const minLatitude = 35.493540;
// const minLongitude = -96.353208;
// const maxLatitude = 35.536385;
// const maxLongitude = -96.295157;
// const bbox = `${minLatitude},${minLongitude},${maxLatitude},${maxLongitude}`;

// // Construct the Overpass API query
// const overpassQuery = `
// [out:json];
// (
//   way["landuse"="residential"](${bbox});
//   relation["landuse"="residential"](${bbox});
//   way["landuse"="farmland"](${bbox});
//   relation["landuse"="farmland"](${bbox});
//   way["natural"="water"](${bbox});
//   relation["natural"="water"](${bbox});
// );
// out body;
// >;
// out skel qt;
// `;

// // Send the query to the Overpass API
// fetch("http://overpass-api.de/api/interpreter", {
//   method: "POST",
//   body: overpassQuery,
//   headers: {
//     "Content-Type": "text/plain"
//   }
// })
// .then(response => response.json())
// .then(data => {
//   // Process the response
//   data.elements.forEach(element => {
//     if (element.type === 'way') {
//       const tags = element.tags || {};
//       if (tags.landuse) {
//         console.log(`Land use: ${tags.landuse}, ID: ${element.id}`);
//       } else if (tags.natural) {
//         console.log(`Natural feature: ${tags.natural}, ID: ${element.id}`);
//       }
//     }
//   });
// })
// .catch(error => {
//   console.error("Error fetching data from Overpass API:", error);
// });





/////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
//console.log the fetched restaurant details
// fetchRestaurantDetails().then(restaurantDetails => {
//     console.log("Fetched restaurant details:", restaurantDetails);
// });

// // //saving in an array usage
// // (async () => {
// //     const restaurants = await fetchRestaurantData();
// //     console.log(restaurants);
// // })();



// ////////////////////////////////////////////////
// ////////////////////////////////////////////////
// //console.log the fetched restaurant details
// fetchRestaurantDetails().then(restaurantDetails => {
//     console.log("Fetched restaurant details:", restaurantDetails);
// });

// //saving in an array usage
// (async () => {
//     const restaurants = await fetchRestaurantData();
//     console.log(restaurants);
// })();


//.////////////////////////////////////////////////////.////////////////////////////////////////////////////.////////////////////////////////////////////////////.//////////////////////////////////////////////////

// async function fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon, apiKey) {
//     const corsProxy = 'https://cors-anywhere.herokuapp.com/';
//     const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiKey}`;


//     // Calculate center of the bounding box and the radius
//     const centerLat = (minLat + maxLat) / 2;
//     const centerLon = (minLon + maxLon) / 2;
//     const radius = calculateRadius(minLat, minLon, maxLat, maxLon);

//     try {
//         console.log('Sending request to Google Maps API...');
//         const response = await fetch(`${corsProxy}${url}&location=${centerLat},${centerLon}&radius=${radius}&type=establishment`);
    
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
    

//         const data = await response.json();
//         console.log('Response received:', data);

//         if (data.results.length === 0) {
//             console.log('No amenities found in the specified area.');
//         } else {
//             // Extract amenity type, name, latitude, and longitude
//             const amenities = [];
//             let currentRow = [];
//             let currentLat = minLat;

//             data.results.forEach(element => {
//                 const lat = element.geometry.location.lat;
//                 const lon = element.geometry.location.lng;
//                 currentRow.push({
//                     type: element.types[0],
//                     name: element.name,
//                     lat: lat,
//                     lon: lon
//                 });

//                 if (lat > currentLat) {
//                     amenities.push(currentRow);
//                     currentRow = [];
//                     currentLat = lat;
//                 }
//             });
//             if (currentRow.length > 0) {
//                 amenities.push(currentRow);
//             }

//             console.log('Amenities:', amenities);
//             return amenities;
//         }
//     } catch (error) {
//         console.error('Error fetching amenities:', error);
//         return [];
//     }
// }

// // Calculate radius for the bounding box
// function calculateRadius(minLat, minLon, maxLat, maxLon) {
//     const R = 6371; // Earth's radius in km
//     const dLat = (maxLat - minLat) * Math.PI / 180;
//     const dLon = (maxLon - minLon) * Math.PI / 180;

//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(minLat * Math.PI / 180) * Math.cos(maxLat * Math.PI / 180) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c;

//     return distance * 1000 / 2; // Convert to meters and divide by 2 for radius
// }

// // Coordinates
// const minLat = 35.218261;
// const minLon =   -97.317992;
// const maxLat = 35.232559;
// const maxLon = -97.293683;





////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

////////////////////////////////////////////////
////////////////////////////////////////////////
// async function fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon, apiKey) {
//     const corsProxy = 'https://cors-anywhere.herokuapp.com/';
//     const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${apiKey}`;

//     // Calculate center of the bounding box and the radius
//     const centerLat = (minLat + maxLat) / 2;
//     const centerLon = (minLon + maxLon) / 2;
//     const radius = calculateRadius(minLat, minLon, maxLat, maxLon);

//     try {
//         console.log('Sending request to Google Maps API...');
//         const response = await fetch(`${corsProxy}${url}&location=${centerLat},${centerLon}&radius=${radius}&type=establishment`);
    
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Response received:', data);

//         if (data.results.length === 0) {
//             console.log('No amenities found in the specified area.');
//             return [];
//         } else {
//             // Extract amenity type, name, latitude, and longitude
//             const amenities = [];

//             data.results.forEach(element => {
//                 const lat = element.geometry.location.lat;
//                 const lon = element.geometry.location.lng;
//                 amenities.push({
//                     type: element.types[0],
//                     name: element.name,
//                     lat: lat,
//                     lon: lon
//                 });
//             });

//             console.log('Amenities:', amenities);
//             return amenities;
//         }
//     } catch (error) {
//         console.error('Error fetching amenities:', error);
//         return [];
//     }
// }

// // Calculate radius for the bounding box
// function calculateRadius(minLat, minLon, maxLat, maxLon) {
//     const R = 6371; // Earth's radius in km
//     const dLat = (maxLat - minLat) * Math.PI / 180;
//     const dLon = (maxLon - minLon) * Math.PI / 180;

//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(minLat * Math.PI / 180) * Math.cos(maxLat * Math.PI / 180) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const distance = R * c;

//     return distance * 1000 / 2; // Convert to meters and divide by 2 for radius
// }

// // Coordinates
// const minLat = 35.218261;
// const minLon = -97.317992;
// const maxLat = 35.232559;
// const maxLon = -97.293683;


////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

// async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const mapboxToken = 'pk.eyJ1Ijoic2hyb29kMTgiLCJhIjoiY2x5eDFyeG94MWhhdjJxcHNpaWY3dW05NSJ9.1J2hhPwOYoptWsjGm_PByw';
//     const endpoint = 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery.json';

//     const url = `${endpoint}?access_token=${mapboxToken}&radius=100&limit=50&bbox=${minLon},${minLat},${maxLon},${maxLat}`;

//     try {
//         const response = await fetch(url);
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return null;
//     }
// }


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


// const minLat =36.028297;
// const minLon =  -92.457559;
// const maxLat = 36.059329;
// const maxLon =  -92.419702;
// const maxLat = 36.043172;
// const maxLon =  -92.434312;






const minLat = 35.203921;
const minLon =  -97.458841;
const maxLat = 35.218362;
const maxLon = -97.423746;















// Fetch amenities and find the most frequent types
fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon, 'AIzaSyA6H9FgMEuwHwB4fX_4GlvC1BHdN85m7fM').then(amenities => {
    if (amenities.length > 0) {
        const mostFrequentTypesArray = findMostFrequentTypes(amenities);
        console.log('Most frequent types:', mostFrequentTypesArray);
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////





// async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 // Check for both landuse and natural tags
//                 const type = element.tags && (element.tags.landuse || element.tags.natural);
//                 if (type) {
//                     landUses.push({
//                         type: type,
//                         id: element.id,
//                         geometry: element.geometry
//                     });
//                 }
//             });
//         }

//         console.log('Parsed Land Uses:', landUses); // Log parsed data

//         return landUses;
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return [];
//     }
// }

// fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon);




// async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 // Check for both landuse and natural tags
//                 const type = element.tags && (element.tags.landuse || element.tags.natural);
//                 if (type) {
//                     landUses.push({
//                         type: type,
//                         id: element.id,
//                         geometry: element.geometry
//                     });
//                 }
//             });
//         }

//         console.log('Parsed Land Uses:', landUses); // Log parsed data

//         return landUses;
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return [];
//     }
// }

// fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon);








// async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = {};
//         const invalidPolygons = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 const type = element.tags && (element.tags.landuse || element.tags.natural);
//                 if (type && element.geometry && element.geometry.length > 0) {
//                     const coordinates = element.geometry.map(point => [point.lon, point.lat]);

//                     // Check if the polygon is valid
//                     if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//                         coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

//                         const polygon = turf.polygon([coordinates]);
//                         const area = turf.area(polygon);

//                         if (!landUses[type]) {
//                             landUses[type] = 0;
//                         }
//                         landUses[type] += area;
//                     } else {
//                         invalidPolygons.push({
//                             type: type,
//                             geometry: coordinates
//                         });
//                         console.warn(`Skipping invalid polygon for type ${type}`);
//                     }
//                 }
//             });
//         }

//         console.log('Area by type:', landUses);
//         console.log('Invalid polygons:', invalidPolygons);

//         // Find the type with the maximum area
//         let maxArea = 0;
//         let maxAreaType = null;

//         Object.entries(landUses).forEach(([type, area]) => {
//             if (area > maxArea) {
//                 maxArea = area;
//                 maxAreaType = type;
//             }
//         });

//         console.log('Type with maximum area:', maxAreaType, 'with area:', maxArea);

//         return maxAreaType;
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return null;
//     }
// }



// fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon)
//     .then(maxAreaType => {
//         console.log('Type with maximum area:', maxAreaType);
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });

// export async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = {};
//         const invalidPolygons = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 const type = element.tags && (element.tags.landuse || element.tags.natural);
//                 if (type && element.geometry && element.geometry.length > 0) {
//                     // Convert line coordinates to a polygon geometry
//                     const coordinates = element.geometry.map(point => [point.lon, point.lat]);

//                     // Check if the polygon is valid
//                     if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//                         coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

//                         const polygon = turf.polygon([coordinates]);
//                         const area = turf.area(polygon);

//                         if (!landUses[type]) {
//                             landUses[type] = 0;
//                         }
//                         landUses[type] += area;
//                     } else {
//                         invalidPolygons.push({
//                             type: type,
//                             geometry: coordinates
//                         });
//                         console.warn(`Skipping invalid polygon for type ${type}`);
//                     }
//                 }
//             });
//         }

//         console.log('Area by type:', landUses);
//         console.log('Invalid polygons:', invalidPolygons);

//         // Find the type with the maximum area
//         let maxArea = 0;
//         let maxAreaType = null;

//         Object.entries(landUses).forEach(([type, area]) => {
//             if (area > maxArea) {
//                 maxArea = area;
//                 maxAreaType = type;
//             }
//         });

//         console.log('Type with maximum area:', maxAreaType, 'with area:', maxArea);

//         return [maxAreaType]; // Return the type with maximum area in an array
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return [];
//     }
// }



// window.fetchLandUseInBoundingBox = fetchLandUseInBoundingBox;

// fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon)
//     .then(maxAreaType => {
//         console.log('Type with maximum area:', maxAreaType);
//     })
//     .catch(error => {
//         console.error('Error:', error);
//     });
// // os.js







 
// export async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = {};
//         const invalidPolygons = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 const type = element.tags && (element.tags.landuse || element.tags.natural);
//                 if (type && element.geometry && element.geometry.length > 0) {
//                     const coordinates = element.geometry.map(point => [point.lon, point.lat]);

//                     if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//                         coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

//                         const polygon = turf.polygon([coordinates]);
//                         const area = turf.area(polygon);

//                         if (!landUses[type]) {
//                             landUses[type] = 0;
//                         }
//                         landUses[type] += area;
//                     } else {
//                         invalidPolygons.push({
//                             type: type,
//                             geometry: coordinates
//                         });
//                         console.warn(`Skipping invalid polygon for type ${type}`);
//                     }
//                 }
//             });
//         }

//         console.log('Area by type:', landUses);
//         console.log('Invalid polygons:', invalidPolygons);

//         let maxArea = 0;
//         let maxAreaType = null;

//         Object.entries(landUses).forEach(([type, area]) => {
//             if (area > maxArea) {
//                 maxArea = area;
//                 maxAreaType = type;
//             }
//         });

//         console.log('Type with maximum area:', maxAreaType, 'with area:', maxArea);

//         return [maxAreaType]; // Return the type with maximum area in an array
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return [];
//     }
// }


// const turf = require('@turf/turf'); // Make sure to include turf.js if you haven't already

// async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         console.log("starting from here");
//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = {};
//         const invalidPolygons = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 const type = element.tags && (element.tags.landuse || element.tags.natural);
//                 if (type && element.geometry && element.geometry.length > 0) {
//                     const coordinates = element.geometry.map(point => [point.lon, point.lat]);

//                     if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//                         coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

//                         const polygon = turf.polygon([coordinates]);
//                         const area = turf.area(polygon);

//                         if (!landUses[type]) {
//                             landUses[type] = 0;
//                         }
//                         landUses[type] += area;
//                     } else {
//                         invalidPolygons.push({
//                             type: type,
//                             geometry: coordinates
//                         });
//                         console.warn(`Skipping invalid polygon for type ${type}`);
//                     }
//                 }
//             });
//         }

//         console.log('Area by type:', landUses);
//         console.log('Invalid polygons:', invalidPolygons);

//         let maxArea = 0;
//         let maxAreaType = null;

//         Object.entries(landUses).forEach(([type, area]) => {
//             if (area > maxArea) {
//                 maxArea = area;
//                 maxAreaType = type;
//             }
//         });

//         console.log('Type with maximum area:', maxAreaType, 'with area:', maxArea);

//         return maxAreaType; // Return the type with maximum area directly
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return null; // Return null in case of error
//     }
// }

// function generateBoundingBoxes(minLat, minLon, maxLat, maxLon, count) {
//     const latDiff = maxLat - minLat; //.03
//     const lonDiff = maxLon - minLon;
//     const boundingBoxes = [];

//     for (let i = 0; i < count; i++) {
//         const newMinLat = minLat + i * latDiff; //1 2*0.03
//         const newMinLon = minLon;
//         const newMaxLat = newMinLat + latDiff;
//         const newMaxLon = newMinLon + lonDiff;
//         boundingBoxes.push({ minLat: newMinLat, minLon: newMinLon, maxLat: newMaxLat, maxLon: newMaxLon });
//     }

//     return boundingBoxes;
// }

// export async function processBoundingBoxes(initialBox, count) {
//     const { minLat, minLon, maxLat, maxLon } = initialBox;
//     const boundingBoxes = generateBoundingBoxes(minLat, minLon, maxLat, maxLon, count);
//     const results = [];

//     for (const box of boundingBoxes) {
//         const maxAreaType = await fetchLandUseInBoundingBox(box.minLat, box.minLon, box.maxLat, box.maxLon);
//         if (maxAreaType) {
//             results.push(maxAreaType);
//         }
//     }

//     console.log('All maximum area types:', results);
//     return results;
// }

// const initialBox = { minLat: 35.2, minLon: -97.5, maxLat: 35.23, maxLon: -97.47 };
// const count = 100; // Number of adjacent bounding boxes

// processBoundingBoxes(initialBox, count);




// export async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//       way["power"](${minLat},${minLon},${maxLat},${maxLon});
//       way["building"](${minLat},${minLon},${maxLat},${maxLon});
//       way["leisure"](${minLat},${minLon},${maxLat},${maxLon});
//       way["place"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to  Overpass API...');
      

//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = {};
//         const invalidPolygons = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 const type = element.tags && (element.tags.landuse || element.tags.natural || element.tags.power || element.tags.building || element.tags.leisure || element.tags.place);
//                 if (type && element.geometry && element.geometry.length > 0) {
//                     const coordinates = element.geometry.map(point => [point.lon, point.lat]);

//                     if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//                         coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

//                         const polygon = turf.polygon([coordinates]);
//                         const area = turf.area(polygon);

//                         if (!landUses[type]) {
//                             landUses[type] = 0;
//                         }
//                         landUses[type] += area;
//                     } else {
//                         invalidPolygons.push({
//                             type: type,
//                             geometry: coordinates
//                         });
//                         console.warn(`Skipping invalid polygon for type ${type}`);
//                     }
//                 }
//             });
//         }

//         console.log('Area by type:', landUses);
//         console.log('Invalid polygons:', invalidPolygons);

//         // Determine the land use type with maximum area
//         let maxArea = 0;
//         let maxAreaType = null;

//         Object.entries(landUses).forEach(([type, area]) => {
//             if (area > maxArea) {
//                 maxArea = area;
//                 maxAreaType = type;
//             }
//         });

//         console.log('Type with maximum area:', maxAreaType, 'with area:', maxArea);

//         // Prepare the array of all land use types
//         const landUseTypes = Object.keys(landUses);

//         // Function to prioritize land use types
//         const prioritizeLandUse = (types) => {
//             const hierarchy = [
//                 { type: 'power', check: 'plant:source' },
//                 { type: 'building', check: 'building:levels', subtypes: ['apartments', 'office'] },
//                 { type: 'landuse' },
//                 { type: 'leisure' },
//                 { type: 'natural' },
//                 { type: 'place', subtypes: ['ocean', 'sea'] }
//             ];

//             for (let h of hierarchy) {
//                 for (let t of types) {
//                     if (t.startsWith(h.type) && (!h.check || h.subtypes && h.subtypes.includes(t.split(':')[1]))) {
//                         return t;
//                     }
//                 }
//             }
//             return null;
//         };

//         const prioritizedType = prioritizeLandUse(landUseTypes);

//         // Console log the prioritized type or "None"
//         if (prioritizedType) {
//             console.log(`Prioritized land use type: ${prioritizedType}`);
//         } else {
//             console.log('No prioritized land use type found');
//         }

//         return [landUseTypes, prioritizedType || maxAreaType]; // Return the array of land use types and the prioritized type
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return [[], null];
//     }
// }














console.log("here new functionionality starts");







// export async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//     [out:json];
//     (
//       way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//       way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//       way["power"](${minLat},${minLon},${maxLat},${maxLon});
//       way["building"](${minLat},${minLon},${maxLat},${maxLon});
//       way["leisure"](${minLat},${minLon},${maxLat},${maxLon});
//       way["place"](${minLat},${minLon},${maxLat},${maxLon});
//     );
//     out body geom;
//     >;
//     out skel qt;
//     `;

//     const url = 'https://overpass-api.de/api/interpreter';

//     try {
//         console.log('Sending request to Overpass API...');
//         console.log("this is the new stuff");

//         const response = await fetch(url, {
//             method: 'POST',
//             body: `data=${encodeURIComponent(query)}`,
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log('Land use data response:', data);

//         const landUses = {};
//         const invalidPolygons = [];

//         if (data.elements) {
//             data.elements.forEach(element => {
//                 const type = element.tags && (element.tags.landuse || element.tags.natural || element.tags.power || element.tags.building || element.tags.leisure || element.tags.place);
//                 if (type && element.geometry && element.geometry.length > 0) {
//                     const coordinates = element.geometry.map(point => [point.lon, point.lat]);

//                     if (coordinates.length >= 4 && coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//                         coordinates[0][1] === coordinates[coordinates.length - 1][1]) {

//                         const polygon = turf.polygon([coordinates]);
//                         const area = turf.area(polygon);

//                         if (!landUses[type]) {
//                             landUses[type] = 0;
//                         }
//                         landUses[type] += area;
//                     } else {
//                         invalidPolygons.push({
//                             type: type,
//                             geometry: coordinates
//                         });
//                         console.warn(`Skipping invalid polygon for type ${type}`);
//                     }
//                 }
//             });
//         }

//         console.log('Area by type:', landUses);
//         console.log('Invalid polygons:', invalidPolygons);

//         // Prepare the array of all land use types
//         const landUseTypes = Object.keys(landUses);

//         console.log('Land use types before prioritization:', landUseTypes);

//         // Function to prioritize land use types
//         const prioritizeLandUse = (types) => {
//             const hierarchy = [
//                 { type: 'power', subtypes: ['plant'] },
//                 { type: 'building', subtypes: ['apartments', 'office'] },
//                 { type: 'landuse' },
//                 { type: 'leisure' },
//                 { type: 'natural' },
//                 { type: 'place', subtypes: ['ocean', 'sea'] }
//             ];

//             for (let h of hierarchy) {
//                 for (let t of types) {
//                     console.log(`Checking type: ${t} against hierarchy: ${h.type}`);
//                     if (t.startsWith(h.type)) {
//                         if (h.subtypes) {
//                             for (let subtype of h.subtypes) {
//                                 console.log(`Checking subtype: ${subtype} within type: ${t}`);
//                                 if (t.includes(subtype)) {
//                                     console.log(`Match found: ${h.type} with subtype: ${subtype}`);
//                                     return h.type; // Return the general type if subtype is found
//                                 }
//                             }
//                         } else {
//                             console.log(`Match found: ${h.type} with no specific subtype`);
//                             return h.type; // Return the general type if no specific subtype is required
//                         }
//                     }
//                 }
//             }
//             return null;
//         };

//         const prioritizedType = prioritizeLandUse(landUseTypes);



//         // Console log the prioritized type or "None"
//         if (prioritizedType) {
//             console.log(`Prioritized land use type: ${prioritizedType}`);
//         } else {
//             console.log('No prioritized land use type found');
//         }

//         return [landUseTypes, prioritizedType || maxAreaType]; // Return the array of land use types and the prioritized type
//     } catch (error) {
//         console.error('Error fetching land use data:', error);
//         return [[], null];
//     }
// }




// Function to generate bounding boxes
function generateBoundingBoxes(minLat, minLon, maxLat, maxLon, countX, countY) {
    const latDiff = (maxLat - minLat) / countY;
    const lonDiff = (maxLon - minLon) / countX;
    const boundingBoxes = [];

    for (let i = 0; i < countY; i++) {
        for (let j = 0; j < countX; j++) {
            const newMinLat = minLat + i * latDiff;
            const newMinLon = minLon + j * lonDiff;
            const newMaxLat = newMinLat + latDiff;
            const newMaxLon = newMinLon + lonDiff;
            
            // Optional: Slightly overlap bounding boxes
            boundingBoxes.push({
                minLat: newMinLat - 0.0001, 
                minLon: newMinLon - 0.0001, 
                maxLat: newMaxLat + 0.0001, 
                maxLon: newMaxLon + 0.0001  
            });
        }
    }

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
        console.log('Sending request to Overpass API...');

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
        console.log('Land use data response:', data);

        const landUses = {};
        const invalidPolygons = [];
        let prioritizedType = null;
        let hasPowerPlant = false;
        let buildingLevels = [];

        if (data.elements) {
            data.elements.forEach(element => {
                console.log('Element tags:', element.tags);

                const type = element.tags && (element.tags.power || element.tags.building || element.tags.landuse || element.tags.leisure || element.tags.natural || element.tags.place);

                // Check for power plant
                if (element.tags && element.tags.power === 'plant') {
                    hasPowerPlant = true;
                    prioritizedType = 'power:plant';
                    console.log('yes found: power plant');
                }

                // Check for buildings and levels
                if (element.tags && element.tags.building) {
                    const buildingType = element.tags.building;

                    // Skip buildings with type "yes"
                    if (buildingType.toLowerCase() === "yes") {
                        console.log('Skipping building with type "yes"');
                        return;
                    }

                    console.log(`Found building: ${buildingType}`);

                    let levels = null;
                    if (element.tags['building:levels']) {
                        levels = parseInt(element.tags['building:levels'], 10);
                    }
                    buildingLevels.push({
                        id: element.id,
                        levels: levels,
                        type: buildingType
                    });
                    console.log(`yes found: building type ${buildingType} with ${levels !== null ? levels : 'unknown'} levels`);

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
                        console.warn(`Skipping invalid polygon for type ${type}`);
                    }
                }
            });
        }

        console.log('Area by type:', landUses);
        console.log('Invalid polygons:', invalidPolygons);

        // Determine the type with the maximum area
        let maxAreaType = null;
        let maxArea = 0;

        Object.keys(landUses).forEach(type => {
            if (landUses[type] > maxArea) {
                maxArea = landUses[type];
                maxAreaType = type;
            }
        });

        // Prioritize power plant if present
        if (hasPowerPlant) {
            maxAreaType = 'power:plant';
        }

        return [maxAreaType, prioritizedType || null, hasPowerPlant, buildingLevels];
    } catch (error) {
        console.error('Error fetching land use data:', error);
        return [null, null, false, []];
    }
}

// Function to process bounding boxes
export async function processBoundingBoxes(initialBox, countX, countY) {
    const { minLat, minLon, maxLat, maxLon } = initialBox;
    const boundingBoxes = generateBoundingBoxes(minLat, minLon, maxLat, maxLon, countX, countY);
    const results = [];

    for (const box of boundingBoxes) {
        const [maxAreaType, prioritizedType, hasPowerPlant, buildingLevels] = await fetchLandUseInBoundingBox(box.minLat, box.minLon, box.maxLat, box.maxLon);
        if (maxAreaType) {
            results.push(maxAreaType);
        }
    }

    console.log('All maximum area types:', results);
    return results;
}

// Example usage of processBoundingBoxes
const initialBoundingBox = {
    minLat: 35.425420,
    minLon: -97.683103,
    maxLat: 35.455629,
    maxLon: -97.607916,
};
const countX = 3; // Number of horizontal subdivisions
const countY = 3; // Number of vertical subdivisions

async function main() {
    try {
        const results = await processBoundingBoxes(initialBoundingBox, countX, countY);
        console.log('Results:', results);
    } catch (error) {
        console.error('Error processing bounding boxes:', error);
    }
}

main();

 








    

// Your Google API Key
const apiKey = 'AIzaSyA6H9FgMEuwHwB4fX_4GlvC1BHdN85m7fM';

fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon, apiKey);






const cityName = 'Norman'; // Replace 'CityName' with the name of the city  interested in
//can be replaced by user input from html element


//fetch function to make a GET request to the Nominatim API

// //chained with then method to extract reposnse fetched by API reponse
// fetch(`https://nominatim.openstreetmap.org/search.php?q=${cityName}&format=json`)
//   .then(response => response.json())
//   .then(data => {
//     if (data && data.length > 0) {
//       const lat = data[0].lat;
//       const lon = data[0].lon;
//       console.log(`Coordinates for ${cityName}: Latitude ${lat}, Longitude ${lon}`);
//     } else {
//       console.log(`Coordinates for ${cityName} not found`);
//     }
//   })
//   .catch(error => {
//     console.error('Error fetching coordinates:', error);
//   });



//   async function fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//       [out:json];
//       (
//         node["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//         way["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//         relation["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//       );
//       out body;
//     `;
  
//     const url = 'https://overpass-api.de/api/interpreter';
  
//     try {
//       console.log('Sending request to Overpass API...');
//       console.log('Query:', query);
//       const response = await fetch(url, {
//         method: 'POST',
//         body: `data=${encodeURIComponent(query)}`,
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       });
  
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
  
//       const data = await response.json();
//       console.log('Response received:', data);
  
//       if (data.elements.length === 0) {
//         console.log('No amenities found in the specified area.');
//       } else {
//         // Extract amenity type, name, latitude, and longitude
//         const amenities = [];
//         let currentRow = [];
//         let currentLat = minLat;
//         let currentLon = minLon;
//         data.elements.forEach(element => {
//           currentRow.push({
//             type: element.tags.amenity,
//             name: element.tags.name,
//             lat: element.lat,
//             lon: element.lon
//           });
//           if (element.lat > currentLat) {
//             amenities.push(currentRow);
//             currentRow = [];
//             currentLat = element.lat;
//             currentLon = minLon;
//           }
//         });
//         if (currentRow.length > 0) {
//           amenities.push(currentRow);
//         }
  
//         console.log('Amenities:', amenities);
//         return amenities;
//       }
//     } catch (error) {
//       console.error('Error fetching amenities:', error);
//       return [];
//     }
//   }
  
//   //cooridnates
//   const minLat =     35.507221;
//   const minLon = -97.000653;
//   const maxLat = 35.535677;
//   const maxLon = -96.965423;







// fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon);
  
  

// //   //////fetchinng amenities using lat lon values
//   async function fetchAmenities() {
//     // const lat1 = 35.219794;
//     // const lon1 = -97.422274;
//     // const lat2 = 35.219574;
//     // const lon2 = -97.422285;

//     const lat1 = 35.203984;
//     const lon1 = -97.441221;
//     const lat2 = 35.207452;
//     const lon2 = -97.434242;
 
    
//     // Increasing the offset for a larger area
//     const latOffset = 0.0009;
//     const lonOffset = 0.0009;
    
//     const minLat = Math.min(lat1, lat2) - latOffset;
//     const minLon = Math.min(lon1, lon2) - lonOffset;
//     const maxLat = Math.max(lat1, lat2) + latOffset;
//     const maxLon = Math.max(lon1, lon2) + lonOffset;
    
//     const query = `
//       [out:json];
//       (
//         node["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//         way["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//         relation["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//       );
//       out body;
//     `;
  
//     const url = 'https://overpass-api.de/api/interpreter';
  
//     try {
//       console.log('Sending request to Overpass API...');
//       console.log('Query:', query);
//       const response = await fetch(url, {
//         method: 'POST',
//         body: `data=${encodeURIComponent(query)}`,
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       });
  
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
  
//       const data = await response.json();
//       console.log('Response received:', data);
  
//       if (data.elements.length === 0) {
//         console.log('No amenities found in the specified area.');
//       } else {
//         // Extract amenity type, name, latitude, and longitude
//         const amenities = data.elements.map(element => ({
//           type: element.tags.amenity,
//           name: element.tags.name,
//           lat: element.lat,
//           lon: element.lon
//         }));
  
//         console.log('Amenities:', amenities);
//       }
//     } catch (error) {
//       console.error('Error fetching amenities:', error);
//     }
//   }
  
//   fetchAmenities();

  


  



  /////////boundingbox
  

//   async function fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon) {
//     const query = `
//       [out:json];
//       (
//         node["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//         way["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//         relation["amenity"](${minLat},${minLon},${maxLat},${maxLon});
//       );
//       out body;
//     `;
  
//     const url = 'https://overpass-api.de/api/interpreter';
  
//     try {
//       console.log('Sending request to Overpass API...');
//       console.log('Query:', query);
//       const response = await fetch(url, {
//         method: 'POST',
//         body: `data=${encodeURIComponent(query)}`,
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       });
  
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
  
//       const data = await response.json();
//       console.log('Response received:', data);
  
//       if (data.elements.length === 0) {
//         console.log('No amenities found in the specified area.');
//       } else {
//         // Extract amenity type, name, latitude, and longitude
//         const amenities = data.elements.map(element => ({
//           type: element.tags.amenity,
//           name: element.tags.name,
//           lat: element.lat,
//           lon: element.lon
//         }));
  
//         console.log('Amenities:', amenities);
//         return amenities;
//       }
//     } catch (error) {
//       console.error('Error fetching amenities:', error);
//       return [];
//     }
//   }
  
// // Bounding box for Norman, Oklahoma, USA
// const minLat = 35.203984;
// const minLon =  -97.441221;

// const maxLat = 35.207452;
// const maxLon =  -97.434242;


// // Call the function with the bounding box coordinates
// fetchAmenitiesInBoundingBox(minLat, minLon, maxLat, maxLon);






















// // Example usage
// const cityName = "Oklahoma City";
// calculateCityCenter(cityName)
//     .then(center => {
//         console.log(`Center coordinates of ${cityName}: Latitude ${center.lat}, Longitude ${center.lon}`);
//     })
//     .catch(error => {
//         console.error('Error calculating city center:', error);
//     });


// async function fetchRestaurantDetails() {
//     // const overpassQuery = `[out:json][timeout:25];
//     // rel(185049);
//     // map_to_area;
//     // nwr["amenity"="prison"](area);
//     // out geom;`;

//     try {
//         const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
//         if (!response.ok) {
//             throw new Error('Failed to fetch prison data');
//         }
//         const data = await response.json();

//         if (data && data.elements) {
//             console.log("Prison data elements:");
//             data.elements.forEach(element => {
//                 console.log("Element ID:", element.id);
//                 console.log("Element Name:", element.tags && element.tags.name);
//                 console.log("Element Latitude:", element.lat);
//                 console.log("Element Longitude:", element.lon);
//                 console.log("---------------------------");
//             });

//             return data.elements.map(element => {
//                 return {
//                     id: element.id,
//                     name: element.tags && element.tags.name,
//                     lat: element.lat,
//                     lon: element.lon
//                 };
//             });
//         } else {
//             console.error("No prison data found");
//             return [];
//         }
//     } catch (error) {
//         console.error("Error fetching prison details:", error);
//         return [];
//     }
// }

// // Example usage
// fetchRestaurantDetails().then(restaurantDetails => {
//     console.log("Fetched prison details:", restaurantDetails);
// });


















// async function fetchRestaurantDetails() {
//     const overpassQuery = `[out:json][timeout:25];
//     rel(185049);
//     map_to_area;
//     nwr["amenity"="prison"](area);
//     out geom;`;

//     try {
//         const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
//         if (!response.ok) {
//             throw new Error('Failed to fetch prison data');
//         }
//         const data = await response.json();

//         if (data && data.elements) {
//             console.log("Prison data elements:");
//             data.elements.forEach(element => {
//                 console.log("Element ID:", element.id);
//                 console.log("Element Name:", element.tags && element.tags.name);
//                 console.log("Element Latitude:", element.lat);
//                 console.log("Element Longitude:", element.lon);
//                 console.log("---------------------------");
//             });

//             return data.elements.map(element => {
//                 return {
//                     id: element.id,
//                     name: element.tags && element.tags.name,
//                     lat: element.lat,
//                     lon: element.lon
//                 };
//             });
//         } else {
//             console.error("No prison data found");
//             return [];
//         }
//     } catch (error) {
//         console.error("Error fetching prison details:", error);
//         return [];
//     }
// }

// // Example usage
// fetchRestaurantDetails().then(prisonDetails => {
//     console.log("Fetched prison details:", prisonDetails);
// });
