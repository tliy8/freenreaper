
// --- Import & Setup Section ---
import *;//code:START

// --- Import & Setup Section ---
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- Constants ---
const scale = 0.2; // Global scale factor (1 ft = 0.2 units)
const houseDimensions = { // Base dimensions in scaled units
    width: 35 * scale,   // X-axis
    depth: 40 * scale,   // Z-axis
    wallHeight: 12 * scale, // From foundation top to eave
    foundationHeight: 1 * scale,
    peakY: 22 * scale,    // Total height from ground (y=0)
    overhang: 1.5 * scale,
    wallThickness: 0.5 * scale,
    platformWidth: 45 * scale,
    platformDepth: 50 * scale,
};
houseDimensions.roofHeight = houseDimensions.peakY - (houseDimensions.foundationHeight + houseDimensions.wallHeight);
houseDimensions.baseOffsetY = houseDimensions.foundationHeight; // Y offset for elements placed on foundation top
houseDimensions.roofEaveY = houseDimensions.baseOffsetY + houseDimensions.wallHeight; // Y coordinate of the eaves


// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ade7ff');
scene.fog = new THREE.Fog('#ade7ff', 50, 150);

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(houseDimensions.platformWidth * 1.2, houseDimensions.peakY * 1.5, houseDimensions.platformDepth * 1.2); // Adjusted initial view

// --- Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
document.body.appendChild(renderer.domElement);

// --- Label Renderer Setup ---
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // Make labels non-interactive by default
document.body.appendChild(labelRenderer.domElement);

// --- Controls Setup ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1;
controls.target.set(0, houseDimensions.wallHeight / 2, 0); // Target center of the house structure
controls.update(); // Initial update

// --- Lighting Setup ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(-30, 40, 50); // Adjusted angle for better shadows
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// Define shadow camera frustum to enclose the scene objects
const shadowCamSize = 30;
directionalLight.shadow.camera.left = -shadowCamSize;
directionalLight.shadow.camera.right = shadowCamSize;
directionalLight.shadow.camera.top = shadowCamSize;
directionalLight.shadow.camera.bottom = -shadowCamSize;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
scene.add(directionalLight);
// scene.add(new THREE.CameraHelper(directionalLight.shadow.camera)); // Optional: Visualize shadow frustum

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x99cc77, roughness: 1.0, metalness: 0.0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true; // Ground receives shadows
scene.add(ground);


// === HELPER FUNCTIONS ===

// Helper function for creating boxes with shadows and optional UV scaling
const createBox = (w, h, d, mat, name = '') => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (name) mesh.name = name;

    // Simple UV scaling example (adjust if textures are used)
    // const uvAttribute = geo.attributes.uv;
    // for (let i = 0; i < uvAttribute.count; i++) {
    //     const u = uvAttribute.getX(i);
    //     const v = uvAttribute.getY(i);
    //     // Example scaling, adjust based on face and texture aspect
    //     uvAttribute.setXY(i, u * w, v * h); // This is a basic scaling, might need more complex mapping
    // }
    // geo.attributes.uv.needsUpdate = true;

    return mesh;
};

// Helper Function for CSS2D Labels
function createLabel(text, textClass = 'sustainability-label') {
    const div = document.createElement('div');
    div.className = textClass;
    div.textContent = text;
    // Basic styles can be defined in CSS (recommended) or inline
    div.style.marginTop = '-1em';
    div.style.padding = '3px 6px';
    div.style.color = '#fff'; // White text
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
    div.style.borderRadius = '4px';
    div.style.fontSize = '10px';
    div.style.fontFamily = 'sans-serif';
    div.style.textAlign = 'center';
    div.style.whiteSpace = 'nowrap'; // Prevent wrapping

    const label = new CSS2DObject(div);
    label.center.set(0.5, 1.0); // Center horizontally, anchor at top center of the target position
    return label;
}


// === HOUSE STRUCTURE CREATION ===

