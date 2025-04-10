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
const{ddd}= require('./services/3d')
const {spawn} = require('child_process');
const { floorpython } = require("./services/floorbridge");
const {getEnvironmentalData} = require("./services/fetchdata")
const tempstorage={};
app.use(cors({
  origin: 'http://localhost:5500',  // Use the exact origin of your frontend
  credentials: true
}));
app.use(express.json());
app.post('/analyze/environment', async (req, res) => {
  const { location } = req.body;
  const [lat, lon] = location.split(',').map(Number);

  try {
    await authenticate();
    const data = await getEnvironmentalData(lat, lon);
    res.json(data);
  } catch (err) {
    console.error('Env analysis failed:', err);
    res.status(500).json({ error: err.message });
  }
});
const session = require('express-session');

app.use(session({
  secret: '1234',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    sameSite:'lax'
  }
}));



app.post('/submit', async (req, res) => {

  const { location, budget } = req.body;
  const [lat, lon] = location.split(',').map(Number);

  try {
    await authenticate();
    const geosat = await getEnvironmentalData(lat, lon);
    geosat.budget=budget;
    const building_description = await generateContent(
      firebaseApp,
      budget,
      geosat.lst,
      geosat.ndvi,
      geosat.rainfall,
      geosat.flood,
      geosat.wind_speed,
      geosat.wind_direction,
      geosat.solar_radiation,
      geosat.elevation_level,
      geosat.elevation_difference
    );
    console.log("content done")
    const analysis = await runpython({ building_description, geosat });
    console.log(analysis)
    console.log("Analysis done")
    res.json({analysis,building_description})
  } catch (err) {
    console.error("Composite /submit failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/gimg', async (req, res) => {
  // Extract both the building description and analysis from the body
  const { building_description } = req.body;
  console.log('starting image generation')
  if (!building_description) {
    return res.status(400).json({ error: 'Missing required data.' });
  }
  try {
    // Now you have both pieces of data, and you can pass them to your floorpython function
    await floorpython({ building_description});
    // Assume further processing is done here
    console.log('starting 3d generation')
    await ddd ({building_description});
    console.log('3d generation complete')
    res.json({ message: 'floorpython executed successfully with analysis and building_description.' });
  } catch (err) {
    console.error('Error running floorpython:', err);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
