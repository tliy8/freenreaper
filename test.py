from google import genai
from google.genai import types
from google.auth import load_credentials_from_file
from google.auth.credentials import Credentials
import base64
import json
import asyncio
import re
import time

mutex = asyncio.Lock()

shared_resource = 0
start = time.time()

JS_TEMPLATE = '''
// --- Import & Setup Section ---
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';



const scene = new THREE.Scene();
scene.background = new THREE.Color('#ade7ff');
scene.fog = new THREE.Fog('#ade7ff', 50, 150);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
document.getElementById('threejs-container').appendChild(renderer.domElement);


const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // Ensure OrbitControls still work
document.getElementById('threejs-container').appendChild(labelRenderer.domElement);

const container = document.getElementById('threejs-container');
const width = container.clientWidth;
const height = container.clientHeight;

renderer.setSize(width, height);
labelRenderer.setSize(width, height);

camera.aspect = width / height;
camera.updateProjectionMatrix();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 5;
controls.maxDistance = 100;
controls.target.set(0, 2, 0);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-20, 30, 30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
scene.add(directionalLight);

// --- Groups & Scaling ---
const scale = 1;
const houseGroup = new THREE.Group();
const sustainabilityGroup = new THREE.Group();
scene.add(houseGroup);
scene.add(sustainabilityGroup);

// --- House Construction Section (Modular) ---
function generateHouseStructure(houseData = []) {
  houseGroup.clear();

  houseData.forEach(component => {
    const { geometry, material, position } = component;
    const { type, args } = geometry;

    const geom = new THREE[type](...args.map(arg => arg * scale)); // scaled geometry

    const mat = new THREE.MeshStandardMaterial({
      ...material,
      color: new THREE.Color(material.color)
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const [x, y, z] = position.map(p => p * scale);
    mesh.position.set(x, y, z);

    houseGroup.add(mesh);
  });
}


function addSustainabilityFeatures(features = []) {
  features.forEach((feature, index) => {
    const { type, position, geometry, material, rotation } = feature;
    let mesh;

    try {
      // Use provided geometry if available
      if (geometry && geometry.type && geometry.args) {
        const geom = new THREE[geometry.type](...geometry.args.map(a => a * scale));
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(material.color) });
        mesh = new THREE.Mesh(geom, mat);
      } else {
        // If no geometry is provided, use a small default box
        const geom = new THREE.BoxGeometry(0.2 * scale, 0.2 * scale, 0.2 * scale);
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(material.color) });
        mesh = new THREE.Mesh(geom, mat);
      }

      // Apply position
      const [x, y, z] = position.map(p => p * scale);
      mesh.position.set(x, y, z);

      // Apply rotation if provided
      if (rotation && rotation.length === 3) {
        mesh.rotation.set(...rotation);
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // --- Create label ---
      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = type;
      labelDiv.style.marginTop = '-1em';
      labelDiv.style.fontSize = '0.75em';
      labelDiv.style.padding = '2px 6px';
      labelDiv.style.background = 'rgba(255,255,255,0.8)';
      labelDiv.style.borderRadius = '4px';

      const label = new CSS2DObject(labelDiv);
      label.position.set(0, 0.3 * scale, 0); // offset slightly above mesh
      mesh.add(label);

      scene.add(mesh);
    } catch (err) {
      console.error(`❌ Error rendering sustainability feature #${index} (type: ${type})`, err);
    }
  });
}



// --- Animation Loop ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// --- Initialization ---
var data = JSON.parse(`replace here`);

document.getElementById('threejs-modal').addEventListener('shown.bs.modal', () => {
  const container = document.getElementById('threejs-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  console.log(sustainabilityFeatures);
});

document.getElementById('close-btn').addEventListener('click', () => {
  controls.reset();
});

document.getElementById('rotate-btn').addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
});

var houseData = data['houseData'];
var sustainabilityFeatures = data['sustainabilityFeatures'];


generateHouseStructure(houseData);
addSustainabilityFeatures(sustainabilityFeatures);
const box = new THREE.Box3().setFromObject(scene);
const size = box.getSize(new THREE.Vector3()).length();
const center = box.getCenter(new THREE.Vector3());

camera.position.copy(center.clone().add(new THREE.Vector3(size * 0.6, size * 0.4, size * 0.6)));
controls.target.copy(center);
camera.lookAt(center);
animate();
'''

