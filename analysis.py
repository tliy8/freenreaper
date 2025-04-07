from google import genai
from google.genai import types
from google.auth import load_credentials_from_file
from google.auth.credentials import Credentials
import base64
import json
import asyncio
import re
from datetime import time, datetime
import sys
import json

input_data = json.load(sys.stdin)

building_description = input_data['building_description']
if isinstance(input_data['building_description'], str):
    building_description = json.loads(input_data['building_description'])
else:
    building_description = input_data['building_description']


geosat_data = input_data['geosat']
user_budget = geosat_data['budget']

description = building_description['house_description']


async def generate(context):
  pattern = re.compile(r"(```javascript)|(```)")
  credentials, project_id = load_credentials_from_file(
        r"C:\Users\agmen\OneDrive\桌面\khack\GreenReaper\green-reaper.json", 
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
  )
  client = genai.Client(
      credentials=credentials,
      vertexai=True,
      project="green-reaper",
      location="us-central1",
  )


  model = "gemini-2.5-pro-exp-03-25"
  contents = [
    types.Content(
      role="user",
      parts=[
      types.Part(text=context),
      types.Part.from_uri(
      file_uri="https://i.pinimg.com/736x/48/ce/e7/48cee72787df28ed8fc4cb291329064b.jpg",
      mime_type="image/jpeg",
      ),
      ]
    )
  ]
  generate_content_config = types.GenerateContentConfig(
    temperature = 1,
    top_p = 0.95,
    max_output_tokens = 8192,
    response_modalities = ["TEXT"],
    safety_settings = [types.SafetySetting(
      category="HARM_CATEGORY_HATE_SPEECH",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_HARASSMENT",
      threshold="OFF"
    )],
    response_mime_type = "application/json",
    response_schema = {"type":"OBJECT","properties":{"response":{"type":"STRING"}}},
  )

  return json.loads(client.models.generate_content(    
    model=model,
    contents=contents,
    config=generate_content_config,).candidates[0].content.parts[0].text)['response']

FINANCIAL_CONTEXT = f'''
You are a financial analyst specializing in sustainable housing. Based on the architectural, environmental, and material data below, perform a detailed financial analysis for a modern sustainable landed house project.

---
🏡 **House Overview**
- House Type: {description['house_type']}
- Area: {description['area']}
- Theme: {description['house_theme']}
- Layout: {description['house_layout']}
- Orientation: {description['house_orientation']}

---
📦 **Material and Cost Details**
{json.dumps(building_description['materials_list'], indent=2)}

---
📍 **Environmental GeoSAT Data**
- Avg Land Surface Temperature (LST): {geosat_data["lst"]}
- NDVI (Vegetation Index): {geosat_data["ndvi"]}
- Solar Radiation: {geosat_data["solar_radiation"]}
- Monthly Rainfall Average: {geosat_data["rainfall"]}
- Average Wind Speed: {geosat_data["wind_speed"]}

---
💰 **User Budget**: {user_budget}

---
🌱 **Sustainability Features (Dynamic Input)**
{description['sustainability_features']}

---
🧠 **Instructions for Financial Analysis**:
1. Validate if the total material cost matches the listed total expenditure. Report mismatches.
2. Determine if the project is within budget or exceeds it. If it exceeds, calculate the overage.
3. Estimate **annual maintenance costs** for all sustainability features using your own assumptions and industry standards.
4. Project **5-year financial performance**, considering:
   - ROI from solar panels (based on local solar radiation)
   - Water bill savings from rainwater harvesting (based on rainfall)
   - Cooling energy savings based on LST and insulation
5. Suggest **cost optimizations** while preserving sustainability goals.
6. Rate the project's **financial feasibility** (Excellent, Good, Moderate, Poor) with a short justification.
7. Prepared by: Green Reaper, date: {datetime.strftime(datetime.today(), "%d-%m-%Y")}


Please present the report in a structured, professional format with **HTML tables** using the following layout:

---

<h2>🧾 Sustainable House Financial Analysis Report</h2>

<h3>1. 📋 Executive Summary</h3>
<ul>
  <li><strong>Project Name:</strong> [House Name or Type]</li>
  <li><strong>Location:</strong> [If applicable]</li>
  <li><strong>House Area:</strong> [e.g., 2000 sq ft]</li>
  <li><strong>Total Estimated Cost:</strong> RM [Total]</li>
  <li><strong>User Budget:</strong> RM [Budget]</li>
  <li><strong>Feasibility Rating:</strong> [Excellent / Good / Moderate / Poor] — [short reasoning]</li>
</ul>

<h3>2. 💸 Cost Breakdown</h3>

<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>Item</th>
      <th>Brand</th>
      <th>Quantity/Unit</th>
      <th>Cost per Unit (RM)</th>
      <th>Total Cost (RM)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Reinforced Concrete (Foundation)</td>
      <td>Lafarge Malaysia</td>
      <td>30 m³</td>
      <td>RM 280</td>
      <td>RM 8,400</td>
    </tr>
    <!-- Repeat for other materials -->
    <tr>
      <td colspan="4"><strong>TOTAL</strong></td>
      <td><strong>RM [Total]</strong></td>
    </tr>
  </tbody>
</table>

<h3>3. 🔧 Maintenance Cost Estimation</h3>

<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Estimated Annual Maintenance (RM)</th>
      <th>Assumption Basis</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Green Roof</td>
      <td>RM [value]</td>
      <td>Based on typical green roof maintenance</td>
    </tr>
    <!-- Repeat for other features -->
    <tr>
      <td><strong>Total</strong></td>
      <td colspan="2"><strong>RM [total]</strong></td>
    </tr>
  </tbody>
</table>

<h3>4. 📈 5-Year Financial Projection</h3>

<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>Year</th>
      <th>Maintenance Cost (RM)</th>
      <th>Energy Savings (RM)</th>
      <th>Water Savings (RM)</th>
      <th>Net Gain/Loss (RM)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>2</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>3</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>4</td><td></td><td></td><td></td><td></td></tr>
    <tr><td>5</td><td></td><td></td><td></td><td></td></tr>
  </tbody>
</table>

<h3>5. 🧠 Recommendations</h3>
<ul>
  <li>Is the project within budget?</li>
  <li>Cost-saving alternatives (if overbudget)</li>
  <li>Suggestions to preserve sustainability at lower cost</li>
</ul>

<h3>6. ✅ Final Verdict</h3>
<p>
  Provide a final feasibility rating: <strong>[Excellent / Good / Moderate / Poor]</strong> with a justification.
</p>


Use the JSON content and GeoSAT data provided to back up calculations and decisions.
'''


