const ee = require("@google/earthengine");
const fs = require("fs");

const privateKey = JSON.parse(fs.readFileSync("KitahackServiceAccount.json", "utf8"));

function fetchLST(lat, lon) { 
    return new Promise((resolve, reject) => {
      const dataset = ee.ImageCollection("MODIS/061/MOD11A1")
        .filterDate('2024-02-01', '2025-02-28')
        .select("LST_Day_1km")
        .mean()
        .multiply(0.02)
        .subtract(273.15);
  
      const point = ee.Geometry.Point([parseFloat(lon), parseFloat(lat)]);
  
      dataset.sample({
        region: point,
        scale: 1000,
        numPixels: 1
      }).evaluate((result, err) => {
        if (err) {
          console.error("fetchLST Earth Engine error:", err);
          return reject(new Error("fetchLST failed: " + err));
        }
        if (!result || !result.features || result.features.length === 0) {
          console.error("fetchLST returned no data:", result);
          return reject(new Error("fetchLST failed: No data returned"));
        }
  
        const lst = result.features[0].properties.LST_Day_1km;
        console.log("fetchLST success, value:", lst);
        resolve(lst);
      });
    });
  }
  
function fetchNDVI(lat, lon) {
    return new Promise ((resolve, reject) => {

        const point = ee.Geometry.Point([parseFloat(lon), parseFloat(lat)]);

        const dataset = ee.ImageCollection("COPERNICUS/S2")
            .filterBounds(point)
            .filterDate('2024-02-01', '2025-02-28')
            .sort("system:time_start")
            .first();
        
        const ndvi = dataset.normalizedDifference(['B8','B4']);

        ndvi.sample({
            region: point,
            scale:10,
            numPixels:1
        }).evaluate((result, err) => {
            if (err || !result.features.length) {
                reject("Failed");
            } else {
                resolve(result.features[0].properties.nd);
            }
        })
        
    })
}
function fetchRainfall(lat, lon)  {
    return new Promise((resolve, reject) => {
        const point = ee.Geometry.Point([parseFloat(lon), parseFloat(lat)]);

        const dataset = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY") // CHIRPS Daily Precipitation
            .filterBounds(point)
            .filterDate('2024-02-01', '2024-02-28') // February 2024
            .select("precipitation")
            .mean(); // Average rainfall over the period

        dataset.reduceRegion({
            reducer: ee.Reducer.mean(), // Get the mean rainfall
            geometry: point,
            scale: 1000, // 1 km resolution
            maxPixels: 1e9
        }).evaluate((result, err) => {
            if (err) {
                reject("Error fetching rainfall: " + err.message);
            } else if (result && 'precipitation' in result) {
                resolve(result.precipitation); // Return rainfall value in mm
            } else {
                reject("No rainfall data available for this location.");
            }
        });
    });
}
function fetchFloodHistory(lat, lon) {
    return new Promise((resolve, reject) => {
        const point = ee.Geometry.Point([lon, lat]);

        const floodHazard = ee.ImageCollection("JRC/CEMS_GLOFAS/FloodHazard/v1")
            .select("depth") // Correct band name
            .max(); 

        floodHazard.reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 1000,
            maxPixels: 1e9
        }).evaluate((result, err) => {
            if (err) {
                reject("Error fetching flood hazard data: " + err);
            } else {
                resolve(result.depth);
            }
        });
    });
}
function fetchWindData_and_Solar(lat, lon) {
    return new Promise ((resolve, reject) => {
        const point = ee.Geometry.Point([lon, lat]);

        const dataset = ee.ImageCollection('ECMWF/ERA5_LAND/HOURLY')
        .filterBounds(point)
        .filter(ee.Filter.date('2024-02-01', '2025-02-28'))
        .select(["u_component_of_wind_10m", "v_component_of_wind_10m", 'surface_net_solar_radiation']).mean();

        dataset.reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 9000,
            maxPixels: 1e9
        }).evaluate((result, err) => {
            if (err || !result) {
                reject("Failed");
            } else {
                const uWind = result['u_component_of_wind_10m'] ?? 0;
                const vWind = result['v_component_of_wind_10m'] ?? 0;
                const solarValue = result['surface_net_solar_radiation'] ?? 0;
                const windSpeed = Math.sqrt(Math.pow(uWind, 2) + Math.pow(vWind, 2));

                // Compute wind direction (convert radians to degrees)
                const windDirection = (Math.atan2(-uWind, -vWind) * 180 / Math.PI + 360) % 360;
                
                resolve(windSpeed + " " + windDirection + " " + solarValue);
            }
        })
    })
}

function fetchElevationDifference(lat, lon) {
    return new Promise((resolve, reject) => {
        const point = ee.Geometry.Point([lon, lat]);

        // Get elevation from NASA SRTM DEM
        const elevation = ee.Image('USGS/SRTMGL1_003').select('elevation');

        // Get elevation at the point
        elevation.reduceRegion({
            reducer: ee.Reducer.mean(),
            geometry: point,
            scale: 30,  // 30m resolution
            maxPixels: 1e9
        }).evaluate((result, err) => {
            if (err || !result) {
                reject("Failed to fetch elevation: " + err);
            } else {
                const elevationAtPoint = result['elevation'] ?? 0;

                // Get elevation of surrounding area (1km radius)
                const surroundingElevation = elevation.reduceRegion({
                    reducer: ee.Reducer.mean(),
                    geometry: point.buffer(1000),  // 1km radius
                    scale: 30,
                    maxPixels: 1e9
                });

                surroundingElevation.evaluate((surroundingResult, err) => {
                    if (err || !surroundingResult) {
                        reject("Failed to fetch surrounding elevation: " + err);
                    } else {
                        const avgSurroundingElevation = surroundingResult['elevation'] ?? 0;

                        // Calculate elevation difference
                        const elevationDiff = elevationAtPoint - avgSurroundingElevation;

                        resolve(`${elevationAtPoint.toFixed(2)} ${elevationDiff.toFixed(2)}m`);
                    }
                });
            }
        });
    });
}



module.exports = {
    fetchLST,
    fetchNDVI,
    fetchRainfall,
    fetchFloodHistory,
    fetchWindData_and_Solar,
    fetchElevationDifference
};
