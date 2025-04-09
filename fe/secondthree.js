
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
var data = JSON.parse(`
{
  "houseData": [
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [10, 4, 8]
      },
      "material": {
        "color": "#8B4513"
      },
      "position": [0, 2, 0]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [11, 0.2, 5.385]
      },
      "material": {
        "color": "#A0522D"
      },
      "position": [0, 5, 2],
      "rotation": [-0.3805, 0, 0]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [11, 0.2, 5.385]
      },
      "material": {
        "color": "#A0522D"
      },
      "position": [0, 5, -2],
      "rotation": [0.3805, 0, 0]
    },
    {
       "geometry": {
         "type": "BoxGeometry",
         "args": [2.5, 1.8, 2]
       },
       "material": {
         "color": "#8B4513"
       },
       "position": [0, 5.2, 3.3]
     },
     {
       "geometry": {
         "type": "BoxGeometry",
         "args": [2.8, 0.15, 1.3]
       },
       "material": {
         "color": "#A0522D"
       },
       "position": [0, 6.35, 3.8],
       "rotation": [-0.463, 0, 0]
     },
     {
       "geometry": {
         "type": "BoxGeometry",
         "args": [2.8, 0.15, 1.3]
       },
       "material": {
         "color": "#A0522D"
       },
       "position": [0, 6.35, 2.8],
       "rotation": [0.463, 0, 0]
     },
     {
       "geometry": {
         "type": "BoxGeometry",
         "args": [0.7, 0.9, 0.1]
       },
       "material": {
         "color": "#B0E0E6"
       },
       "position": [-0.6, 5.6, 4.25]
     },
     {
       "geometry": {
         "type": "BoxGeometry",
         "args": [0.7, 0.9, 0.1]
       },
       "material": {
         "color": "#B0E0E6"
       },
       "position": [0.6, 5.6, 4.25]
     },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [1.8, 1.5, 0.1]
      },
      "material": {
        "color": "#B0E0E6"
      },
      "position": [-2.5, 2.5, 4.05]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [1.8, 1.5, 0.1]
      },
      "material": {
        "color": "#B0E0E6"
      },
      "position": [2.5, 2.5, 4.05]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [1.2, 2.2, 0.15]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [0, 1.2, 4.05]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [10, 0.2, 2.5]
      },
      "material": {
        "color": "#C6C0B6"
      },
      "position": [0, 0.1, 5.25]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [10.5, 0.2, 3]
      },
      "material": {
        "color": "#A0522D"
      },
      "position": [0, 3.5, 5.5]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [0.4, 3.3, 0.4]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [-4.5, 1.85, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [0.4, 3.3, 0.4]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [-1.5, 1.85, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [0.4, 3.3, 0.4]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [1.5, 1.85, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [0.4, 3.3, 0.4]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [4.5, 1.85, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [2.8, 0.2, 0.2]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [-3, 1.2, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [2.8, 0.2, 0.2]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [0, 1.2, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [2.8, 0.2, 0.2]
      },
      "material": {
        "color": "#FFFFFF"
      },
      "position": [3, 1.2, 6.3]
    },
    {
      "geometry": {
        "type": "BoxGeometry",
        "args": [2.5, 0.15, 0.4]
      },
      "material": {
        "color": "#C6C0B6"
      },
      "position": [0, 0.075, 6.7]
    }
  ],
  "sustainabilityFeatures": [
    {
      "type": "solarPanels",
      "geometry": {
        "type": "BoxGeometry",
        "args": [7, 0.1, 3]
      },
      "material": {
        "color": "#333333"
      },
      "position": [0, 5.1, 2],
      "rotation": [-0.3805, 0, 0]
    },
    {
      "type": "solarPanels",
      "geometry": {
        "type": "BoxGeometry",
        "args": [7, 0.1, 3]
      },
      "material": {
        "color": "#333333"
      },
      "position": [0, 5.1, -2],
      "rotation": [0.3805, 0, 0]
    },
    {
      "type": "rainwaterHarvestingTank",
      "geometry": {
        "type": "CylinderGeometry",
        "args": [0.6, 0.6, 1.8]
      },
      "material": {
        "color": "#AAAAAA"
      },
      "position": [-5.8, 0.9, -3]
    },
    {
      "type": "rainwaterHarvestingPipe",
      "geometry": {
        "type": "CylinderGeometry",
        "args": [0.05, 0.05, 5.5]
      },
      "material": {
        "color": "#BBBBBB"
      },
      "position": [-5.5, 3.2, -4.5]
    },
    {
      "type": "greenRoof",
      "geometry": {
        "type": "BoxGeometry",
        "args": [10, 0.2, 2.5]
      },
      "material": {
        "color": "#556B2F"
      },
      "position": [0, 3.6, 5.5]
    },
    {
      "type": "nativeLandscaping",
      "geometry": {
        "type": "CylinderGeometry",
        "args": [0.3, 0.3, 0.8]
      },
      "material": {
        "color": "#228B22"
      },
      "position": [-6, 0.4, 2]
    },
    {
      "type": "nativeLandscaping",
      "geometry": {
        "type": "BoxGeometry",
        "args": [0.5, 0.6, 0.5]
      },
      "material": {
        "color": "#90EE90"
      },
      "position": [6, 0.3, 1]
    },
    {
      "type": "compostBin",
      "geometry": {
        "type": "BoxGeometry",
        "args": [0.8, 1, 0.8]
      },
      "material": {
        "color": "#654321"
      },
      "position": [5.5, 0.5, -3.5]
    },
    {
      "type": "passiveCoolingShading",
      "position": [0,0,0],
      "material": { "color": "#FFFFFF"},
      "description": "Achieved through roof overhangs (modeled) and optimal east-west orientation."
    },
    {
      "type": "recycledMaterials",
       "position": [0,0,0],
      "material": { "color": "#FFFFFF"},
      "description": "Use of reclaimed timber cladding (visualized by brown wall material)."
    },
    {
       "type": "highPerformanceInsulation",
        "position": [0,0,0],
       "material": { "color": "#FFFFFF"},
       "description": "Rockwool insulation used within wall and roof cavities (not visually modeled)."
     },
     {
       "type": "lowVOCFinishes",
        "position": [0,0,0],
       "material": { "color": "#FFFFFF"},
       "description": "Low-VOC paints and finishes used throughout interior (not visually modeled)."
     },
     {
       "type": "energyEfficientAppliances",
        "position": [0,0,0],
       "material": { "color": "#FFFFFF"},
       "description": "Specified within the building design (not visually modeled)."
     }
  ]
}
`);

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
