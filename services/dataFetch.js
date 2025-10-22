import mysql from "mysql2/promise";
import * as turf from "@turf/turf";

import fetch from "node-fetch";
// require("dotenv").config(); // default

const landUseMap = new Map(); // Key: Tile ID or Coordinates, Value: landUses data
let landUseInfo = new Map();
const landUseTypesDict = {};
// Class Node for A* Algorithm
const tileTypesArray = [];
// NEW – add near the other imports
import { Pool } from "pg";
const pgPool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Root12345@",
  database: "Oklahoma", // <-- ✅ now using Oklahoma!
});

// Re-use one pool for the whole run

async function fetchLocation() {
  try {
    const response = await fetch("http://ip-api.com/json/");
    const data = await response.json();

    if (!data || data.status !== "success") {
      throw new Error("Failed to get location from API");
    }

    return {
      minLat: data.lat.toString(),
      minLon: data.lon.toString(),
    };
  } catch (error) {
    console.error("Error fetching location:", error);
    return { minLat: "35.202991", minLon: "-97.425428" }; // Default fallback location
  }
}

async function fetchAndStoreBoundingBoxes(initialBox, countX, countY) {
  const boundingBoxes = generateSpiralBoundingBoxes(
    initialBox.minLat,
    initialBox.minLon,
    initialBox.maxLat,
    initialBox.maxLon,
    countX,
    countY
  );
  // const db = await mysql.createConnection({
  //   host: process.env.DB_HOST,
  //   user: process.env.DB_USER,
  //   password: process.env.DB_PASSWORD,
  //   database: process.env.DB_NAME,
  //   port: process.env.DB_PORT,
  // });
  const db = await mysql.createConnection({
    host: "localhost",
    user: "root", // MySQL username
    password: "Root12345@", // MySQL password
    database: "norman",
  });
  //  Loop through bounding boxes
  for (const box of boundingBoxes) {
    try {
      // Fetch land use data for bounding box
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

      let tileType;
      if (hasHighway) {
        tileType = "road";
      } else if (maxAreaType) {
        tileType = maxAreaType;
      } else {
        tileType = "no data";
      }

      const tileKey = `${box.x}_${box.y}`;
      landUseMap.set(tileKey, landUses);

      console.log(`Processing: ${tileKey} → ${tileType}`);

      // ✅ Insert into MySQL (Ensures Spiral Order is Correct)
      // ✅ Insert into MySQL (Ensures Spiral Order is Correct)
      const insertQuery = `
INSERT INTO bounding_boxes (
  id,
  minLat,
  minLon,
  maxLat,
  maxLon,
  x,
  y,
  order_index,
  landuseType,
  land_use_data
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE 
  minLat=VALUES(minLat), 
  minLon=VALUES(minLon), 
  maxLat=VALUES(maxLat), 
  maxLon=VALUES(maxLon), 
  x=VALUES(x), 
  y=VALUES(y), 
  order_index=VALUES(order_index),
  landuseType=VALUES(landuseType),
  land_use_data=VALUES(land_use_data);
`;

      await db.execute(insertQuery, [
        box.id,
        box.minLat,
        box.minLon,
        box.maxLat,
        box.maxLon,
        box.x,
        box.y,
        box.order,
        tileType, // ✅ Ensure land use type is stored
        serializedData, // ✅ Insert serialized land use data
      ]);
      console.log(serializedData);

      tileTypesArray.push({ x: box.x, y: box.y, type: tileType });
    } catch (error) {
      console.error("❌ Error processing bounding box:", error);
    }
  }

  console.log("✅ All bounding boxes processed successfully!");
  await db.end();
}

function generateSpiralBoundingBoxes(
  minLat,
  minLon,
  maxLat,
  maxLon,
  countX,
  countY
) {
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
  // console.log("here see");
  // console.log(boundingBoxes);

  return boundingBoxes;
}

