const pool = require("./postgres.cjs"); // your pg Pool

async function getLanduseForBox(minLat, minLon, maxLat, maxLon) {
  const sql = `
WITH envelope AS (                                               -- ① Tile envelope
  SELECT ST_Transform(
           ST_MakeEnvelope($1, $2, $3, $4, 4326),                -- lon/lat
           3857                                                 -- metres
         ) AS geom
),
all_features AS (                                               -- ② Gather all
  -- ─────────────── polygons: landuse ───────────────
  SELECT 'landuse'            AS feature_type,
         landuse              AS feature_value,
         ST_Area( ST_Intersection(way, envelope.geom) ) AS measure
    FROM planet_osm_polygon, envelope
   WHERE landuse IS NOT NULL
     AND ST_Intersects(way, envelope.geom)

  UNION ALL
  -- ─────────────── polygons: building ──────────────
  SELECT 'building',
         building,
         ST_Area( ST_Intersection(way, envelope.geom) )
    FROM planet_osm_polygon, envelope
   WHERE building IS NOT NULL
     AND ST_Intersects(way, envelope.geom)

  UNION ALL
  -- ─────────────── lines: highway (length) ─────────
  SELECT 'highway',
         highway,
         ST_Length( ST_Intersection(way, envelope.geom) )
    FROM planet_osm_line, envelope
   WHERE highway IS NOT NULL
     AND ST_Intersects(way, envelope.geom)

  UNION ALL
  -- ─────────────── polygons: natural ───────────────
  SELECT 'natural',
         "natural",
         ST_Area( ST_Intersection(way, envelope.geom) )
    FROM planet_osm_polygon, envelope
   WHERE "natural" IS NOT NULL
     AND ST_Intersects(way, envelope.geom)

  UNION ALL
  -- ─────────────── polygons: leisure ───────────────
  SELECT 'leisure',
         leisure,
         ST_Area( ST_Intersection(way, envelope.geom) )
    FROM planet_osm_polygon, envelope
   WHERE leisure IS NOT NULL
     AND ST_Intersects(way, envelope.geom)
)
-- ③ Rank by largest measured footprint
SELECT feature_type, feature_value, measure
  FROM all_features
 ORDER BY measure DESC
 LIMIT 1;
  `;

  const params = [minLon, minLat, maxLon, maxLat];

  try {
    const { rows } = await pool.query(sql, params);

    if (!rows.length) return "no data";

    const { feature_type, feature_value } = rows[0];
    let lu = feature_value || "unknown";

    if (feature_type === "highway") {
      lu = /^(motorway|trunk)$/i.test(feature_value)
        ? "national_highway"
        : "road";
    } else if (feature_type === "building") {
      lu = "building";
    }
    return lu;
  } catch (err) {
    console.error("🚨 PostGIS query failed:", err.message, "params:", params);
    return "error";
  }
}

module.exports = { getLanduseForBox };
