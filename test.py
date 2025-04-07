from google import genai
from google.genai import types
from google.auth import load_credentials_from_file
from google.auth.credentials import Credentials
import base64
import json
import asyncio
import re
import time
import sys
mutex = asyncio.Lock()

#Fixed template
JS_TEMPLATE = '''
// --- Import & Setup Section ---
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ade7ff');
scene.fog = new THREE.Fog('#ade7ff', 50, 150);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, 2, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-20, 30, 30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const scale = 0.2;

// --- House Construction Section (Dynamic) ---
// --- Generate house code here ---

// --- Sustainability Elements Section (Modular & Dynamic) ---
// --- Generate Sustainability Elements here ---

function addSustainabilityFeatures(features = []) {
  features.forEach(f => {
    if (sustainabilityObjects[f.type]) {
      const obj = sustainabilityObjects[f.type]();
      obj.position.set(...f.position.map(p => p * scale));
      scene.add(obj);
    }
  });
}

// --- Animation & Resizing ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Initialization (You Plug Your Data Here) ---
// generateHouseStructure(houseData);
// addSustainabilityFeatures([{ type: 'createGreenRoof', position: [10, 32, 40] }]);
animate();
'''

shared_resource = 0
start = time.time()

# 1st input from server.js 
#input_data = json.load(sys.stdin)

# CONTENT = input_data['building_description']
# if isinstance(input_data['building_description'], str):
#     CONTENT = json.loads(input_data['building_description'])
# else:
#     CONTENT = input_data['building_description']
CONTENT = json.loads('''
{
 "house_description": {
  "house_type": "Landed House",
  "area": "2000 sq ft",
  "house_layout": "Open-plan living area, 3 bedrooms, 2 bathrooms, kitchen, dining area, study, and a small garden.",
  "house_theme": "Modern Sustainable",
  "house_exterior_design": "The exterior will feature a combination of exposed brick (recycled), timber cladding (sustainably sourced), and large, energy-efficient windows. The roof will be a low-pitched green roof planted with native vegetation. A rainwater harvesting system will be integrated into the design, feeding into a storage tank for irrigation and toilet flushing. The facade will incorporate shading elements such as overhangs and vertical louvers to minimize solar heat gain. Permeable paving will be used for driveways and walkways to reduce stormwater runoff.",
  "house_orientation": "Oriented to maximize natural daylight and minimize solar heat gain based on the given wind direction and solar radiation. The primary facade with large windows will face north/south direction (wind direction 70.96°) to capture daylight while minimizing direct sunlight exposure.",
  "sustainability_features": "Green roof, rainwater harvesting system, solar panels for electricity generation, energy-efficient windows and insulation, use of recycled and locally sourced materials, permeable paving, and native landscaping to minimize water consumption.",
  "explicit_textual_illustration": "The house presents a modern aesthetic, characterized by clean lines and a blend of natural materials. Recycled brick forms a sturdy base, complemented by sustainably sourced timber cladding that adds warmth and texture. Large, energy-efficient windows provide ample natural light, reducing the need for artificial lighting. The green roof not only enhances the building's aesthetic appeal but also provides insulation and reduces stormwater runoff. Overhanging eaves and vertical louvers strategically shade the facade, minimizing solar heat gain. The surrounding landscape features native plants, promoting biodiversity and reducing the need for irrigation. The overall design prioritizes sustainability and environmental harmony."
 },
 "materials_list": [
  {
   "material_name": "Reinforced Concrete (Foundation)",
   "material_brand": "Lafarge Malaysia",
   "material_cost_per_unit": "RM 280 per cubic meter",
   "material_total_cost": "RM 8,400 (estimated 30 cubic meters)",
   "website_to_purchase": "https://www.lafarge.com.my/"
  },
  {
   "material_name": "Recycled Brick (Walls)",
   "material_brand": "Eco Brick Tech",
   "material_cost_per_unit": "RM 1.50 per brick",
   "material_total_cost": "RM 15,000 (estimated 10,000 bricks)",
   "website_to_purchase": "https://www.ecobricktech.com/"
  },
  {
   "material_name": "Sustainably Sourced Timber Cladding (Walls)",
   "material_brand": "Malaysian Timber Council Certified",
   "material_cost_per_unit": "RM 150 per square meter",
   "material_total_cost": "RM 9,000 (estimated 60 square meters)",
   "website_to_purchase": "https://mtc.com.my/"
  },
  {
   "material_name": "Green Roof System",
   "material_brand": "G Sky Green Sdn Bhd",
   "material_cost_per_unit": "RM 250 per square meter",
   "material_total_cost": "RM 12,500 (estimated 50 square meters)",
   "website_to_purchase": "https://www.gskygreen.com/"
  },
  {
   "material_name": "Energy-Efficient Windows (Double Glazed)",
   "material_brand": "Viridian Glass",
   "material_cost_per_unit": "RM 400 per square meter",
   "material_total_cost": "RM 8,000 (estimated 20 square meters)",
   "website_to_purchase": "https://www.viridianglass.com/"
  },
  {
   "material_name": "Solar Panels (5kW System)",
   "material_brand": "SunPower",
   "material_cost_per_unit": "RM 3,500 per kW",
   "material_total_cost": "RM 17,500",
   "website_to_purchase": "https://us.sunpower.com/"
  },
  {
   "material_name": "Rainwater Harvesting System",
   "material_brand": "Acqua Rain Solutions",
   "material_cost_per_unit": "RM 5,000 per system",
   "material_total_cost": "RM 5,000",
   "website_to_purchase": "https://www.acquarain.com/"
  },
  {
   "material_name": "Permeable Paving",
   "material_brand": "Bina Eco Solutions",
   "material_cost_per_unit": "RM 80 per square meter",
   "material_total_cost": "RM 4,000 (estimated 50 square meters)",
   "website_to_purchase": "https://www.binaeco.com/"
  },
  {
   "material_name": "Thermal Insulation (Rockwool)",
   "material_brand": "Rockwool Malaysia",
   "material_cost_per_unit": "RM 30 per square meter",
   "material_total_cost": "RM 3,000 (estimated 100 square meters)",
   "website_to_purchase": "https://www.rockwool.com/"
  },
  {
   "material_name": "Interior Paint (Low VOC)",
   "material_brand": "Nippon Paint",
   "material_cost_per_unit": "RM 120 per gallon",
   "material_total_cost": "RM 1,200 (estimated 10 gallons)",
   "website_to_purchase": "https://www.nipponpaint.com.my/"
  }
 ],
 "total_expenditure": "RM 83,600",
 "disclaimer": "The material costs and quantities are estimates and may vary based on market conditions and design specifics. Coordinates are relative to the origin (0,0,0) at Corner 1 of the foundation. All materials mentioned comply with Malaysian Standards."
}''')
description = CONTENT['house_description']
materials = CONTENT['materials_list']