async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon, box) {
  const client = await pgPool.connect();
  try {
    const bbox4326 = [minLon, minLat, maxLon, maxLat];

    /* ---------- Query polygons with FIXES ------------------------ */
    const polySql = `
      WITH
        bbox_3857 AS (
          SELECT ST_Transform(
                   ST_MakeEnvelope($1,$2,$3,$4,4326), 3857) AS geom
        ),
        cand AS (
          SELECT
            /* exact Overpass priority, but first matching only */
            CASE
              WHEN COALESCE(power, (tags->'power')::text) = 'plant'
                THEN 'power:plant'
  
              WHEN COALESCE(building, (tags->'building')::text) IS NOT NULL
               AND COALESCE(building, (tags->'building')::text) <> 'yes'
                THEN COALESCE(building, (tags->'building')::text)
  
              WHEN COALESCE(landuse, (tags->'landuse')::text) IS NOT NULL
               AND COALESCE(landuse, (tags->'landuse')::text) <> 'yes'
                THEN COALESCE(landuse, (tags->'landuse')::text)
  
              WHEN COALESCE(leisure, (tags->'leisure')::text) IS NOT NULL
               AND COALESCE(leisure, (tags->'leisure')::text) <> 'yes'
                THEN COALESCE(leisure, (tags->'leisure')::text)
  
              WHEN COALESCE("natural", (tags->'natural')::text) IS NOT NULL
               AND COALESCE("natural", (tags->'natural')::text) <> 'yes'
                THEN COALESCE("natural", (tags->'natural')::text)
  
              -- REMOVE PLACE! Do NOT allow place to dominate.
              -- WHEN COALESCE(place, (tags->'place')::text) IS NOT NULL
              --  AND COALESCE(place, (tags->'place')::text) <> 'yes'
              --   THEN COALESCE(place, (tags->'place')::text)
  
            END AS type,
  
            /* clip to tile and fix invalid geometry */
            ST_Intersection(ST_MakeValid(way), bbox_3857.geom) AS geom,
            tags::jsonb AS tags
          FROM planet_osm_polygon, bbox_3857
          WHERE way && bbox_3857.geom
            AND (
                 COALESCE(power, (tags->'power')::text) = 'plant'
              OR COALESCE(building, (tags->'building')::text) IS NOT NULL
              OR COALESCE(landuse , (tags->'landuse' )::text) IS NOT NULL
              OR COALESCE(leisure , (tags->'leisure' )::text) IS NOT NULL
              OR COALESCE("natural", (tags->'natural')::text) IS NOT NULL
              -- OR COALESCE(place   , (tags->'place'   )::text) IS NOT NULL -- REMOVE place
            )
        )
      SELECT
        type,
        ST_Area(ST_Transform(geom,3857)) AS area,
        tags
      FROM cand
      WHERE type IS NOT NULL
        AND NOT ST_IsEmpty(geom);
      `;

    const { rows: polyRows } = await client.query(polySql, bbox4326);

    /* ----------  motorway / trunk check  --------- */
    const highwaySql = `
WITH bbox_3857 AS (
  SELECT ST_Transform(
           ST_MakeEnvelope($1,$2,$3,$4,4326), 3857) AS geom
)
SELECT 1
FROM planet_osm_line, bbox_3857
WHERE highway IN ('motorway','trunk')
  AND ST_Intersects(way, bbox_3857.geom)
LIMIT 1;
`;
    const { rowCount: highCnt } = await client.query(highwaySql, bbox4326);
    const hasHighway = highCnt > 0;

    /* ---------- Accumulate areas -------------------------------- */
    const landUses = {};
    const tileKey = `${box.minLat.toFixed(6)}_${box.minLon.toFixed(6)}`;

    if (!landUseInfo.has(tileKey)) {
      landUseInfo.set(tileKey, {
        lat: box.minLat,
        lon: box.minLon,
        tags: {},
        landUses: {},
        maxAreaType: null,
      });
    }

    let hasPowerPlant = false;
    let powerPlantType = null;

    for (const { type, area, tags } of polyRows) {
      if (!type) continue;

      Object.assign(landUseInfo.get(tileKey).tags, tags);

      if (type === "power:plant") {
        hasPowerPlant = true;
        powerPlantType = tags["plant:source"] || "unknown";
      }

      landUses[type] = (landUses[type] || 0) + area;
    }

    /* ---------- Pick dominant land-use -------------------------- */
    const sorted = Object.entries(landUses).sort((a, b) => b[1] - a[1]);
    let maxAreaType = sorted.length ? sorted[0][0] : null;
    if (maxAreaType === "yes" && sorted.length > 1) maxAreaType = sorted[1][0];

    /* ---------- Apply highway / power overrides ----------------- */
    if (hasHighway) maxAreaType = "national_highway";
    else if (hasPowerPlant) maxAreaType = `power:plant (${powerPlantType})`;

    /* ---------- Save -------------------------------------------- */
    landUseInfo.get(tileKey).landUses = { ...landUses };
    landUseInfo.get(tileKey).maxAreaType = maxAreaType;

    const serialized = JSON.stringify({ [tileKey]: landUseInfo.get(tileKey) });
    landUseInfo.clear();

    return [maxAreaType, null, hasPowerPlant, hasHighway, landUses, serialized];
  } catch (err) {
    console.error("PostGIS query failed:", err);
    return [null, null, false, false, {}, "{}"];
  } finally {
    client.release();
  }
}