function createHouseStructure() {
    const houseGroup = new THREE.Group();
    houseGroup.name = "HouseStructure";

    // Use dimensions from the global object
    const {
        width: houseWidth,
        depth: houseDepth,
        wallHeight,
        foundationHeight,
        peakY,
        roofHeight,
        overhang,
        wallThickness,
        platformWidth,
        platformDepth,
        baseOffsetY,
        roofEaveY
    } = houseDimensions;

    // Materials
    const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, metalness: 0.1, name: "FoundationMat (Lafarge)" });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xb29a84, roughness: 0.8, metalness: 0.1, name: "WallMat (Eco Brick Tech)" }); // Recycled Brick color
    const claddingMaterial = new THREE.MeshStandardMaterial({ color: 0xab8f7a, roughness: 0.6, metalness: 0.0, name: "CladdingMat (MTC Timber)" }); // Timber Cladding color
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.1, name: "RoofMatBase" });
    const windowGlassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xaaccff, // Slight blue tint
        transmission: 0.9,
        roughness: 0.1,
        thickness: 0.1 * scale, // Scaled thickness for realistic refraction
        metalness: 0.05,
        transparent: true,
        opacity: 0.85, // Make slightly less opaque for visual clarity
        name: "WindowGlass (Viridian)"
    });
    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.1, name: "WindowFrame" });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7, metalness: 0.0, name: "DoorMat" }); // Brown
    const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.2, name: "RailingMat" });
    const lowVOCPaintMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0e6, roughness: 0.9, name: "InteriorPaint (Nippon Low VOC)" }); // Off-white for interior hints if needed

    // --- Foundation ---
    const foundationGroup = new THREE.Group();
    foundationGroup.name = "FoundationGroup";
    const platform = createBox(platformWidth, foundationHeight, platformDepth, foundationMaterial, "Platform");
    platform.position.y = foundationHeight / 2;
    foundationGroup.add(platform);

    // Steps
    const stepWidth = 8 * scale;
    const stepHeight = foundationHeight / 3; // Distribute height over 3 steps
    const stepDepthIncrement = 1 * scale; // How much deeper each step is than the one above
    const stepCount = 3;
    for (let i = 0; i < stepCount; i++) {
        const currentStepHeight = stepHeight;
        const currentStepDepth = stepDepthIncrement * (i + 1);
        const step = createBox(stepWidth, currentStepHeight, currentStepDepth, foundationMaterial, `Step${i}`);
        step.position.set(
            0,
            foundationHeight - (i * stepHeight) - currentStepHeight / 2, // Y pos of step center, starting from top down
            platformDepth / 2 + currentStepDepth / 2 // Z pos, extending from platform edge
        );
        foundationGroup.add(step);
    }
    houseGroup.add(foundationGroup);

    // --- Walls ---
    const wallsGroup = new THREE.Group();
    wallsGroup.name = "WallsGroup";

    const wallOuterX = houseWidth / 2;
    const wallOuterZ = houseDepth / 2;
    const wallInnerX = wallOuterX - wallThickness;
    const wallInnerZ = wallOuterZ - wallThickness;
    const wallY = baseOffsetY + wallHeight / 2;

    // Using CSG or Booleans is complex, modeling as separate pieces:
    // Front Wall Sections (allowing for door/window subtraction later conceptually)
    const frontWall = createBox(houseWidth, wallHeight, wallThickness, wallMaterial, "FrontWallBase");
    frontWall.position.set(0, wallY, wallOuterZ - wallThickness / 2);
    wallsGroup.add(frontWall);

    const backWall = createBox(houseWidth, wallHeight, wallThickness, wallMaterial, "BackWallBase");
    backWall.position.set(0, wallY, -wallOuterZ + wallThickness / 2);
    wallsGroup.add(backWall);

    const sideWallDepthAdjusted = houseDepth - 2 * wallThickness; // Inner depth between front/back walls
    const leftWall = createBox(wallThickness, wallHeight, sideWallDepthAdjusted, wallMaterial, "LeftWallBase");
    leftWall.position.set(-wallInnerX - wallThickness / 2, wallY, 0); // Positioned correctly between inner edges
    wallsGroup.add(leftWall);

    const rightWall = createBox(wallThickness, wallHeight, sideWallDepthAdjusted, wallMaterial, "RightWallBase");
    rightWall.position.set(wallInnerX + wallThickness / 2, wallY, 0);
    wallsGroup.add(rightWall);


    // --- Cladding Section (Front Upper Left - Balcony Area) ---
    const claddingWidth = 12 * scale;
    const claddingHeight = wallHeight * 0.6;
    const claddingDepth = wallThickness * 0.15; // Slightly thicker for visibility
    const claddingY = baseOffsetY + wallHeight - claddingHeight/2;
    const claddingX = -wallOuterX + claddingWidth / 2; // Position on left outer side
    const claddingZ = wallOuterZ - wallThickness/2 + claddingDepth / 2; // On top of front wall

    const claddingBase = createBox(claddingWidth, claddingHeight, claddingDepth, claddingMaterial, "FrontCladdingLeftBase");
    claddingBase.position.set(claddingX, claddingY, claddingZ);
    wallsGroup.add(claddingBase);

    const stripWidth = 0.2 * scale;
    const stripSpacing = 0.3 * scale; // Adjusted spacing
    const stripCount = Math.floor(claddingWidth / (stripWidth + stripSpacing));
    const totalStripWidth = stripCount * (stripWidth + stripSpacing) - stripSpacing;
    const stripStartX = claddingX - totalStripWidth / 2 + stripWidth / 2;

    for(let i = 0; i < stripCount; i++) {
        const strip = createBox(stripWidth, claddingHeight, claddingDepth * 1.2, claddingMaterial, `CladdingStrip${i}`); // Slightly proud strips
        strip.position.set(
            stripStartX + i * (stripWidth + stripSpacing),
            claddingY,
            claddingZ + claddingDepth * 0.1 // Move slightly forward
        );
         wallsGroup.add(strip);
    }

    // --- Gables ---
    const gableHeight = roofHeight;
    const frontGableShape = new THREE.Shape();
    frontGableShape.moveTo(-houseWidth / 2, 0);
    frontGableShape.lineTo(houseWidth / 2, 0);
    frontGableShape.lineTo(0, gableHeight);
    frontGableShape.lineTo(-houseWidth / 2, 0);

    const gableExtrudeSettings = { depth: wallThickness, bevelEnabled: false };

    // Front Gable
    const frontGableGeo = new THREE.ExtrudeGeometry(frontGableShape, gableExtrudeSettings);
    // Apply cladding material to the front face, wall material to sides/back
    const frontGable = new THREE.Mesh(frontGableGeo, [wallMaterial, claddingMaterial]); // Index 1 (materialIndex=1) for forward face
    frontGableGeo.computeVertexNormals(); // Needed for lighting on extruded shapes
    // Assign material index (assuming default extrusion face order: sides, front, back)
    // Typically, the front extruded face has materialIndex 1
    frontGableGeo.groups.forEach(group => {
        if (Math.abs(group.normal.z - 1) < 0.1) { // Check if normal faces +Z (approximately)
            group.materialIndex = 1;
        } else {
            group.materialIndex = 0;
        }
    });
    frontGable.position.set(0, roofEaveY, wallOuterZ - wallThickness); // Position against inner edge of front wall
    frontGable.name = "FrontGableCladding";
    wallsGroup.add(frontGable);

    // Back Gable
    const backGableGeo = new THREE.ExtrudeGeometry(frontGableShape, gableExtrudeSettings);
    const backGable = new THREE.Mesh(backGableGeo, wallMaterial); // Use regular wall material
    backGable.position.set(0, roofEaveY, -wallOuterZ); // Position against inner edge of back wall
    backGable.rotation.y = Math.PI; // Rotate mesh to face outward
    backGable.name = "BackGableWall";
    wallsGroup.add(backGable);

    houseGroup.add(wallsGroup);

    // --- Roof ---
    const roofGroup = new THREE.Group();
    roofGroup.name = "RoofGroup";

    const roofPitchAngle = Math.atan2(roofHeight, houseWidth / 2);
    const roofPlaneSlopeLength = Math.sqrt(Math.pow(houseWidth / 2 + overhang, 2) + Math.pow(roofHeight, 2)); // Correct length along slope including overhang
    const roofPlaneWidth = houseDepth + 2 * overhang; // Width along Z axis including overhangs
    const roofThickness = 0.4 * scale;

    // Create planes flat first, then position and rotate
    const roofPlaneGeo = new THREE.BoxGeometry(roofPlaneSlopeLength, roofThickness, roofPlaneWidth);

    // Left Roof Plane
    const roofPlaneLeftMesh = new THREE.Mesh(roofPlaneGeo, roofMaterial);
    roofPlaneLeftMesh.name = "RoofLeft";
    // Position the mesh center correctly before rotation
    // Center X needs to be halfway along the slope, starting from center line x=0 out to the overhang edge
    const midSlopeX_Left = -(houseWidth / 4 + overhang / 2);
    // Center Y needs to be halfway between eave and peak heights
    const midSlopeY = roofEaveY + roofHeight / 2;
    roofPlaneLeftMesh.position.set(midSlopeX_Left, midSlopeY, 0); // Z=0 (centered along house depth)
    // Rotation: Rotate around the Z-axis
    roofPlaneLeftMesh.rotation.z = roofPitchAngle;
    roofGroup.add(roofPlaneLeftMesh);

    // Right Roof Plane
    const roofPlaneRightMesh = new THREE.Mesh(roofPlaneGeo, roofMaterial);
    roofPlaneRightMesh.name = "RoofRight";
    const midSlopeX_Right = houseWidth / 4 + overhang / 2;
    roofPlaneRightMesh.position.set(midSlopeX_Right, midSlopeY, 0);
    roofPlaneRightMesh.rotation.z = -roofPitchAngle; // Opposite angle
    roofGroup.add(roofPlaneRightMesh);

    houseGroup.add(roofGroup);


    // --- Dormer --- (Large box sitting centered on the roof ridge)
    const dormerGroup = new THREE.Group();
    dormerGroup.name = "DormerGroup";
    const dormerWidth = 15 * scale;
    const dormerVisualHeight = 5 * scale;
    const dormerDepth = 10 * scale;
    const dormerRoofThickness = 0.3 * scale;
    const dormerWallHeight = dormerVisualHeight; // Total includes structure height under roof

    // Approximate Y placement to sit nicely on the roof slope near the peak
    // Find Y on roof slope at +/- dormerWidth/2
    const yAtDormerEdge = roofEaveY + Math.tan(roofPitchAngle) * (houseWidth / 2 - dormerWidth / 2);
    // Average height over the dormer footprint
    const dormerBaseY = (peakY + yAtDormerEdge) / 2 + 0.1*scale; // Slightly adjust up
    const dormerCenterY = dormerBaseY + dormerWallHeight / 2;

    // Dormer Walls Box
    const dormerWalls = createBox(dormerWidth, dormerWallHeight, dormerDepth, wallMaterial, "DormerWalls");
    dormerWalls.position.set(0, dormerCenterY, 0);
    dormerGroup.add(dormerWalls);

    // Dormer Roof (Flat)
    const dormerRoofOverhang = 0.5 * scale;
    const dormerRoof = createBox(
        dormerWidth + 2 * dormerRoofOverhang,
        dormerRoofThickness,
        dormerDepth + 2 * dormerRoofOverhang,
        roofMaterial, "DormerRoof"
    );
    dormerRoof.position.set(0, dormerCenterY + dormerWallHeight / 2 + dormerRoofThickness / 2, 0);
    dormerGroup.add(dormerRoof);

    // Dormer Window (on front face Z+)
    const dormerWinWidth = dormerWidth * 0.8;
    const dormerWinHeight = dormerWallHeight * 0.4;
    const winFrameThickness = 0.1 * scale;
    const winDepth = wallThickness * 1.1; // Consistent window depth
    const dormerWinPosX = 0;
    const dormerWinPosY = dormerCenterY; // Vertically centered on wall
    const dormerWinPosZ = dormerDepth / 2 + winDepth / 2; // Place proud on front face

    const dormerWindowFrame = createBox(dormerWinWidth, dormerWinHeight, winDepth, windowFrameMaterial, "DormerWindowFrame");
    dormerWindowFrame.position.set(dormerWinPosX, dormerWinPosY, dormerWinPosZ);
    dormerGroup.add(dormerWindowFrame);

    const dormerWindowGlass = createBox(dormerWinWidth - 2 * winFrameThickness, dormerWinHeight - 2 * winFrameThickness, winDepth * 0.5, windowGlassMaterial, "DormerWindowGlass");
    dormerWindowGlass.position.set(dormerWinPosX, dormerWinPosY, dormerWinPosZ + winDepth * 0.25); // Inset glass
    dormerGroup.add(dormerWindowGlass);

    houseGroup.add(dormerGroup);


    // --- Balcony --- (Front Left)
    const balconyGroup = new THREE.Group();
    balconyGroup.name = "BalconyGroup";
    const balconyWidth = 12 * scale; // Matches cladding width
    const balconyDepth = 4 * scale;
    const balconyFloorThickness = 0.3 * scale; // Thinner floor
    const railingHeight = 3 * scale;
    const railingThickness = 0.2 * scale;

    // Balcony Floor
    const balconyFloor = createBox(balconyWidth, balconyFloorThickness, balconyDepth, claddingMaterial, "BalconyFloor"); // Match cladding
    const balconyY = roofEaveY - balconyFloorThickness / 2; // Align top of floor with eave
    const balconyX = -wallOuterX + balconyWidth / 2; // Align with cladding X
    const balconyZ = wallOuterZ + balconyDepth / 2 - wallThickness / 2; // Project forward from wall plane
    balconyFloor.position.set(balconyX, balconyY, balconyZ);
    balconyGroup.add(balconyFloor);

    // Balcony Railing
    const railBaseY = balconyY + balconyFloorThickness / 2;
    const railCenterY = railBaseY + railingHeight / 2;

    // Front Railing
    const frontRailing = createBox(balconyWidth, railingHeight, railingThickness, railingMaterial, "BalconyFrontRail");
    frontRailing.position.set(balconyX, railCenterY, balconyZ + balconyDepth / 2 - railingThickness / 2);
    balconyGroup.add(frontRailing);

    // Side Railing (Right side of balcony from front view)
    const sideRailDepthAdjusted = balconyDepth - railingThickness; // Account for front rail thickness
    const sideRailing = createBox(railingThickness, railingHeight, sideRailDepthAdjusted, railingMaterial, "BalconySideRail");
    sideRailing.position.set(
        balconyX + balconyWidth / 2 - railingThickness / 2, // Outer X edge
        railCenterY,
        balconyZ - railingThickness / 2 // Centered along depth, adjusted
    );
    balconyGroup.add(sideRailing);

    houseGroup.add(balconyGroup);


    // --- Doors & Windows ---
    const openingsGroup = new THREE.Group();
    openingsGroup.name = "OpeningsGroup";

    const winFrameThickness = 0.1 * scale;
    const winDepth = wallThickness * 1.1; // Slightly proud
    const glassDepth = winDepth * 0.5;
    const glassOffsetZ = winDepth * 0.25; // Inset glass from frame front
    const glassOffsetX = winDepth * 0.25; // Inset glass for side windows

    // Helper to create window unit (Frame + Glass) for Front/Back walls
    const createWindow = (w, h, posX, posY, posZ, namePrefix) => {
        const frame = createBox(w, h, winDepth, windowFrameMaterial, `${namePrefix}Frame`);
        frame.position.set(posX, posY, posZ);
        openingsGroup.add(frame);

        const glass = createBox(w - 2 * winFrameThickness, h - 2 * winFrameThickness, glassDepth, windowGlassMaterial, `${namePrefix}Glass`);
        glass.position.set(posX, posY, posZ + glassOffsetZ); // Inset glass along Z
        openingsGroup.add(glass);
    };

    // Helper to create window unit for Side walls (Swapped W/D)
    const createSideWindow = (w, h, posX, posY, posZ, namePrefix) => { // w is depth(Z), winDepth is width(X)
        const frame = createBox(winDepth, h, w, windowFrameMaterial, `${namePrefix}Frame`);
        frame.position.set(posX, posY, posZ);
        openingsGroup.add(frame);

        const glass = createBox(glassDepth, h - 2 * winFrameThickness, w - 2 * winFrameThickness, windowGlassMaterial, `${namePrefix}Glass`);
        glass.position.set(posX + glassOffsetX, posY, posZ); // Inset glass along X
        openingsGroup.add(glass);
    };

    // Front Door (Right of center)
    const doorWidth = 3 * scale;
    const doorHeight = 7 * scale;
    const doorPosX = houseWidth * 0.2;
    const doorPosY = baseOffsetY + doorHeight / 2;
    const doorPosZ = wallOuterZ - wallThickness / 2 + winDepth / 2; // On front wall surface

    const doorFrame = createBox(doorWidth + 2*winFrameThickness, doorHeight + winFrameThickness, winDepth, windowFrameMaterial, "FrontDoorFrame");
    doorFrame.position.set(doorPosX, doorPosY + winFrameThickness/2, doorPosZ - winDepth*0.1);
    openingsGroup.add(doorFrame);
    const doorLeaf = createBox(doorWidth, doorHeight, winDepth * 0.8, doorMaterial, "FrontDoorLeaf");
    doorLeaf.position.set(doorPosX, doorPosY, doorPosZ);
    openingsGroup.add(doorLeaf);

    // Front Window (Ground Left - Square)
    const winGLWidth = 4 * scale;
    const winGLHeight = 4 * scale;
    const winGLPosX = -houseWidth * 0.3;
    const winGLPosY = baseOffsetY + 6 * scale; // Center Y = 1.4
    const winGLPosZ = wallOuterZ - wallThickness / 2 + winDepth / 2;
    createWindow(winGLWidth, winGLHeight, winGLPosX, winGLPosY, winGLPosZ, "WinGroundLeft");

    // Front Window (Upper Right - Horizontal Rectangle) - Above Door
    const winURWidth = 6 * scale;
    const winURHeight = 2 * scale;
    const winURPosX = doorPosX; // Align X with door
    const winURPosY = roofEaveY - winURHeight * 1.5; // Below eave, above door
    const winURPosZ = wallOuterZ - wallThickness / 2 + winDepth / 2;
    createWindow(winURWidth, winURHeight, winURPosX, winURPosY, winURPosZ, "WinUpperRight");

    // Side Window (Right Wall - Long Horizontal Rectangle)
    const winSRWidth = 8 * scale; // Depth along Z for side wall
    const winSRHeight = 2.5 * scale;
    const winSRPosX = wallOuterX - wallThickness / 2 + winDepth / 2; // On surface of right wall
    const winSRPosY = baseOffsetY + 6 * scale; // Match ground left height
    const winSRPosZ = -houseDepth * 0.1; // Towards back from center
    createSideWindow(winSRWidth, winSRHeight, winSRPosX, winSRPosY, winSRPosZ, "WinSideRight");

    // Gable Window (Front - Large Rectangle)
    const winGFWidth = 10 * scale;
    const winGFHeight = 4 * scale; // Needs to fit within gable triangle
    const winGFPosX = 0; // Centered X
    const winGFPosY = roofEaveY + gableHeight * 0.55; // Center Y adjusted slightly high in gable
    const winGFPosZ = wallOuterZ - wallThickness + wallThickness * 0.1 + winDepth / 2; // On *surface* of gable wall
    createWindow(winGFWidth, winGFHeight, winGFPosX, winGFPosY, winGFPosZ, "WinGableFront");

    houseGroup.add(openingsGroup);


    // Add Rockwool Insulation (Conceptual - Not visually modeled explicitly)
    houseGroup.userData.insulation = "Rockwool Malaysia";
    houseGroup.userData.windowType = "Double Glazed Energy Efficient (Viridian Glass)";
    houseGroup.userData.paint = "Low VOC (Nippon Paint)";

    return houseGroup;
}