print("Done read content")
context_refined = f"""Project Overview:
- House Type: {description['house_type']}
- Area: {description['area']}
- Theme: {description['house_theme']}
- Layout: {description['house_layout']}

Sustainability Features:
{description['sustainability_features']}

Materials & Brands:
""" + "\n".join([f"- {m['material_name']}: {m['material_brand']}" for m in materials]) + f"""

Estimated Total Cost: {CONTENT['total_expenditure']}
Orientation Strategy: {description['house_orientation']}
Exterior Design Summary: {description['house_exterior_design']}
Design Vision: {description['explicit_textual_illustration']}
"""

PROMPT1 = f'''
You are a world-class 3D architectural modeling LLM specializing in modular and dimensionally accurate sustainable architecture using pure Three.js ES Modules.

Your task is to generate **only** the full `function createHouseStructure() {{ ... }}` definition. Do not include any imports, explanations, or markdown. This function should represent the entire house structure only, excluding any sustainability features.

🎯 Objectives:
Focus only on constructing the house structure (walls, roof, balcony, doors, windows, dormer)
Use modular Three.js functions such as createBox, createRoofPlane, createGableTriangle, and group components logically
Maintain accurate dimensions and proportions, scaled from real-world feet to Three.js units using scale = 0.2
Visually align to the reference image — match facade layout, overhangs, dormer position, balcony, and window spacing
No sustainability features in this phase
Return only the function createHouseStructure() definition and its contents

📐Context:
{context_refined}

🔁 Scale Conversion:
All coordinates and sizes use scale = 0.2 (1 ft = 0.2 Three.js units)
House base: 25 ft x 80 ft → 5 x 16 units
Ground floor height: 10 ft → 2 units
Peak height: 25 ft → 5 units from base

📐 Code Requirements:
- Define function: `function createHouseStructure() {{ ... }}`
- Use only `MeshStandardMaterial` and `MeshPhysicalMaterial`, no textures
- Convert all real-world feet to 3D units using `const SCALE = 0.2` (1 ft = 0.2 units)
- Ensure visual fidelity matches the reference photo (e.g. dormer, low-pitched roof, balcony, gable)
- Include:
  - Foundation
  - Walls (with material distinction)
  - Roof (low-pitched, with slight overhang)
  - Balcony and railings
  - Doors and energy-efficient windows
  - Dormer if present in the image
- Place each element in a logically correct position using scaled measurements
- Group all elements under a parent `THREE.Group()` and return it
- Clean code with meaningful variable names (e.g. `leftWall`, `roofPlaneRight`)
- Do not include lighting, camera, or renderer logic in this function
- Do not include any `markdown` syntax (no ```javascript blocks) important

📦 Expected Output:
- Return a clean, scoped createHouseStructure() function
- Organize grouped components: foundation, walls, roof, dormer, balcony, doors/windows
- No labels, no sustainability components
- Only return JavaScript (ESM-compatible), no HTML, no markdown
- Return without ```javascript```, start with code right away
'''