// async function fetchLandUseInBoundingBox(minLat, minLon, maxLat, maxLon, box) {
//   const query = `
//    [out:json];
//    (
//      way["power"](${minLat},${minLon},${maxLat},${maxLon});
//      way["building"](${minLat},${minLon},${maxLat},${maxLon});
//      way["landuse"](${minLat},${minLon},${maxLat},${maxLon});
//      way["leisure"](${minLat},${minLon},${maxLat},${maxLon});
//      way["natural"](${minLat},${minLon},${maxLat},${maxLon});
//      way["place"](${minLat},${minLon},${maxLat},${maxLon});
//      way["highway"](${minLat},${minLon},${maxLat},${maxLon});
//      node["natural"](${minLat},${minLon},${maxLat},${maxLon});
//    );
//    out body geom;
//    >;
//    out skel qt;
//   `;

//   const url = "https://overpass-api.de/api/interpreter";

//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       body: `data=${encodeURIComponent(query)}`,
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     const landUses = {};
//     const invalidPolygons = [];
//     let prioritizedType = null;
//     let hasPowerPlant = false;
//     let hasHighway = false;
//     let powerPlantType = null;

//     // ✅ Use absolute coordinate key instead of x_y
//     const tileKey = `${box.minLat.toFixed(6)}_${box.minLon.toFixed(6)}`;

//     if (!landUseInfo.has(tileKey)) {
//       landUseInfo.set(tileKey, {
//         lat: box.minLat,
//         lon: box.minLon,
//         tags: {},
//         landUses: {},
//       });

//       landUseTypesDict[tileKey] = {
//         lat: box.minLat,
//         lon: box.minLon,
//         tags: {},
//         landUses: {},
//         maxAreaType: null,
//       };
//     }

//     if (data.elements) {
//       data.elements.forEach((element) => {
//         let type = null;

//         if (element.tags) {
//           Object.assign(landUseInfo.get(tileKey).tags, element.tags);
//           Object.assign(landUseTypesDict[tileKey].tags, element.tags);

//           if (element.tags.natural === "water") {
//             console.log("Water detected:", element.tags.water || "unspecified");
//           }
//           if (element.tags.natural === "wood") {
//             console.log(
//               "Wood detected:",
//               element.tags.description || "unspecified"
//             );
//           }
//           if (element.tags.pitch) {
//             console.log("Pitch detected:", element.tags.sport || "unspecified");
//           }
//           if (element.tags.industrial) {
//             console.log(
//               "Industrial:",
//               element.tags.industrial || "unspecified"
//             );
//           }
//           if (element.tags.building === "yes" && element.tags.man_made) {
//             console.log("Building w/ man-made:", element.tags.man_made);
//           }
//           if (element.tags.roof && element.tags.amenity) {
//             console.log("Roof w/ amenity:", element.tags.amenity);
//           }
//           if (element.tags.building && element.tags.amenity) {
//             console.log("Building w/ amenity:", element.tags.amenity);
//           }
//           if (element.tags.building && element.tags.shop) {
//             console.log("Building w/ shop:", element.tags.shop);
//           }
//           if (element.tags.bicycle) {
//             console.log("Bicycle element:", element.tags.bicycle);
//           }
//           if (element.tags.aeroway) {
//             console.log("Aeroway:", element.tags.aeroway);
//           }

