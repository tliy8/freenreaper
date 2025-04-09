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
import json
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
input_data = json.load(sys.stdin)
building_description = input_data['building_description']
if isinstance(input_data['building_description'], str):
    building_description = json.loads(input_data['building_description'])
else:
    building_description = input_data['building_description']

CONTENT=building_description['house_description']
# 1st input from server.js 

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
with open("fe/Final/f_view.jpg", "rb") as img_file:
    pictures.append(types.Part.from_bytes(mime_type="image/jpeg", data = base64.b64encode(img_file.read()).decode('utf-8')))


asyncio.run(generate(PROMPT,pictures)) 


end = time.time()
print(f"Time taken = {start - end}")

#Output secondthree.js file which will be runned on browser