SUSTAINABILITY_CONTEXT = f'''
You are an environmental sustainability analyst for residential green architecture. Based on the provided architectural data, environmental conditions, and material choices, generate a detailed **sustainability analysis** for a modern eco-friendly landed house.

---

🏡 **House Sustainability Overview**
- House Type: {description['house_type']}
- Area: {description['area']}
- Theme: {description['house_theme']}
- Layout: {description['house_layout']}
- Orientation: {description['house_orientation']}

---

📍 **Environmental GeoSAT Data**
- Avg Land Surface Temperature (LST): {geosat_data["lst"]}
- NDVI (Vegetation Index): {geosat_data["ndvi"]}
- Solar Radiation: {geosat_data["solar_radiation"]}
- Monthly Rainfall Average: {geosat_data["rainfall"]}
- Average Wind Speed: {geosat_data["wind_speed"]}

---

📦 **Materials Used**
{json.dumps(building_description['materials_list'], indent=2)}

---

🌱 **Sustainability Features (Dynamic Input)**
{description['sustainability_features']}

---

🧠 **Instructions for Sustainability Analysis**:

1. **Evaluate the environmental impact** of the house design:
   - How does the building reduce energy and water consumption?
   - Is the orientation and layout optimal for the climate?
   - Assess use of passive cooling, solar access, and thermal insulation.

2. **Analyze material sustainability**:
   - Are the materials renewable, recycled, or certified sustainable?
   - Consider carbon footprint, life cycle impact, and sourcing.

3. **Assess green technologies** used:
   - Effectiveness of solar panels based on radiation levels
   - Potential rainwater harvesting efficiency based on rainfall data
   - Value of green roof and permeable paving in LST and runoff control

4. **Evaluate environmental integration**:
   - Does the design promote biodiversity? (based on NDVI)
   - How well does the landscape blend with native vegetation?
   - Is stormwater runoff minimized?

5. **Project long-term environmental benefits**:
   - Estimated annual CO₂ savings from solar and insulation
   - Water savings from rainwater harvesting
   - Heat island reduction effects from green roofing and paving

6. **Provide a sustainability rating** (Excellent / Good / Moderate / Low) with reasoning.

7. Prepared by: Green Reaper, date: {datetime.strftime(datetime.today(), "%d-%m-%Y")}

---

📋 **Present your analysis in this HTML format**:

<h2>🌿 Sustainability Analysis Report</h2>

<h3>1. ♻️ Environmental Performance</h3>
<ul>
  <li><strong>Energy Efficiency:</strong> [e.g., Solar, insulation, passive design]</li>
  <li><strong>Water Management:</strong> [e.g., Rainwater harvesting capacity]</li>
  <li><strong>Thermal Comfort:</strong> [e.g., LST offset through shading/green roof]</li>
  <li><strong>Airflow Optimization:</strong> [e.g., Wind-aligned facade for natural cooling]</li>
</ul>

<h3>2. 🧱 Sustainable Materials Assessment</h3>
<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>Material</th>
      <th>Source</th>
      <th>Sustainability Feature</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Recycled Brick</td>
      <td>Eco Brick Tech</td>
      <td>Reused materials, reduces construction waste</td>
    </tr>
    <!-- More rows from materials_list -->
  </tbody>
</table>

<h3>3. 🌞 Renewable & Green Technologies</h3>
<ul>
  <li><strong>Solar Panels:</strong> [e.g., 5kW, with expected output under {geosat_data["solar_radiation"]}]</li>
  <li><strong>Rainwater Harvesting:</strong> [e.g., Potential use from {geosat_data["rainfall"]}]</li>
  <li><strong>Green Roof:</strong> [e.g., Mitigates LST, enhances biodiversity]</li>
  <li><strong>Permeable Paving:</strong> [e.g., Reduces stormwater runoff, improves soil health]</li>
</ul>

<h3>4. 🌱 Landscape & Biodiversity Integration</h3>
<p>
  Analyze the native vegetation, permeability, and connection to NDVI levels ({geosat_data["ndvi"]}). Rate the support for local biodiversity, pollinators, and urban heat mitigation.
</p>

<h3>5. 📈 Long-Term Environmental Benefits</h3>
<ul>
  <li><strong>CO₂ Emissions Offset:</strong> [e.g., kg/year]</li>
  <li><strong>Water Savings:</strong> [litres/year]</li>
  <li><strong>Stormwater Reduction:</strong> [m³/year]</li>
  <li><strong>Urban Heat Reduction:</strong> [qualitative/quantitative]</li>
</ul>

<h3>6. ✅ Final Sustainability Verdict</h3>
<p>
  <strong>Rating:</strong> [Excellent / Good / Moderate / Low] — [justification with data support]
</p>

---

Use the provided JSON material list and GeoSAT data to make your analysis data-driven and precise.
'''

