import * as THREE from "three";
import { showInterior } from "./building";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CAMERA_OFFSET } from "./main";

let character,
  targetPosition,
  moving = false;
const buildings = [];
let keys = {}; // Track active keys
const SPEED = 1; // Movement SPEED
const CAMERA_ROTATION_SPEED = 0.001;
let floor;

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

export function initGame(scene, sharedState) {
  // Game floor
  const floorGeometry = new THREE.BoxGeometry(1000, 1000, 200);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x74d682 });
  floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -100, 0);
  floor.castShadow = false; // The floor doesn't cast shadows, it just receives them
  floor.receiveShadow = true;
  scene.add(floor);
  // Add buildings with doors
  createBuildings(scene);
	targetPosition = new THREE.Vector3(0, 20, 0);
  // Add mouse and keyboard controls
  document.addEventListener("keydown", (event) => onKeyDown(event, scene));
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  const charMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
  const charGeometry = new THREE.BoxGeometry(20, 40, 80);
  character = new THREE.Mesh(charGeometry, charMaterial);

  const loader = new GLTFLoader();
  loader.load(
    "assets/toon_cat_free/scene.gltf",
    function (gltf) {
      character = gltf.scene;
      character.position.set(0, 0, 0);
      character.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      character.scale.set(0.15, 0.15, 0.15);
      console.log(character);

      scene.add(character);
      sharedState.mixer = new THREE.AnimationMixer(character);

      // Play the first animation clip by default
      const clips = gltf.animations; // Array of animation clips

      if (clips.length > 0) {

        const action = sharedState.mixer.clipAction(clips[0]); // Play the first clip

        action.setLoop(THREE.LoopRepeat);
        action.play();
      }
			
			camera.position.copy(character.position.clone().add(CAMERA_OFFSET));
			camera.lookAt(character.position);

      return character;
    },
    function (xhr) {
      //While it is loading, log the progress
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("bye");
      console.error(error);
    }
  );

	const canvas = document.querySelector("#gameCanvas");
  canvas.addEventListener("click", onMouseClick, false);
}


// Create buildings and doors
function createBuildings(scene) {
  const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x574000 });
  for (let i = 0; i < 3; i++) {
    const buildingGeometry = new THREE.BoxGeometry(100, 150, 100);
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(i * 200 - 300, 75, -200);
    building.castShadow = true; // For buildings to cast shadows
    building.receiveShadow = true; // For buildings to receive shadows
    scene.add(building);

    // Door indicator
    const doorMaterial = new THREE.MeshBasicMaterial({ color: 0xc27b00 });
    const doorGeometry = new THREE.BoxGeometry(20, 40, 5);
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(building.position.x, 20, building.position.z + 50);
	building.door = door;
    buildings.push(building);

    scene.add(door);
  }
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

function onMouseClick(event) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera); //scene.userData.camera

  const intersects = raycaster.intersectObject(floor);
  if (intersects.length > 0) {
    targetPosition.copy(intersects[0].point);
    targetPosition.y = 20; // Match character height
    moving = true;
  }
}

// Listen for mouse clicks and move the character

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

