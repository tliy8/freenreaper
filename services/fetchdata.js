const {
    fetchLST,
    fetchNDVI,
    fetchRainfall,
    fetchFloodHistory,
    fetchWindData_and_Solar,
    fetchElevationDifference
} = require("./earthEngine")

const NodeCache = require("node-cache");
const geoCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

async function cacheFetch(key, fetchFn) {
  const cached = geoCache.get(key);
  if (cached) return cached;

  const result = await fetchFn();
  geoCache.set(key, result);
  return result;
}

const getEnvironmentalData = async (lat, lon) => {
    const [lst, ndvi, rainfall, flood, windData, elevationData] = await Promise.all([
      cacheFetch(`lst-${lat}-${lon}`, () => fetchLST(lat, lon)),
      cacheFetch(`ndvi-${lat}-${lon}`, () => fetchNDVI(lat, lon)),
      cacheFetch(`rainfall-${lat}-${lon}`, () => fetchRainfall(lat, lon)),
      cacheFetch(`flood-${lat}-${lon}`, () => fetchFloodHistory(lat, lon)),
      cacheFetch(`wind-${lat}-${lon}`, () => fetchWindData_and_Solar(lat, lon)),
      cacheFetch(`elevation-${lat}-${lon}`, () => fetchElevationDifference(lat, lon))
    ]);
  
    const [wind_speed, wind_direction, solar_radiation] = windData.split(' ').map(parseFloat);
    const [elevation_level, elevation_difference] = elevationData.split(' ').map(parseFloat);
  
    return {
      lst, ndvi, rainfall, flood,
      wind_speed, wind_direction, solar_radiation,
      elevation_level, elevation_difference
    };
  };
  
  module.exports = { getEnvironmentalData };
  