DURABILITY_CONTEXT = f'''
You are a durability analyst for sustainable housing systems. Using only the following dynamically listed sustainability features, architectural materials, and local environmental GeoSAT data, generate a complete durability assessment.

---

🏡 **Project Overview**
- House Type: Modern Sustainable Landed House
- Area: 2000 sq ft
- Wind Direction: {geosat_data["wind_direction"]}
- Climate: Tropical, high heat, solar exposure, and rainfall

---

📍 **Environmental GeoSAT Data**
- LST: {geosat_data["lst"]}
- NDVI: {geosat_data["ndvi"]}
- Solar Radiation: {geosat_data["solar_radiation"]}
- Rainfall Avg: {geosat_data["rainfall"]}
- Wind Speed Avg: {geosat_data["wind_speed"]}

---

🌱 **Sustainability Features (Dynamic Input)**
{description['sustainability_features']}

---

📦 **Materials List**
{json.dumps(building_description['materials_list'], indent=2)}

---

🧠 **Instructions for Durability Analysis**:

1. For each sustainability feature listed, infer:
   - Expected lifespan in tropical outdoor conditions
   - Primary durability risks (e.g., UV, moisture, heat, corrosion)
   - Maintenance or protection required
   - Replacement or inspection cycle

2. Generate a table of **durability ratings** for each feature and key materials (Excellent / Good / Moderate / Low).

3. Provide intelligent **recommendations** for durability improvements using domain knowledge — don't rely on a pre-defined list.

4. Conclude with an **overall durability rating** with justification based on feature resilience and climate compatibility.

---

📋 **Output the report using this HTML format**:

<h2>🔧 Durability Analysis Report</h2>

<h3>1. 🌱 Sustainability Feature Durability</h3>
<table border="1" cellpadding="5" cellspacing="0">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Expected Lifespan</th>
      <th>Durability Rating</th>
      <th>Environmental Risks</th>
      <th>Maintenance/Protection</th>
    </tr>
  </thead>
  <tbody>
    <!-- Gemini fills each row based on the feature name -->
  </tbody>
</table>

<h3>2. 🧱 Material Durability Summary</h3>
<!-- Same structure, apply to key materials -->

<h3>3. 🔄 Maintenance & Replacement Cycle</h3>
<ul>
  <!-- Gemini infers this from the feature name and context -->
  <li><strong>[Feature Name]:</strong> [Inferred replacement or inspection cycle]</li>
</ul>

<h3>4. 🧠 Recommendations</h3>
<ul>
  <li>Smart, AI-inferred suggestions to improve lifespan and reduce maintenance</li>
</ul>

<h3>5. ✅ Final Durability Verdict</h3>
<p>
  <strong>Overall Rating:</strong> [Excellent / Good / Moderate / Low]<br>
  Short justification considering climate stress, feature resilience, and lifespan.
</p>

---

Use your knowledge to infer everything from the feature names and environmental context. Do not assume predefined rules or hardcoded behaviors.
'''

async def run_all():
  results = await asyncio.gather(
        generate(FINANCIAL_CONTEXT),
        generate(SUSTAINABILITY_CONTEXT),
        generate(DURABILITY_CONTEXT)
    )

  for result in results:
      print(result)


asyncio.run(run_all())

#Output list with size 3, finance, sustainability, and durability
