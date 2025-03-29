const http = require("http");
const fs = require("fs");
const ee = require("@google/earthengine");

const privateKey = JSON.parse(fs.readFileSync("KitahackServiceAccount.json", "utf8"));
const { initializeApp } = require("firebase/app");
const { 
  getGenerativeModel, 
  getVertexAI, 
  HarmBlockThreshold, 
  HarmCategory 
} = require("firebase/vertexai");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiHQN91J4t28NkWdj-gWSF41vu_UR4XjA",
  authDomain: "green-reaper.firebaseapp.com",
  projectId: "green-reaper",
  storageBucket: "green-reaper.firebasestorage.app",
  messagingSenderId: "191468563293",
  appId: "1:191468563293:web:3f747d745da0530a5256b4",
  measurementId: "G-QYT9GS4G97"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



async function generateContent(firebaseApp, budget, lst, ndvi, rainfall, flood_risk, wind_speed, wind_direction, solar_radiation, elevation_level, elevation_difference) {
  const generationConfig = {
    temperature: 1.0,
    topP: 0.95,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.OFF,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.OFF,
    },
  ];
  const vertexAI = getVertexAI(firebaseApp, { location: "us-central1" });
  const model = getGenerativeModel(vertexAI, {
    model: "gemini-2.0-flash-001",
    generationConfig,
    safetySettings,
  });
  const text1 = `Role:\nYou are an exceptional structural engineer with 20 years of experience working in Gamuda Berhad, IJM Corporation Berhad, and Sunway Construction Group Berhad specializing in sustainable building design, material optimization, and cost estimation. Your expertise includes analyzing environmental factors, selecting appropriate construction materials, calculating quantities, estimating costs, and providing precise spatial coordinates for key building components.\n\nContext of the given location: \nBudget allocated: RM${budget}\nLand Surface Temperature: ${lst}\nVegetation degree: ${ndvi}\nRainfall level per day (mm): ${rainfall}\nFlood Hazard Risk: ${flood_risk}\nWind speed (ms-1): ${wind_speed}\nWind direction (°): ${wind_direction}\nSolar radiation: ${solar_radiation}\nElevation (m): ${elevation_level},  Elevation Difference (m): ${elevation_difference}\n\nTasks:\nThe client wants to build a landed house with an emphasis on sustainability and environmental friendly, with an area of 2000 square feet in Semenyih. \n1. Describe explicitly the exterior design of the building\n2. Based on the building description, generate a list of suitable construction materials (e.g., foundation, walls, roofing) based on the environmental factors given, budget constraints, sustainability, and durability\n3. Calculate material quantities and the complete cost estimates required for the proposed building\n4. Provide the coordinates (x,y,z) of building's key components(e.g., doors, windows, structural supports) relative to a defined origin point (0,0,0).\n\nOutput Format: \nOutput a JSON with the following keys:\n\"house_description\": {\n    \"house_type\": \"\",\n    \"area\": \"\",\n    \"house_layout\": \"\",\n    \"house_theme\": \"\",\n    \"house_exterior_design\": \"\",\n    \"house_orientation\": \"\",\n    \"sustainability_features\": \"\",\n    \"explicit_textual_illustration\": \"\"\n},\n\"materials_list\": [\n    {\n        \"material_name\": \"\",\n        \"material_brand\": \"\",\n        \"material_cost_per_unit\": \"\",\n        \"material_total_cost\": \"\",\n        \"website_to_purchase\": \"\"\n    }\n    // ... more materials\n],\n\"total_expenditure\": \"\",\n\"key_building_components\": [\n    {\n        \"component_name\": \"\",\n        \"coordinates\": \"[x, y, z]\"\n    }\n    // ... more components and include four corners of building \n],\n\"disclaimer\": \"\"\n\n\nDisclaimer:\nDon't give assumptions or examples, provide a firm answer.  Use professional language throughout your response, as expected from a structural engineer.  Avoid colloquialisms and ensure clear, concise, and technically accurate wording. Structure the output according to the output format given. Do not write any additional text apart from the prescribed JSON format.`;

  return await sendContent(model, [text1]);
}

async function sendContent(model,content) {
    try {
        const result = await model.generateContent(content);
        if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
          return result.response.candidates[0].content.parts[0].text;
        } else {
          throw new Error("No result received from the model");
        }
      } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    };
  
}

async function authenticate() {
    return new Promise((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(privateKey, () => {
            console.log("Authenticated successfully!");
            ee.initialize(null, null, () => {
                console.log("Earth Engine initialized!");
                resolve("Authenticated and initialized successfully!");
            }, (err) => {
                console.error("EE Initialization failed:", err);
                reject(err);
            });
        }, (err) => {
            console.error("Authentication failed:", err);
            reject(err);
        });
    });
}

async function fetchLST(lat, lon) {
    return new Promise((resolve, reject) => {
        const dataset = ee.ImageCollection("MODIS/061/MOD11A1").filterDate('2024-02-01', '2025-02-28')
            .select("LST_Day_1km")
            .mean()
            .multiply(0.02)
            .subtract(273.15);
        
        const point = ee.Geometry.Point([parseFloat(lon), parseFloat(lat)])
        
        dataset.sample({
            region:point,
            scale:1000,
            numPixels:1
        }).evaluate((result, err) => {
            if (err || !result.features.length) {
                reject("Failed");
            } else {
                resolve(result.features[0].properties.LST_Day_1km);
            }
        })
    })
}

async function fetchNDVI(lat, lon) {
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

async function fetchRainfall(lat, lon) {
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



async function fetchFloodHistory(lat, lon) {
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

async function fetchWindData_and_Solar(lat, lon) {
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

async function fetchElevationDifference(lat, lon) {
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



const server = http.createServer(async (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });

    try {
        const text = await authenticate();
        var budget = 300000;
        var lst = await fetchLST(3.2140, 101.6356);
        var ndvi = await fetchNDVI(3.2140, 101.6356);
        var rainfall = await fetchRainfall(3.2140, 101.6356);
        var flood = await fetchFloodHistory(3.3429873564326646,101.26337727508546);
        var wind_data_and_solar = (await fetchWindData_and_Solar(3.2140, 101.6356)).split(' ');
        var wind_speed = parseFloat(wind_data_and_solar[0]);
        var wind_direction = parseFloat(wind_data_and_solar[1]);
        var solar_radiation = parseFloat(wind_data_and_solar[2]);
        var elevation = (await fetchElevationDifference(3.2140, 101.6356)).split(" ");
        var elevation_level = parseFloat(elevation[0]);
        var elevation_difference = parseFloat(elevation[1]);
        res.write("Geospatial data calculation, done.\n")
        var building_description = await generateContent(app, budget, lst, ndvi, rainfall, flood, wind_speed, wind_direction, solar_radiation, elevation_level, elevation_difference);
        
        res.end(building_description);
          //+;
    } catch (error) {
        res.end("Authentication failed: " + error.message);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