// Move character toward target position
export function updateGame() {
	if (character) {
    updateCamera(character, camera, CAMERA_OFFSET);
  }

	

	let direction = new THREE.Vector3();
	let finalDirection = new THREE.Vector3();

	if (localStorage.getItem('visited') === "true" && !moving) {
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
	}

	if (moving && character !== undefined) {
    const movingDirection = targetPosition.clone().sub(character.position);
		movingDirection.y = 0; 
    // If the distance to target is large enough, move the character
    if (movingDirection.length() > 1) {
      const stepDirection = movingDirection.normalize().multiplyScalar(SPEED); // Step size

      // Check if the next step leads to a collision
      const newPosition = character.position.clone().add(stepDirection);
      const collisionNormal = isCollision(newPosition); // Check for collision at new position

      if (!collisionNormal) {
        // No collision, move the character
        character.position.add(stepDirection);
        updateRotation(movingDirection); // Rotate the character towards the target direction
      }
    } else {
      moving = false; // Stop moving when the target is reached
    }
  }

	if (character !== undefined) {
		let newPosition = character.position.clone().add(finalDirection);
		const collisionNormal = isCollision(newPosition);
		updateRotation(finalDirection);
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
	return { character, camera };
}

let lastDirection = new THREE.Vector3(0, 0, 1); // Default direction
function updateRotation(inputVector) {
  if (inputVector.length() > 0) {
    // Normalize the input vector and store the last valid direction
    inputVector.normalize();
    lastDirection.copy(inputVector);

    // Calculate the target angle based on the input vector
    const targetAngle = Math.atan2(inputVector.x, inputVector.z); // Angle in radians

    // Smoothly interpolate the character's current rotation to the target angle
    const currentAngle = character.rotation.y; // Current Y-axis rotation
    const newAngle = THREE.MathUtils.lerp(
      currentAngle,
      targetAngle,
      1
    );

    // Apply the new angle
    character.rotation.y = newAngle;
  }
}

////////////////////////////////////////////////
////////////// Camera Movement//////////////////
////////////////////////////////////////////////


let currentRotation = new THREE.Vector2(0, 0);
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
document.addEventListener("mousedown", (event) => {
	isDragging = true;
	previousMousePosition = { x: event.clientX, y: event.clientY };
});

document.addEventListener("mouseup", () => {
	isDragging = false;
});

document.addEventListener("mouseleave", () => {
	if (isDragging) {
		isDragging = false;
	}
});

document.addEventListener("mousemove", (event) => {
	if (isDragging) {
		const deltaX = event.clientX - previousMousePosition.x;
		const deltaY = event.clientY - previousMousePosition.y;

		// Update the current rotation based on mouse movement
		currentRotation.x -= deltaY * CAMERA_ROTATION_SPEED; // Pitch (up/down)
		currentRotation.y -= deltaX * CAMERA_ROTATION_SPEED; // Yaw (left/right)

		// Limit vertical rotation to avoid flipping
		currentRotation.x = Math.max(
			-Math.PI / 2,
			Math.min(Math.PI / 2, currentRotation.x)
		);

		// Update the previous mouse position for the next frame
		previousMousePosition = { x: event.clientX, y: event.clientY };
	}
});

function updateCamera(playerCharacter, camera, CAMERA_OFFSET) {
  // Apply the rotation to the camera's position
  const rotationQuat = new THREE.Quaternion();
  rotationQuat.setFromEuler(
    new THREE.Euler(currentRotation.x, currentRotation.y, 0, "YXZ")
  ); // Apply rotation

  // Calculate the new camera offset based on the rotation
  const cameraOffset = new THREE.Vector3(
    CAMERA_OFFSET.x,
    CAMERA_OFFSET.y,
    CAMERA_OFFSET.z
  );
  cameraOffset.applyQuaternion(rotationQuat); // Apply the rotation to the offset
  if (cameraOffset.y < 10) {
    cameraOffset.y = 10;
  }
  // Smoothly move the camera towards the target position based on the rotated offset
  const targetPosition = playerCharacter.position.clone().add(cameraOffset);
  camera.position.lerp(targetPosition, 0.1); // Smoothly follow player

  // Ensure the camera always looks at the player character
  camera.lookAt(playerCharacter.position);
}


////////////////////////////////////////////////
////////////// Collision //////////////////
////////////////////////////////////////////////

function isCollision(newPosition) {
  // Define character as a sphere for collision purposes
  const characterRadius = 50; // Approximate radius of the character
  const characterSphere = new THREE.Sphere(newPosition, characterRadius);

  let collisionNormal = null;

  // Check collision against each building
  for (let building of buildings) {
    const buildingBox = new THREE.Box3().setFromObject(building);

    // Check for intersection between sphere and box
    if (buildingBox.intersectsSphere(characterSphere)) {
      // Calculate the closest point on the building's bounding box to the character
      const closestPoint = new THREE.Vector3(
        Math.max(buildingBox.min.x, Math.min(newPosition.x, buildingBox.max.x)),
        Math.max(buildingBox.min.y, Math.min(newPosition.y, buildingBox.max.y)),
        Math.max(buildingBox.min.z, Math.min(newPosition.z, buildingBox.max.z))
      );

      // Calculate collision normal
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

// Handle keyboard input for entering buildings
function spacePressed(scene) {
  const nearbyBuilding = buildings.find(
    (building) => character.position.distanceTo(building.door.position) < 30
  );
  if (nearbyBuilding) {
    enterBuilding(scene, nearbyBuilding);
  }
}


window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});