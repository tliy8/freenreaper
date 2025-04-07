const express = require("express");
const ee = require("@google/earthengine");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { coordinates, date } = req.body;

    if (!coordinates || !date) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const geometry = ee.Geometry.Polygon([coordinates]);

    const sentinelImage = ee
      .ImageCollection("COPERNICUS/S2")
      .filterBounds(geometry)
      .filterDate(date.start, date.end)
      .sort("CLOUD_COVER")
      .first();

    const ndvi = sentinelImage
      .normalizedDifference(["B8", "B4"])
      .rename("NDVI")
      .clip(geometry);

    const visParams = {
      min: 0,
      max: 1,
      palette: ["blue", "white", "green"],
    };

    const mapId = await new Promise((resolve, reject) => {
      ee.data.getMapId(
        {
          image: ndvi.visualize(visParams),
        },
        (result, err) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });

    res.json({
      mapid: mapId.mapid,
      token: mapId.token,
      tile_url: `https://earthengine.googleapis.com/map/${mapId.mapid}/{z}/{x}/{y}?token=${mapId.token}`,
    });
  } catch (error) {
    console.error("Error generating NDVI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
