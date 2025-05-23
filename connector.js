export function updateAllRoadPatterns(scene) {
  let flaggedTiles = [];

  for (let i = 0; i < scene.mapTiles.length; i++) {
    const tile = scene.mapTiles[i];

    if (
      (tile.texture.key === "road" || tile.texture.key === "coastline") &&
      !tile.flagged
    ) {
      const tileArray = scene.getNeighborsForTile(tile, scene);

      for (let j = 1; j < tileArray.length; j++) {
        if (
          tileArray[j].texture.key === "road" &&
          !flaggedTiles.includes(tileArray[j])
        ) {
          tileArray[j].flagged = true;
          flaggedTiles.push(tileArray[j]);
        }
      }

      checkWhichPatternHoldsTrue(scene, tileArray, "road");

      while (flaggedTiles.length > 0) {
        for (let k = flaggedTiles.length - 1; k >= 0; k--) {
          const flaggedTile = flaggedTiles[k];
          const neighbors = scene.getNeighborsForTile(flaggedTile, scene);
          checkWhichPatternHoldsTrue(scene, neighbors, "road");
          flaggedTile.flagged = false;
          flaggedTiles.splice(k, 1);
        }
      }
    }
  }
}

function checkWhichPatternHoldsTrue(scene, tileArray, newTile) {
  const patterns = [
    { id: "pattern1", indices: [], applyTo: [{ index: 0, textureIndex: 0 }] },
    { id: "pattern2", indices: [1], applyTo: [{ index: 0, textureIndex: 0 }] },
    { id: "pattern3", indices: [2], applyTo: [{ index: 0, textureIndex: 1 }] },
    {
      id: "pattern4",
      indices: [1, 2],
      applyTo: [{ index: 0, textureIndex: 3 }],
    },

    { id: "pattern5", indices: [4], applyTo: [{ index: 0, textureIndex: 0 }] },
    {
      id: "pattern6",
      indices: [1, 4],
      applyTo: [{ index: 0, textureIndex: 0 }],
    },
    {
      id: "pattern7",
      indices: [2, 4],
      applyTo: [{ index: 0, textureIndex: 5 }],
    },
    {
      id: "pattern8",
      indices: [1, 2, 4],
      applyTo: [{ index: 0, textureIndex: 6 }],
    },

    { id: "pattern9", indices: [3], applyTo: [{ index: 0, textureIndex: 1 }] },
    {
      id: "pattern10",
      indices: [1, 3],
      applyTo: [{ index: 0, textureIndex: 4 }],
    },
    {
      id: "pattern11",
      indices: [2, 3],
      applyTo: [{ index: 0, textureIndex: 1 }],
    },
    {
      id: "pattern12",
      indices: [1, 2, 3],
      applyTo: [{ index: 0, textureIndex: 9 }],
    },

    {
      id: "pattern13",
      indices: [3, 4],
      applyTo: [{ index: 0, textureIndex: 2 }],
    },
    {
      id: "pattern14",
      indices: [1, 3, 4],
      applyTo: [{ index: 0, textureIndex: 8 }],
    },
    {
      id: "pattern15",
      indices: [2, 3, 4],
      applyTo: [{ index: 0, textureIndex: 7 }],
    },
    {
      id: "pattern16",
      indices: [1, 2, 3, 4],
      applyTo: [{ index: 0, textureIndex: 10 }],
    },
  ];

  for (const pattern of patterns) {
    if (isPatternMatched(tileArray, pattern)) {
      applyPatternAction(scene, pattern, tileArray, newTile);
      return;
    }
  }
}

function isPatternMatched(tileArray, pattern) {
  const matched = pattern.indices.every(
    (index) => tileArray[index] && tileArray[index].texture.key === "road"
  );

  const others = [1, 2, 3, 4].filter((i) => !pattern.indices.includes(i));
  const unmatched = others.every(
    (index) => tileArray[index] && tileArray[index].texture.key !== "road"
  );

  return matched && unmatched;
}

function applyPatternAction(scene, pattern, tileArray, newTile) {
  for (const { index, textureIndex } of pattern.applyTo) {
    const tile = tileArray[index];
    if (!tile) continue;

    if (tile.texture.key === "road" || tile.texture.key === "coastline") {
      tile.setTexture(tile.texture.key, textureIndex);
    }
  }
}
export function updateAllCoastlinePatterns(scene) {}
