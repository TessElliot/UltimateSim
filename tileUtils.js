export function findClimateNumber(key) {
  const climateScores = {
    "power:plant (fossil_fuel)": -10,
    "power:plant (oil;gas)": -10,
    industrial: -5,
    highway: -6,
    landfill: -5,
    construction: -3,
    retail: -2,
    commercial: -2,
    parking: -2,
    residential: -2,
    neighborhood: -2,
    house: -2,
    garages: -2,
    stadium: -2,
    sports_centre: -1,
    hospital: -1,
    university: -1,
    school: -1,
    grass: 0,
    substation: 1,
    park: 2,
    pitch: 1,
    scrub: 1,
    wetland: 2,
    detached: -1,
    nature_reserve: 4,
    wood: 5,
    "power:plant (solar)": 6,
    wind: 8,
    null: 0,
    ground: 0,
    hydrogen: 10,
    green_apartments: 3,
    farmland: 1,
    farmyard: -2,
    water: 0,
    military: -2,
  };

  return climateScores[key] ?? 0;
}
// export function getConnectedRoadCluster(
//   startTile,
//   scene,
//   visitedSet = new Set()
// ) {
//   const cluster = [];
//   const queue = [startTile];

//   while (queue.length > 0) {
//     const tile = queue.pop();
//     const key = `${tile.gridX},${tile.gridY}`;

//     if (visitedSet.has(key)) continue;
//     visitedSet.add(key);
//     cluster.push(tile);

//     const neighbors = scene.mapTiles.filter(
//       (t) =>
//         Math.abs(t.gridX - tile.gridX) + Math.abs(t.gridY - tile.gridY) === 1 &&
//         (t.texture.key === "beach" || t.texture.key === "coastline")
//     );

//     neighbors.forEach((n) => {
//       const nKey = `${n.gridX},${n.gridY}`;
//       if (!visitedSet.has(nKey)) {
//         queue.push(n);
//       }
//     });
//   }

//   return cluster;
// }

// export function countNoDataTilesOnSides(cluster, orientation, scene) {
//   let sideA = 0;
//   let sideB = 0;

//   for (let tile of cluster) {
//     let offsetA, offsetB;

//     if (orientation === "horizontal") {
//       offsetA = { x: tile.gridX, y: tile.gridY - 1 };
//       offsetB = { x: tile.gridX, y: tile.gridY + 1 };
//     } else {
//       offsetA = { x: tile.gridX - 1, y: tile.gridY };
//       offsetB = { x: tile.gridX + 1, y: tile.gridY };
//     }

//     const tileA = scene.mapTiles.find(
//       (t) => t.gridX === offsetA.x && t.gridY === offsetA.y
//     );
//     const tileB = scene.mapTiles.find(
//       (t) => t.gridX === offsetB.x && t.gridY === offsetB.y
//     );

//     if (tileA?.texture?.key === "no data") sideA++;
//     if (tileB?.texture?.key === "no data") sideB++;
//   }

//   return { sideA, sideB };
// }

// export function applyWaterOnDominantNoDataSide(scene) {
//   const visited = new Set();

//   for (const tile of scene.mapTiles) {
//     if (
//       (tile.texture.key === "beach" || tile.texture.key === "coastline") &&
//       !visited.has(`${tile.gridX},${tile.gridY}`)
//     ) {
//       const cluster = getConnectedRoadCluster(tile, scene, visited);
//       const orientation = getClusterOrientation(cluster);
//       const { sideA, sideB } = countNoDataTilesOnSides(
//         cluster,
//         orientation,
//         scene
//       );

//       if (sideA > sideB) {
//         fillSideWithWater(
//           scene,
//           cluster,
//           orientation,
//           orientation === "horizontal" ? "top" : "left"
//         );
//       } else if (sideB > sideA) {
//         fillSideWithWater(
//           scene,
//           cluster,
//           orientation,
//           orientation === "horizontal" ? "bottom" : "right"
//         );
//       }
//     }
//   }
// }

// function fillSideWithWater(scene, cluster, orientation, side) {
//   const directions = {
//     top: { dx: 0, dy: -1 },
//     bottom: { dx: 0, dy: 1 },
//     left: { dx: -1, dy: 0 },
//     right: { dx: 1, dy: 0 },
//   };