# 1st input from server.js 
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


PROMPT = f'''
You are a 3D architectural modeling assistant. I am creating a modular 3D model of a classic craftsman-style bungalow using Three.js. Your task is to generate a JSON structure that I can use directly in my scene.

Context :
{context_refined}

Output only a JSON object in this format:
{{
 "houseData": [...],
 "sustainabilityFeatures": [...]
}}

---

## HOUSE STRUCTURE

"houseData" must be an array of modular components. Each object must contain:

- "geometry": {{
  "type": (e.g., "BoxGeometry", "CylinderGeometry"),
  "args": [width, height, depth] in meters
 }}
- "material": {{
  "color": string — hex code for realistic architecture colors
 }}
- "position": [x, y, z] in meters — aligned to form a realistic, stackable house
- Optional: "rotation": [x, y, z] in radians, if needed for roof slope

### Architectural Requirements:
- 10m wide × 4m tall × 8m deep base
- Gabled roof with two visible slopes
- Dormer centered on front roof slope with its own mini roof and two vertical windows
- 2 window sets on the front facade (left and right of door)
- Covered front porch:
 - Floor slab and roof
 - Railings across front edge
 - 4 equally spaced columns
 - Steps leading to ground

Use **BoxGeometry** for walls, dormer, roof, and porch parts. Use **real-world alignment** to avoid floating parts. Materials:
- Walls: dark grey (#4A4A4A) or brown (#8B4513)
- Trim, columns, and railing: white (#FFFFFF)
- Roof: brown (#A0522D) or dark grey (#555555)

---

## SUSTAINABILITY FEATURES

"sustainabilityFeatures" must include green building elements, accurately placed and visually integrated with the home. These must include:
{description['sustainability_features']}

Each object must include:
- "type": string name (e.g., "solarPanels", "nativeLandscaping")
- "position": [x, y, z] in meters
- "material": {{
  "color": string — hex code for realistic environmental colors
 }}
- Optional: "geometry": {{
  "type": string (e.g., "BoxGeometry", "CylinderGeometry"),
  "args": array of [w, h, d] in meters
 }}
- Optional: "rotation": [x, y, z] in radians (e.g., sloped panel)

### Placement Rules:
- Solar panels should sit on angled roof surfaces
- Green roof sits on flat roofs (e.g., porch or dormer)
- Native plants and compost bin on ground only
- All features should be logically placed with no overlapping or floating
- Proportions should match real-world scale (e.g., compost bin < 1m³)

---

## JSON OUTPUT RULES

- Return valid, parsable JSON
- No markdown, explanation, or comments
- Geometry must be usable directly with Three.js and scale = 0.2
'''



async def generate(context, pictures):
  pattern = re.compile(r"(replace here)")
  pattern2 = re.compile(r"(```json)|(```)")
  credentials, project_id = load_credentials_from_file(
        r"C:/Users/agmen/OneDrive/桌面/khack/GreenReaper/green-reaper.json", 
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
  )
  client = genai.Client(
      credentials=credentials,
      vertexai=True,
      project="green-reaper",
      location="us-central1",
  )

  print("cooking")
  model = "gemini-2.5-pro-preview-03-25"
  contents = [
    types.Content(
      role="user",
      parts=[
      types.Part(text=context),
      ] + pictures
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
  
  with open("secondthree.js", "w", encoding="utf-8") as file:
      text = re.sub(pattern2, "", client.models.generate_content(
      model=model,
      contents=contents,
      config=generate_content_config,
      ).text)
      file.write(re.sub(pattern, text, JS_TEMPLATE))

#input picture here
pictures = []
with open("Final/f_view.jpg", "rb") as img_file:
    pictures.append(types.Part.from_bytes(mime_type="image/jpeg", data = base64.b64encode(img_file.read()).decode('utf-8')))


asyncio.run(generate(PROMPT,pictures)) 


end = time.time()
print(f"Time taken = {start - end}")

#Output secondthree.js file which will be runned on browser