// === SUSTAINABILITY FEATURES ADDITION ===

function addSustainabilityFeatures(scene, houseModel) {
    const sustainabilityGroup = new THREE.Group();
    sustainabilityGroup.name = "SustainabilityFeatures";

    // Get necessary dimensions/positions from the created house model
    const {
        width: houseWidth,
        depth: houseDepth,
        peakY,
        roofHeight,
        roofEaveY,
        overhang
    } = houseDimensions; // Using global dimensions object for consistency

    const labelOffset = 0.3; // Vertical offset for labels above objects


    // --- Green Roof (G Sky Green Sdn Bhd) ---
    // Place on one roof slope, e.g., Right side (+X)
    const greenRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x558B2F, roughness: 0.9, metalness: 0.0, name: "GreenRoof (G Sky)" });
    const roofPitchAngle = Math.atan2(roofHeight, houseWidth / 2);
    const roofPlaneSlopeLength = (houseWidth / 2 + overhang) / Math.cos(roofPitchAngle); // Includes overhang
    const greenRoofWidthOnSlope = roofPlaneSlopeLength * 0.9; // Cover 90% of slope length
    const greenRoofLength = houseDepth + 2 * overhang; // Full depth
    const greenRoofThickness = 0.6 * scale;

    const greenRoofGeometry = new THREE.BoxGeometry(greenRoofWidthOnSlope, greenRoofThickness, greenRoofLength);
    const greenRoofMesh = new THREE.Mesh(greenRoofGeometry, greenRoofMaterial);
    greenRoofMesh.castShadow = true;
    greenRoofMesh.receiveShadow = true;

    // Position and rotate similar to the main roof plane (Right side)
    const greenRoofMidSlopeX = (houseWidth / 4 + overhang * 0.5) * 0.95; // Positioned slightly up the slope center
    const greenRoofMidSlopeY = roofEaveY + (peakY - roofEaveY)*0.5; // Y midpoint calculation needs care with slope
    // Simpler: Calculate center based on rotation axis and half-width
    const rightCenterPosY = roofEaveY + roofHeight / 2;
    const rightCenterPosX = (houseWidth / 2 + overhang) / 2;

    greenRoofMesh.position.set(
        rightCenterPosX - (greenRoofWidthOnSlope * 0.05 * Math.cos(roofPitchAngle)), // Adjust X based on smaller width
        rightCenterPosY + (greenRoofThickness / 2 * Math.cos(roofPitchAngle)) + (greenRoofWidthOnSlope * 0.05 * Math.sin(roofPitchAngle)), // Adjust Y to sit on top and account for smaller width
        0 // Centered on Z
    );
    greenRoofMesh.rotation.z = -roofPitchAngle; // Match right roof slope
    sustainabilityGroup.add(greenRoofMesh);

    // Green Roof Label
    const greenRoofLabelPos = new THREE.Vector3(
        greenRoofMesh.position.x,
        greenRoofMesh.position.y + (greenRoofThickness/2) / Math.cos(roofPitchAngle) + labelOffset, // Y top surface + offset
        greenRoofMesh.position.z
    );
    const greenRoofLabel = createLabel('Green Roof (G Sky)');
    greenRoofLabel.position.copy(greenRoofLabelPos);
    sustainabilityGroup.add(greenRoofLabel);


    // --- Solar Panels (SunPower 5kW) ---
    // Place on the opposite roof slope (Left side, -X)
    const panelWidth = 3.3 * scale;
    const panelLength = 5.5 * scale;
    const panelThickness = 0.1 * scale;
    const numPanelsPerRow = 4; // Adjust based on roof area
    const numRows = 2;
    const panelSpacing = 0.2 * scale;

    const solarPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.2, metalness: 0.7, name: "SolarPanel (SunPower)" });
    const solarPanelGeometry = new THREE.BoxGeometry(panelWidth, panelThickness, panelLength);
    const solarPanelsGroup = new THREE.Group(); // Group for the array of panels

    const panelTotalWidth = numPanelsPerRow * panelWidth + (numPanelsPerRow - 1) * panelSpacing;
    const panelTotalLength = numRows * panelLength + (numRows - 1) * panelSpacing;
    const panelStartX = -panelTotalWidth / 2 + panelWidth / 2; // Relative X within the group
    const panelStartZ = -panelTotalLength / 2 + panelLength / 2; // Relative Z within the group

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numPanelsPerRow; col++) {
            const panel = new THREE.Mesh(solarPanelGeometry, solarPanelMaterial);
            panel.castShadow = true;
            const xRel = panelStartX + col * (panelWidth + panelSpacing);
            const zRel = panelStartZ + row * (panelLength + panelSpacing);
            panel.position.set(xRel, 0, zRel); // Position flat within the group first
            solarPanelsGroup.add(panel);
        }
    }

    // Position and rotate the entire group onto the left roof slope
    const leftCenterPosX = -(houseWidth / 2 + overhang) / 2;
    const leftCenterPosY = roofEaveY + roofHeight / 2;
    solarPanelsGroup.position.set(
        leftCenterPosX, // Center X on the left slope midpoint
        leftCenterPosY + (panelThickness / 2 / Math.cos(roofPitchAngle)), // Y position slightly above roof surface center
        0 // Center Z
    );
    solarPanelsGroup.rotation.z = roofPitchAngle; // Match left roof slope
    sustainabilityGroup.add(solarPanelsGroup);

    // Solar Panels Label (centered above the group)
    const solarPanelBox = new THREE.Box3().setFromObject(solarPanelsGroup);
    const solarPanelCenter = new THREE.Vector3();
    solarPanelBox.getCenter(solarPanelCenter); // Gets world center
    // Estimate top center position after rotation
    const solarLabelY = solarPanelCenter.y + (panelTotalWidth/2 * Math.sin(roofPitchAngle)) + labelOffset; // Adjust based on group size and rotation
    const solarLabelPos = new THREE.Vector3(solarPanelCenter.x, solarLabelY, solarPanelCenter.z);
    const solarLabel = createLabel('Solar Panels (SunPower 5kW)');
    solarLabel.position.copy(solarLabelPos);
    sustainabilityGroup.add(solarLabel);


    // --- Rainwater Harvesting Tank (Acqua Rain Solutions) ---
    const tankRadius = 3 * scale;
    const tankHeight = 7 * scale;
    const tankGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 24);
    const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x546E7A, roughness: 0.7, metalness: 0.1, name: "RainTank (Acqua Rain)" });
    const tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
    tankMesh.castShadow = true;
    tankMesh.receiveShadow = true;

    // Position near a back corner on the ground
    tankMesh.position.set(
        houseDimensions.platformWidth / 2 - tankRadius * 2, // Near right back corner
        tankHeight / 2, // Base on ground y=0
        -houseDimensions.platformDepth / 2 + tankRadius * 2 // Near right back corner
    );
    sustainabilityGroup.add(tankMesh);

    // Rainwater Tank Label
    const tankLabelPos = tankMesh.position.clone();
    tankLabelPos.y += tankHeight / 2 + labelOffset; // Above the tank
    const tankLabel = createLabel('Rainwater Tank (Acqua Rain)');
    tankLabel.position.copy(tankLabelPos);
    sustainabilityGroup.add(tankLabel);


    // --- Permeable Paving (Bina Eco Solutions) ---
    const pavingWidth = 12 * scale;
    const pavingLength = 25 * scale;
    const pavingThickness = 0.3 * scale;
    const pavingGeometry = new THREE.BoxGeometry(pavingWidth, pavingThickness, pavingLength);
    const pavingMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.95, metalness: 0.0, name: "Paving (Bina Eco)" });
    const pavingMesh = new THREE.Mesh(pavingGeometry, pavingMaterial);
    pavingMesh.castShadow = false; // Usually doesn't cast significant shadow
    pavingMesh.receiveShadow = true;

    // Position leading to the front steps
    pavingMesh.position.set(
        0, // Centered horizontally with steps
        pavingThickness / 2, // Base on ground y=0
        houseDimensions.platformDepth / 2 + pavingLength / 2 + (3 * scale) // Place in front of platform/steps end
    );
    sustainabilityGroup.add(pavingMesh);

    // Permeable Paving Label
    const pavingLabelPos = pavingMesh.position.clone();
    pavingLabelPos.y += pavingThickness / 2 + labelOffset; // Above the paving center
    const pavingLabel = createLabel('Permeable Paving (Bina Eco)');
    pavingLabel.position.copy(pavingLabelPos);
    sustainabilityGroup.add(pavingLabel);


    // --- Native Landscaping ---
    const landscapeGroup = new THREE.Group();
    landscapeGroup.name = "NativeLandscaping";
    const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x689F38, roughness: 0.8, metalness: 0.0 });
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.9 });
    const housePlatformWidth = houseDimensions.platformWidth;
    const housePlatformDepth = houseDimensions.platformDepth;


    // Simple landscape elements definition
    const landscapeElements = [
        { type: 'bush', radius: 0.8 * scale, x: -housePlatformWidth / 2 - 2 * scale, z: housePlatformDepth / 2 - 1 * scale },
        { type: 'bush', radius: 0.6 * scale, x: -housePlatformWidth / 2 - 3 * scale, z: housePlatformDepth / 2 - 3 * scale },
        { type: 'tree', height: 3 * scale, radius: 0.5 * scale, x: housePlatformWidth / 2 + 3 * scale, z: 0 },
        { type: 'bush', radius: 0.7 * scale, x: housePlatformWidth / 2 + 2 * scale, z: -housePlatformDepth/2 - 2 * scale },
        { type: 'tree', height: 2.5 * scale, radius: 0.4 * scale, x: -pavingWidth / 2 - 2 * scale, z: housePlatformDepth / 2 + 4 * scale },// Near paving
        { type: 'groundcover', width: 4*scale, depth: 2*scale, x: pavingWidth/2 + 3*scale, z: housePlatformDepth / 2 + 3 * scale } // Near front paving
    ];

    landscapeElements.forEach((el, index) => {
        let elementGroup = new THREE.Group();
        elementGroup.name = `LandscapeElement_${index}`;
        let mesh;

        if (el.type === 'bush') {
            const bushGeo = new THREE.SphereGeometry(el.radius, 12, 8);
            mesh = new THREE.Mesh(bushGeo, plantMaterial);
            mesh.position.y = el.radius * 0.8; // Slightly embedded in ground
            mesh.castShadow = true;
        } else if (el.type === 'tree') {
            const trunkHeight = el.height * 0.6;
            const foliageHeight = el.height * 0.4;
            const trunkRadius = el.radius * 0.2;
            const foliageRadius = el.radius;

            const trunkGeo = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 8);
            const trunk = new THREE.Mesh(trunkGeo, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            elementGroup.add(trunk);

            const foliageGeo = new THREE.SphereGeometry(foliageRadius, 12, 8);
            const foliage = new THREE.Mesh(foliageGeo, plantMaterial);
            foliage.position.y = trunkHeight + foliageHeight * 0.4;
            foliage.castShadow = true;
            elementGroup.add(foliage);
            mesh = elementGroup; // The group is the top-level object
        } else if (el.type === 'groundcover') {
             const coverGeo = new THREE.BoxGeometry(el.width, 0.2*scale, el.depth);
             mesh = new THREE.Mesh(coverGeo, plantMaterial);
             mesh.position.y = 0.1*scale; // Slightly above ground
             mesh.receiveShadow = true;
        }

        if (mesh) {
            mesh.position.x = el.x;
            mesh.position.z = el.z;
            // If it's not already the group (like for trees), add mesh to the group
            if (el.type !== 'tree') {
                elementGroup.add(mesh);
            }
            landscapeGroup.add(elementGroup);
        }
    });
    sustainabilityGroup.add(landscapeGroup);

    // Native Landscaping Label (placed centrally above the area)
    const landscapeBox = new THREE.Box3().setFromObject(landscapeGroup);
    if (!landscapeBox.isEmpty()) {
        const landscapeCenter = new THREE.Vector3();
        landscapeBox.getCenter(landscapeCenter);
        landscapeCenter.y = landscapeBox.max.y + labelOffset + 0.5; // Place higher
        const landscapeLabel = createLabel('Native Landscaping');
        landscapeLabel.position.copy(landscapeCenter);
        sustainabilityGroup.add(landscapeLabel);
    }

    scene.add(sustainabilityGroup);
}


// === INITIALIZATION & SCENE POPULATION ===

// Create the house structure
const houseModel = createHouseStructure();
scene.add(houseModel);

// Add sustainability features, passing the scene and house model/dims
addSustainabilityFeatures(scene, houseModel);


// === RESIZE HANDLING ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// === ANIMATION LOOP ===
function animate() {
    requestAnimationFrame(animate);

    controls.update(); // Only required if controls.enableDamping or .autoRotate are set
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels AFTER WebGL render
}

// Start the animation loop
animate();