//   const visited = new Set();
//   const queue = [];

//   const dir = directions[side];

//   for (const tile of cluster) {
//     const x = tile.gridX + dir.dx;
//     const y = tile.gridY + dir.dy;
//     const key = `${x},${y}`;

//     if (!visited.has(key)) {
//       const targetTile = scene.mapTiles.find(
//         (t) => t.gridX === x && t.gridY === y
//       );
//       if (targetTile?.texture?.key === "no data") {
//         queue.push({ x, y });
//         visited.add(key);
//       }
//     }
//   }

//   while (queue.length > 0) {
//     const { x, y } = queue.shift();
//     const key = `${x},${y}`;

//     const tile = scene.mapTiles.find((t) => t.gridX === x && t.gridY === y);
//     if (!tile || tile.texture.key !== "no data") continue;

//     tile.setTexture("water");
//     tile.play({ key: "water", randomFrame: true });
//     visited.add(key);

//     const beachOffsets = [
//       { dx: 0, dy: -1 },
//       { dx: 0, dy: 1 },
//       { dx: -1, dy: 0 },
//       { dx: 1, dy: 0 },
//     ];

//     for (const offset of beachOffsets) {
//       const bx = x + offset.dx;
//       const by = y + offset.dy;
//       const beachTile = scene.mapTiles.find(
//         (t) => t.gridX === bx && t.gridY === by
//       );

//       if (beachTile?.texture?.key === "beach") {
//         beachTile.setTexture(
//           "beach",
//           side === "top" || side === "left" ? 0 : 1
//         );
//       }
//     }

//     const neighborOffsets = [
//       { dx: 0, dy: -1 },
//       { dx: 0, dy: 1 },
//       { dx: -1, dy: 0 },
//       { dx: 1, dy: 0 },
//     ];

//     for (const offset of neighborOffsets) {
//       const nx = x + offset.dx;
//       const ny = y + offset.dy;
//       const nKey = `${nx},${ny}`;

//       if (visited.has(nKey)) continue;

//       const neighborTile = scene.mapTiles.find(
//         (t) => t.gridX === nx && t.gridY === ny
//       );
//       if (neighborTile?.texture?.key === "no data") {
//         queue.push({ x: nx, y: ny });
//         visited.add(nKey);
//       }
//     }
//   }
// }

// function getClusterOrientation(cluster) {
//   const xs = cluster.map((t) => t.gridX);
//   const ys = cluster.map((t) => t.gridY);

//   const xSpread = Math.max(...xs) - Math.min(...xs);
//   const ySpread = Math.max(...ys) - Math.min(...ys);

//   return xSpread >= ySpread ? "horizontal" : "vertical";
// }
export function applyWaterOnDominantNoDataSide(
  scene,
  tileArray = scene.mapTiles
) {
  const visited = new Set();

  for (const tile of tileArray) {
    if (
      (tile.texture.key === "beach" || tile.texture.key === "coastline") &&
      !visited.has(`${tile.gridX},${tile.gridY}`)
    ) {
      const cluster = getConnectedRoadCluster(tile, tileArray, visited);
      const orientation = getClusterOrientation(cluster);
      const { sideA, sideB } = countNoDataTilesOnSides(
        cluster,
        orientation,
        tileArray
      );

      if (sideA > sideB) {
        fillSideWithWater(
          scene,
          tileArray,
          cluster,
          orientation,
          orientation === "horizontal" ? "top" : "left"
        );
      } else if (sideB > sideA) {
        fillSideWithWater(
          scene,
          tileArray,
          cluster,
          orientation,
          orientation === "horizontal" ? "bottom" : "right"
        );
      }
    }
  }
}

export function getConnectedRoadCluster(
  startTile,
  tileArray,
  visitedSet = new Set()
) {
  const cluster = [];
  const queue = [startTile];

  while (queue.length > 0) {
    const tile = queue.pop();
    const key = `${tile.gridX},${tile.gridY}`;

    if (visitedSet.has(key)) continue;
    visitedSet.add(key);
    cluster.push(tile);

    const neighbors = tileArray.filter(
      (t) =>
        Math.abs(t.gridX - tile.gridX) + Math.abs(t.gridY - tile.gridY) === 1 &&
        (t.texture.key === "beach" || t.texture.key === "coastline")
    );

    neighbors.forEach((n) => {
      const nKey = `${n.gridX},${n.gridY}`;
      if (!visitedSet.has(nKey)) {
        queue.push(n);
      }
    });
  }

  return cluster;
}

