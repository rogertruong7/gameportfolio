import * as THREE from "three";
import { showInterior } from "./building";

let character;
const buildings = [];
let keys = {}; // Track active keys
const SPEED = 2; // Movement SPEED

export function initGame(scene) {
  // Game floor
  const floorGeometry = new THREE.BoxGeometry(1000, 1000, 200);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -100, 0);
  floor.castShadow = false; // The floor doesn't cast shadows, it just receives them
  floor.receiveShadow = true;
  scene.add(floor);

  // Character (3D sprite or simple cube for now)
  const charMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
  const charGeometry = new THREE.BoxGeometry(20, 40, 20);
  character = new THREE.Mesh(charGeometry, charMaterial);

  character.position.set(0, 20, 0); // Start position
  character.castShadow = true; // If the character should cast shadows
  character.receiveShadow = true; // If the character should receive shadows
  scene.add(character);
  console.log("character1", character);
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
export function updateGame(camera) {
	let direction = new THREE.Vector3();
	let finalDirection = new THREE.Vector3();

	if (keys["w"]) {
		camera.getWorldDirection(direction);
		direction.y = 0;
		direction = direction.normalize();
		finalDirection.add(direction);
	}
	if (keys["s"]) {
		camera.getWorldDirection(direction);
		direction.y = 0;
		direction = direction.normalize().negate();
		finalDirection.add(direction);
	}
	if (keys["a"]) {
		camera.getWorldDirection(direction);
		direction.y = 0;
		direction = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
		finalDirection.add(direction);
	}
	if (keys["d"]) {
		camera.getWorldDirection(direction);
		direction.y = 0;
		direction = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
		finalDirection.add(direction);
	}

	if (character !== undefined) {
		let newPosition = character.position.clone().add(finalDirection);
		const collisionNormal = isCollision(newPosition);

		if (!collisionNormal) {
			// No collision: move the character in the intended direction
			character.position.addScaledVector(finalDirection, SPEED);
		} else {
			// Slide along the wall using the collision normal
			const slideDirection = finalDirection
				.clone()
				.projectOnPlane(collisionNormal);
			if (slideDirection.length() > 0) {
				slideDirection.normalize();
				character.position.addScaledVector(slideDirection, SPEED);
			}
		}
	}
}

function isCollision(newPosition) {
	// Create bounding box for the character
	const characterBox = new THREE.Box3().setFromObject(character);
	characterBox.setFromCenterAndSize(newPosition, new THREE.Vector3(20, 40, 20)); // Character size

	let collisionNormal = null;

	// Check each building for collision
	for (let building of buildings) {
		const buildingBox = new THREE.Box3().setFromObject(building);

		if (characterBox.intersectsBox(buildingBox)) {
			// Calculate closest point on the bounding box manually
			const closestPoint = new THREE.Vector3(
				Math.max(buildingBox.min.x, Math.min(newPosition.x, buildingBox.max.x)),
				Math.max(buildingBox.min.y, Math.min(newPosition.y, buildingBox.max.y)),
				Math.max(buildingBox.min.z, Math.min(newPosition.z, buildingBox.max.z))
			);

			collisionNormal = new THREE.Vector3()
				.subVectors(newPosition, closestPoint)
				.normalize();

			collisionNormal.y = 0; // Flatten the normal to the XZ plane
			break; // Only process the first collision
		}
	}

	return collisionNormal; // Return the collision normal or null
}

// Enter a building and show projects
function enterBuilding(scene, building) {
  scene.clear(); // Clear the current scene
  showInterior(scene, building);
}