//           // Priority tags
//           if (["motorway", "trunk"].includes(element.tags.highway)) {
//             hasHighway = true;
//             type = "national_highway";
//             prioritizedType = type;
//           } else if (element.tags.power === "plant") {
//             hasPowerPlant = true;
//             powerPlantType = element.tags["plant:source"] || "unknown";
//             prioritizedType = `power:plant (${powerPlantType})`;
//           } else if (
//             (element.tags.building && element.tags.building !== "yes") ||
//             (element.tags.landuse && element.tags.landuse !== "yes") ||
//             (element.tags.leisure && element.tags.leisure !== "yes") ||
//             (element.tags.natural && element.tags.natural !== "yes") ||
//             (element.tags.place && element.tags.place !== "yes")
//           ) {
//             type =
//               element.tags.building ||
//               element.tags.landuse ||
//               element.tags.leisure ||
//               element.tags.natural ||
//               element.tags.place;
//           }
//         }

//         if (type && element.geometry?.length > 0) {
//           const coordinates = element.geometry.map((point) => [
//             point.lon,
//             point.lat,
//           ]);

//           if (
//             coordinates.length >= 4 &&
//             coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
//             coordinates[0][1] === coordinates[coordinates.length - 1][1]
//           ) {
//             const polygon = turf.polygon([coordinates]);
//             const area = turf.area(polygon);

//             if (!landUses[type]) {
//               landUses[type] = 0;
//             }
//             landUses[type] += area;
//           } else {
//             invalidPolygons.push({ type, geometry: coordinates });
//           }
//         }
//       });
//     }

//     let sortedLandUses = Object.entries(landUses).sort((a, b) => b[1] - a[1]);

//     let maxAreaType = null;

//     if (sortedLandUses.length > 0) {
//       maxAreaType = sortedLandUses[0][0];
//       if (maxAreaType === "yes" && sortedLandUses.length > 1) {
//         maxAreaType = sortedLandUses[1][0];
//       }
//     }

//     if (hasHighway) {
//       maxAreaType = "national_highway";
//     } else if (hasPowerPlant) {
//       maxAreaType = `power:plant (${powerPlantType})`;
//     }

//     // Save final results
//     const tileData = landUseInfo.get(tileKey);
//     tileData.landUses = { ...landUses };
//     tileData.maxAreaType = maxAreaType;

//     // Serialize
//     const convertMapToObject = (map) => {
//       const obj = {};
//       map.forEach((value, key) => {
//         obj[key] = value;
//       });
//       return obj;
//     };

//     const serializedLandUseInfo = JSON.stringify(
//       convertMapToObject(new Map([[tileKey, tileData]]))
//     );

//     landUseInfo.clear();

//     console.log("Serialized Land Use Info:", serializedLandUseInfo);

//     return [
//       maxAreaType,
//       prioritizedType || null,
//       hasPowerPlant,
//       hasHighway,
//       landUses,
//       serializedLandUseInfo,
//     ];
//   } catch (error) {
//     console.error("Error fetching land use data:", error);
//     return [null, null, false, false, {}, "{}"];
//   }
// }

(async () => {
  // const locationData = await fetchLocation();
  // const minLat = parseFloat(locationData.minLat);
  // const minLon = parseFloat(locationData.minLon);

  const minLat = 35.4676;
  const minLon = -97.5164;

  // const minLat = 25.780249;

  // const minLon = -79.299656;

  const boxSize = 0.0026;
  const initialBox = {
    minLat: minLat,
    minLon: minLon,
    maxLat: minLat + boxSize,
    maxLon: minLon + boxSize,
  };
  // const gridWidth = 3100,
  //   gridHeight = 1800;
  const gridWidth = 3308;
  const gridHeight = 1308;

  await fetchAndStoreBoundingBoxes(initialBox, gridWidth, gridHeight);
})();