PROMPT2 = f"""
You are a precision-focused 3D sustainability modeling expert. Your task is to generate only the sustainability components of the house described below using pure Three.js ES Modules.

🎯 Objective:
Your task is to generate only the sustainability components of the house using dimensionally accurate, procedurally generated JavaScript code with pure Three.js (ES Modules). Each feature must be placed logically, scaled to real-world dimensions (1 ft = 0.2 units), and must not intersect or overlap with the main house structure. The output must consist solely of a scoped function definition named `addSustainabilityFeatures(scene)` containing these elements.

🧱 Required Sustainability Elements (based on description + image):
{description['sustainability_features']}

📐 Context:
{context_refined}

📏 Coordinate & Dimension Constraints:
- Use `const scale = 0.2` (1 ft = 0.2 Three.js units)
- Place features using real-world positions where possible
- Avoid overlap with house mesh (e.g., roof slope panels must not clip)
- Place each component in visually logical and distinct areas

🏷️ Labeling Instructions:
- Use only `CSS2DObject` from `three/addons/renderers/CSS2DRenderer.js`
- Attach labels centered at the **top of each sustainable component**
- Label text: “Green Roof”, “Solar Panels”, etc.
- No `TextGeometry` or 3D font labels — HTML only

🧩 Output Requirements:
- Wrap all components inside a single function `function addSustainabilityFeatures(scene) {{ ... }}`
- Use reusable functions like `createLabel()`, `createGreenRoofMesh()`, etc., if needed
- Do not return main house structure or render logic
- Avoid imports, camera, renderer setup, and unrelated logic
- Keep code modular, readable, and scoped for merging with a Three.js scene

📦 Output Format:
- Return only the complete function definition: `function addSustainabilityFeatures(scene) {{ ... }}`
- No imports, no rendering, no lighting, no global variables
- No markdown, comments, or extra explanations
- All features must be logically grouped and added to the `scene`
- Output must be pure, valid JavaScript (ES Module-compatible)
- Do not include any `markdown` syntax (no ```javascript blocks) important
"""



async def generate(context, marker):
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
    top_p = 1,
    seed = 0,
    max_output_tokens = 65535,
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
  )
  
  if marker == "":
    with open("threejs.js", "w", encoding="utf-8") as file:
      text = re.sub(pattern, "", client.models.generate_content(
      model=model,
      contents=contents,
      config=generate_content_config,
      ).text)
      file.write(text)
  else:
    response = client.models.generate_content(
    model=model,
    contents=contents,
    config=generate_content_config,
    )
    response = response.text if hasattr(response, "text") else str(response)
    response = re.sub(pattern, "", response)
    async with mutex:
      global JS_TEMPLATE
      JS_TEMPLATE = re.sub(marker, response, JS_TEMPLATE)
  
  print(f"{marker} done.")



async def run_all():
    await asyncio.gather(
        generate(PROMPT1, "// --- Generate house code here ---"),
        generate(PROMPT2, "// --- Generate Sustainability Elements here ---")
    )
    code = JS_TEMPLATE
    PROMPT3 = f"""
      You are a world-class 3D architecture code optimizer and integration expert. Your task is to review, correct, and refine the combined JavaScript Three.js code generated from two prior models:

      - `createHouseStructure()` – handles house geometry (walls, roof, windows, balcony)
      - `addSustainabilityFeatures(scene)` – places green components like green roof, solar panels, rainwater tank, etc.

      🎯 Objective:
      Transform the code into a complete, modular, fully working Three.js application in a single browser-executable ES Module. Start with exactly three import lines, include everything from scene setup to animation loop.

      📐 Context Summary:
      {context_refined}

      📦 Original Combined Code to Integrate:
      {code}

      ✅ Code Output Must Start With (exactly this block):
      // --- Import & Setup Section ---
      import * as THREE from 'three';
      import {{ OrbitControls }} from 'three/addons/controls/OrbitControls.js';
      import {{ CSS2DRenderer, CSS2DObject }} from 'three/addons/renderers/CSS2DRenderer.js';

      📦 Output Requirements:
      - Do NOT include any other import or export statement
      - Combine `createHouseStructure()` and `addSustainabilityFeatures()` into one file
      - Automatically call these functions and add results to the scene
      - Set up scene, camera, OrbitControls, WebGLRenderer, and CSS2DRenderer
      - Configure ambient light and directional light with shadows
      - Add window resize handling
      - Include `animate()` function with `requestAnimationFrame` loop

      🧠 Integration Guidelines:
      - `scale = 0.2` must be used consistently for all real-world to 3D unit conversion
      - Group all geometry using `THREE.Group()` for better structure
      - Place sustainability features logically (no clipping, proper alignment)
      - Use `CSS2DObject` to add clean, readable labels above each sustainability feature
      - Labels must float naturally just above the object and not overlap
      - Camera should show a good view of the full house at load time
      - Set `renderer.shadowMap.enabled = true` for lighting realism

      🚫 Do NOT Include:
      - HTML
      - `export` or `import` beyond the three provided
      - Markdown code fences like ```javascript
      - Any placeholder or instructional text

      🎯 Final Output:
      Return only valid browser-runnable JavaScript (ES module format)
      Start code immediately after the given import lines
      Ensure this code is fully functional when run in a browser with `<script type="module">`
      """


    await generate(PROMPT3, "")  # run only after both are done

asyncio.run(run_all())

end = time.time()
print(f"Time taken = {start - end}")

#Output threejs.js file which will be runned on browser