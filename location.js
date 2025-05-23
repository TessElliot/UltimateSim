let locationData = {
  lat: 0,
  lon: 0,
};

// Functions to set and get location data
export function setLocation(cityInput, stateInput) {
  const lat = parseFloat(cityInput); // Interpret 'city' as latitude
  const lon = parseFloat(stateInput); // Interpret 'state' as longitude

  if (isNaN(lat) || isNaN(lon)) {
    console.error("Invalid latitude or longitude value.");
    return;
  }

  locationData.lat = lat;
  locationData.lon = lon;
  console.log(`Location set: Latitude - ${lat}, Longitude - ${lon}`);
}

export function getLocation() {
  return locationData;
}