export function countNoDataTilesOnSides(cluster, orientation, tileArray) {
  let sideA = 0;
  let sideB = 0;

  for (let tile of cluster) {
    let offsetA, offsetB;

    if (orientation === "horizontal") {
      offsetA = { x: tile.gridX, y: tile.gridY - 1 };
      offsetB = { x: tile.gridX, y: tile.gridY + 1 };
    } else {
      offsetA = { x: tile.gridX - 1, y: tile.gridY };
      offsetB = { x: tile.gridX + 1, y: tile.gridY };
    }

    const tileA = tileArray.find(
      (t) => t.gridX === offsetA.x && t.gridY === offsetA.y
    );
    const tileB = tileArray.find(
      (t) => t.gridX === offsetB.x && t.gridY === offsetB.y
    );

    if (tileA?.texture?.key === "no data") sideA++;
    if (tileB?.texture?.key === "no data") sideB++;
  }

  return { sideA, sideB };
}

function fillSideWithWater(scene, tileArray, cluster, orientation, side) {
  const directions = {
    top: { dx: 0, dy: -1 },
    bottom: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  const visited = new Set();
  const queue = [];

  const dir = directions[side];

  for (const tile of cluster) {
    const x = tile.gridX + dir.dx;
    const y = tile.gridY + dir.dy;
    const key = `${x},${y}`;

    if (!visited.has(key)) {
      const targetTile = tileArray.find((t) => t.gridX === x && t.gridY === y);
      if (targetTile?.texture?.key === "no data") {
        queue.push({ x, y });
        visited.add(key);
      }
    }
  }

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    const key = `${x},${y}`;

    const tile = tileArray.find((t) => t.gridX === x && t.gridY === y);
    if (!tile || tile.texture.key !== "no data") continue;

    tile.texture.key = "water";
    visited.add(key);

    const beachOffsets = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    const neighborOffsets = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    for (const offset of neighborOffsets) {
      const nx = x + offset.dx;
      const ny = y + offset.dy;
      const nKey = `${nx},${ny}`;

      if (visited.has(nKey)) continue;

      const neighborTile = tileArray.find(
        (t) => t.gridX === nx && t.gridY === ny
      );
      if (neighborTile?.texture?.key === "no data") {
        queue.push({ x: nx, y: ny });
        visited.add(nKey);
      }
    }
  }
}

function getClusterOrientation(cluster) {
  const xs = cluster.map((t) => t.x);
  const ys = cluster.map((t) => t.y);

  const xSpread = Math.max(...xs) - Math.min(...xs);
  const ySpread = Math.max(...ys) - Math.min(...ys);

  return xSpread >= ySpread ? "horizontal" : "vertical";
}
export function fixBeachTileFrames(scene) {
  console.log("yes");
  const directions = [
    { dx: 0, dy: -1, side: "top" },
    { dx: 0, dy: 1, side: "bottom" },
    { dx: -1, dy: 0, side: "left" },
    { dx: 1, dy: 0, side: "right" },
  ];

  for (const tile of scene.mapTiles) {
    if (tile.texture?.key !== "beach") continue;

    for (const { dx, dy, side } of directions) {
      const neighbor = scene.mapTiles.find(
        (t) => t.gridX === tile.gridX + dx && t.gridY === tile.gridY + dy
      );

      if (neighbor?.texture?.key === "water") {
        const frame = side === "top" || side === "left" ? 0 : 1;
        tile.setTexture("beach", frame);
        break;
      }
    }
  }
}

export function calculateClimateImpact(scene) {
  let total = 0;
  const scores = [];

  for (const tile of scene.mapTiles) {
    const score = findClimateNumber(tile.texture.key);
    total += score;
    scores.push(score);
  }

  scene.climateNum = total;
  scene.climateNumArray = scores;

  return total;
}
