const landUseRuleSet = [
  { match: "building=yes", use: "residential", weight: 3 },
  { match: "highway=service", use: "urban_service", weight: 2 },
  { match: "service=alley", use: "urban_service", weight: 2 },
  { match: "bicycle", use: "urban_mobility", weight: 1 },
  { match: "cycleway", use: "urban_mobility", weight: 1 },
];

function inferLandUseFromTags(tags, ruleSet) {
  let bestMatch = null;

  for (const rule of ruleSet) {
    const [key, val] = rule.match.split("=");
    const matched =
      val !== undefined
        ? tags[key] === val
        : Object.prototype.hasOwnProperty.call(tags, key);

    if (matched) {
      if (!bestMatch || rule.weight > bestMatch.weight) {
        bestMatch = rule;
      }
    }
  }

  return bestMatch ? bestMatch.category : "urban_misc";
}
const inferred = inferLandUseFromTags(tags, landUseRuleSet);
