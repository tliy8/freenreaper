const { getGenerativeModel, getVertexAI, HarmBlockThreshold, HarmCategory } = require("firebase/vertexai");

async function generateContent(firebaseApp, budget, lst, ndvi, rainfall, flood_risk, wind_speed, wind_direction, solar_radiation, elevation_level, elevation_difference) {
    const generationConfig = {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
    };

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.OFF },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.OFF },
    ];

    const vertexAI = getVertexAI(firebaseApp, { location: "us-central1" });
    const model = getGenerativeModel(vertexAI, {
        model: "gemini-2.0-flash-001",
        generationConfig,
        safetySettings,
    });

    const prompt = `Role:\nYou are an exceptional structural engineer with 20 years of experience working in Gamuda Berhad, IJM Corporation Berhad, and Sunway Construction Group Berhad specializing in sustainable building design, material optimization, and cost estimation. Your expertise includes analyzing environmental factors, selecting appropriate construction materials, calculating quantities, estimating costs, and providing precise spatial coordinates for key building components.\n\nContext of the given location: \nBudget allocated: RM${budget}\nLand Surface Temperature: ${lst}\nVegetation degree: ${ndvi}\nRainfall level per day (mm): ${rainfall}\nFlood Hazard Risk: ${flood_risk}\nWind speed (ms-1): ${wind_speed}\nWind direction (°): ${wind_direction}\nSolar radiation: ${solar_radiation}\nElevation (m): ${elevation_level},  Elevation Difference (m): ${elevation_difference}\n\nTasks:\nThe client wants to build a landed house with an emphasis on sustainability and environmental friendly, with an area of 2000 square feet in Semenyih. \n1. Describe explicitly the exterior design of the building\n2. Based on the building description, generate a list of suitable construction materials (e.g., foundation, walls, roofing) based on the environmental factors given, budget constraints, sustainability, and durability\n3. Calculate material quantities and the complete cost estimates required for the proposed building\n4. Provide the coordinates (x,y,z) of building's key components(e.g., doors, windows, structural supports) relative to a defined origin point (0,0,0).\n\nOutput Format: \nOutput a JSON with the following keys:\n\"house_description\": {\n    \"house_type\": \"\",\n    \"area\": \"\",\n    \"house_layout\": \"\",\n    \"house_theme\": \"\",\n    \"house_exterior_design\": \"\",\n    \"house_orientation\": \"\",\n    \"sustainability_features\": \"\",\n    \"explicit_textual_illustration\": \"\"\n},\n\"materials_list\": [\n    {\n        \"material_name\": \"\",\n        \"material_brand\": \"\",\n        \"material_cost_per_unit\": \"\",\n        \"material_total_cost\": \"\",\n        \"website_to_purchase\": \"\"\n    }\n    // ... more materials\n],\n\"total_expenditure\": \"\",\n\"key_building_components\": [\n    {\n        \"component_name\": \"\",\n        \"coordinates\": \"[x, y, z]\"\n    }\n    // ... more components and include four corners of building \n],\n\"disclaimer\": \"\"\n\n\nDisclaimer:\nDon't give assumptions or examples, provide a firm answer.  Use professional language throughout your response, as expected from a structural engineer.  Avoid colloquialisms and ensure clear, concise, and technically accurate wording. Structure the output according to the output format given. Do not write any additional text apart from the prescribed JSON format.`;

    return await sendContent(model, [prompt]);
}

async function sendContent(model, content) {
    const result = await model.generateContent(content);
    if (result?.response?.candidates?.length) {
        return result.response.candidates[0].content.parts[0].text;
    }
    throw new Error("No result received from the model");
}

module.exports = { generateContent };
