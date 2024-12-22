import * as THREE from "three";

let character;
const buildings = [];
let keys = {}; // Track active keys
const speed = 2; // Movement speed

export function initGame(scene) {
  // Game floor
  const floorGeometry = new THREE.BoxGeometry(1000, 1000, 200);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
	floor.position.set(0,-100,0);
  floor.castShadow = false; // The floor doesn't cast shadows, it just receives them
  floor.receiveShadow = true;
  scene.add(floor);

  // Character (3D sprite or simple cube for now)
  const charMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
  const charGeometry = new THREE.BoxGeometry(20, 40, 20);
  character = new THREE.Mesh(charGeometry, charMaterial);

  character.position.set(-100, 20, 200); // Start position
  character.castShadow = true; // If the character should cast shadows
  character.receiveShadow = true; // If the character should receive shadows
  scene.add(character);

  // Add buildings with doors
  createBuildings(scene);

  // Add mouse and keyboard controls
  document.addEventListener("keydown", (event) => onKeyDown(event, scene));
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);
  return character;
}

function onWindowBlur() {
  keys = {}; // Clear all keys
}

function onKeyDown(event, scene) {
  keys[event.key.toLowerCase()] = true; // Track key press
  if (event.code === "Space") {
    spacePressed(scene);
  }
}

function onKeyUp(event) {
  keys[event.key.toLowerCase()] = false; // Track key release
}

// Create buildings and doors
function createBuildings(scene) {
  const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x8e44ad });
  for (let i = 0; i < 3; i++) {
    const buildingGeometry = new THREE.BoxGeometry(100, 150, 100);
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(i * 200 - 300, 75, -200);
    building.castShadow = true; // For buildings to cast shadows
    building.receiveShadow = true; // For buildings to receive shadows
    scene.add(building);

    // Door indicator
    const doorMaterial = new THREE.MeshBasicMaterial({ color: 0x27ae60 });
    const doorGeometry = new THREE.BoxGeometry(20, 40, 5);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(building.position.x, 20, building.position.z + 50);
    building.door = door;
    buildings.push(building);

    scene.add(door);
  }
}

// Handle keyboard input for entering buildings
function spacePressed(scene) {
  const nearbyBuilding = buildings.find(
    (building) => character.position.distanceTo(building.door.position) < 30
  );
  if (nearbyBuilding) {
    enterBuilding(scene, nearbyBuilding);
  }
}

// Move character toward target position
export function updateGame() {
  if (keys["w"]) {
    character.position.z -= speed; // Forward
    character.position.x -= speed; // Left
  }
  if (keys["s"]) {
    character.position.x += speed; // Right
    character.position.z += speed; // Backward
  }
  if (keys["a"]) {
    character.position.z += speed; // Backward
    character.position.x -= speed; // Left
  }
  if (keys["d"]) {
    character.position.z -= speed; // Forward
    character.position.x += speed; // Left
  }
}

// Enter a building and show projects
function enterBuilding(scene, building) {
  scene.clear(); // Clear the current scene
  showInterior(scene, building);
}

// Display projects inside a building
function showInterior(scene, building) {
  const interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xecf0f1 });
  const interiorGeometry = new THREE.PlaneGeometry(1000, 1000);
  const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
  interior.rotation.x = -Math.PI / 2;
  scene.add(interior);

  // Display project items
  const projectMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
  for (let i = 0; i < 5; i++) {
    const projectGeometry = new THREE.BoxGeometry(50, 50, 50);
    const project = new THREE.Mesh(projectGeometry, projectMaterial);
    project.position.set(
      Math.random() * 800 - 400,
      25,
      Math.random() * 800 - 400
    );
    scene.add(project);
  }
}
