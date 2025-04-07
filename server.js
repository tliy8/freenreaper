const express = require("express");
const { initializeApp } = require("firebase/app");
const { authenticate } = require("./utils/auth");
const {
    fetchLST, fetchNDVI, fetchRainfall,
    fetchFloodHistory, fetchWindData_and_Solar, fetchElevationDifference
} = require("./services/earthEngine");
const { generateContent } = require("./services/vertexAI");
const firebaseConfig = require("./config/firebaseConfig");
const cors = require('cors');
const app = express();
const firebaseApp = initializeApp(firebaseConfig);
const {runpython} = require ('./services/pythonbridge')
app.use(cors());
app.use(express.json());
const {spawn} = require('child_process');
const { floorpython } = require("./services/floorbridge");
 


app.post('/submit', async (req, res) => {
  const { residentialType, budget, location,specialRequest } = req.body;
  const [lat, lon] = location.split(',').map(Number);

  console.log("Received data:", {
    residentialType,
    budget,
    location,
    specialRequest,
    lat,
    lon
  });
  try {
    const startReqTime = Date.now();
    await authenticate();
    console.log("Authenticated successfully!");
    console.log("Earth Engine initialized!");
  
    let lst, ndvi, rainfall, flood, windData, elevationData;
  
    try {
      lst = await fetchLST(lat, lon);
      console.log("LST:", lst);
    } catch (err) {
      throw new Error("fetchLST failed: " + err.message);
    }
  
    try {
      ndvi = await fetchNDVI(lat, lon);
      console.log("NDVI:", ndvi);
    } catch (err) {
      throw new Error("fetchNDVI failed: " + err.message);
    }
  
    try {
      rainfall = await fetchRainfall(lat, lon);
      console.log("Rainfall:", rainfall);
    } catch (err) {
      throw new Error("fetchRainfall failed: " + err.message);
    }
  
    try {
      flood = await fetchFloodHistory(lat, lon);
      console.log("Flood history:", flood);
    } catch (err) {
      throw new Error("fetchFloodHistory failed: " + err.message);
    }
  
    try {
      windData = await fetchWindData_and_Solar(lat, lon);
      console.log("WindData:", windData);
    } catch (err) {
      throw new Error("fetchWindData_and_Solar failed: " + err.message);
    }
  
    try {
      elevationData = await fetchElevationDifference(lat, lon);
      console.log("ElevationData:", elevationData);
    } catch (err) {
      throw new Error("fetchElevationDifference failed: " + err.message);
    }
  
    const [wind_speed, wind_direction, solar_radiation] = windData.split(' ').map(parseFloat);
    const [elevation_level, elevation_difference] = elevationData.split(' ').map(parseFloat);
  
    let building_description;
    try {
      building_description = await generateContent(
        firebaseApp,
        budget,
        lst,
        ndvi,
        rainfall,
        flood,
        wind_speed,
        wind_direction,
        solar_radiation,
        elevation_level,
        elevation_difference
      );
      console.log("Generated description");
    } catch (err) {
      throw new Error("generateContent failed: " + err.message);
    }
  
    const geosat = {
      budget,
      lst,
      ndvi,
      rainfall,
      wind_speed,
      wind_direction,
      solar_radiation,
      elevation_level,
      elevation_difference
    };
  
    res.send({
      geosat,
      building_description
    });
  
    console.log("Response sent:", { geosat, building_description });
    console.log(`Request handling time: ${Date.now() - startReqTime} ms`);
    const pythonoutput = await runpython({building_description,geosat});
    console.log("Python result",pythonoutput);
    const floorresult = await floorpython({building_description});
    console.log("Floor Result ",floorresult);
    
  } catch (error) {
    console.error("Error in /submit route:", error);
    res.status(500).send("Error: " + error.message);
  }  
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
