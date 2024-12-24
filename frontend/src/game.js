import * as THREE from "three";
import { showInterior } from "./building";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CAMERA_OFFSET } from "./main";
import { scene, renderer } from "./main";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const SPEED = 3; // Movement SPEED
const CAMERA_ROTATION_SPEED = 0.0015;

let character,
  targetPosition,
  clickMoving = false;
let buildings;
let keys = {}; // Track active keys
let floor;
let loading = true;
let mainScene;
let darkSpot;
let startPosition = [10, 0, 270];
let currentScene;

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

const loader = new GLTFLoader();

export function initGame(sharedState) {
  // Buildings
  createBuildings(scene);

  // Game floor
  loader.load(
    "assets/floor.glb",
    function (gltf) {
      floor = gltf.scene;
      floor.position.set(-70, 32, 450);
      floor.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = true;
        }
      });
      floor.scale.set(0.8, 0.8, 0.8);
      floor.name = "floor";
      scene.add(floor);
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

  targetPosition = new THREE.Vector3(0, 20, 0);
  // Add mouse and keyboard controls
  document.addEventListener("keydown", (event) => onKeyDown(event, scene));
  document.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  const charMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
  const charGeometry = new THREE.BoxGeometry(20, 40, 80);
  character = new THREE.Mesh(charGeometry, charMaterial);

  loader.load(
    "assets/toon_cat_free/scene.gltf",
    function (gltf) {
      character = gltf.scene;
      character.position.set(...startPosition);
      character.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      character.rotation.y = Math.PI;
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
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mouseup", onMouseUp);
}

// Create buildings and doors
function createBuildings(scene) {
  loader.load(
    "assets/buildings.glb",
    function (gltf) {
      buildings = gltf.scene;
      buildings.position.set(-70, 32, 450);
      buildings.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      buildings.scale.set(0.8, 0.8, 0.8);
      buildings.name = "buildings";
      console.log(buildings);
      scene.add(buildings);
    },
    function (xhr) {
      //While it is loading, log the progress
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      if ((xhr.loaded / xhr.total) * 100 === 100) {
        loading = false;
      }
    },
    function (error) {
      console.log("bye");
      console.error(error);
    }
  );

  // const buildingMaterial = new THREE.MeshPhongMaterial({ color: 0x574000 });
  // for (let i = 0; i < 3; i++) {
  //   const buildingGeometry = new THREE.BoxGeometry(100, 150, 100);
  //   const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
  //   building.position.set(i * 200 - 300, 75, -200);
  //   building.castShadow = true; // For buildings to cast shadows
  //   building.receiveShadow = true; // For buildings to receive shadows
  //   scene.add(building);

  //   // Door indicator
  //   const doorMaterial = new THREE.MeshBasicMaterial({ color: 0xc27b00 });
  //   const doorGeometry = new THREE.BoxGeometry(20, 40, 5);
  //   const door = new THREE.Mesh(doorGeometry, doorMaterial);
  //   door.position.set(building.position.x, 20, building.position.z + 50);
  //   building.door = door;
  //   buildings.push(building);

  //   scene.add(door);
  // }
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

let mouseDownTime = 0; // Time when mouse is pressed down
const CLICK_THRESHOLD = 150; // Time in milliseconds to consider it a short click (e.g., 300ms)

function onMouseDown() {
  mouseDownTime = Date.now(); // Record the time when the mouse is pressed
}

function onMouseUp(event) {
  const clickDuration = Date.now() - mouseDownTime; // Calculate how long the button was held down

  if (clickDuration < CLICK_THRESHOLD) {
    // If the click was short, set moving to true
    onMouseClick(event); // Call your click handler function to move the character
  }
}

function onMouseClick(event) {
  scene.remove(darkSpot);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera); //scene.userData.camera

  const intersects = raycaster.intersectObject(floor);
  if (intersects.length > 0) {
    console.log("Mouse clicked on ", intersects[0].point);
    targetPosition.copy(intersects[0].point);
    targetPosition.y = 20; // Match character height
    clickMoving = true;

    createDarkSpot(intersects[0].point);
  }
}

function createDarkSpot(position) {
  const darkSpotGeometry = new THREE.CircleGeometry(20, 6); // Radius and segments
  const darkSpotMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.5,
    transparent: true,
  });
  darkSpot = new THREE.Mesh(darkSpotGeometry, darkSpotMaterial);
  darkSpot.rotation.x = -Math.PI / 2; // Align with the floor
  darkSpot.position.copy(position);
  darkSpot.position.y += 1.5; // Slightly above the floor to avoid z-fighting
  scene.add(darkSpot);
}

// Listen for mouse clicks and move the character

function onWindowBlur() {
  keys = {}; // Clear all keys
}

function onKeyDown(event, scene) {
  keys[event.key.toLowerCase()] = true; // Track key press
  if (event.code === "Space") {
    spacePressed(scene);
    scene.remove(darkSpot);
  }
}

function onKeyUp(event) {
  keys[event.key.toLowerCase()] = false; // Track key release
}

function appearingItemsAfterLoad() {
  const loadingScreen = document.getElementById("loading_screen");
  loadingScreen.style.display = "none";

  // Popup
  const popup = document.getElementById("popup");
  const okButton = document.getElementById("okButton");
  if (localStorage.getItem("visited") !== "true") {
    popup.style.display = "flex"; // Make the popup visible
    document.body.style.cursor = "grab"; // Make the cursor visible during the popup
  }
  okButton.addEventListener("click", () => {
    popup.style.display = "none";
    localStorage.setItem("visited", true);
  });

  const gameButtons = document.getElementById("gameButtons");
  gameButtons.style.display = "flex";
}

// Move character toward target position

export function updateGame() {
  mainScene = scene;
  currentScene = scene;
  if (
    !loading &&
    scene.getObjectByName("buildings") &&
    scene.getObjectByName("floor")
  ) {
    appearingItemsAfterLoad();
  }
  if (character) {
    updateCamera(character, camera, CAMERA_OFFSET);
  }

  let direction = new THREE.Vector3();
  let finalDirection = new THREE.Vector3();

  if (localStorage.getItem("visited") === "true") {
    if (keys["w"]) {
      scene.remove(darkSpot);
      clickMoving = false;
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction = direction.normalize();
      finalDirection.add(direction);
    }
    if (keys["s"]) {
      scene.remove(darkSpot);
      clickMoving = false;
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction = direction.normalize().negate();
      finalDirection.add(direction);
    }
    if (keys["a"]) {
      scene.remove(darkSpot);
      clickMoving = false;
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
      finalDirection.add(direction);
    }
    if (keys["d"]) {
      scene.remove(darkSpot);
      clickMoving = false;
      camera.getWorldDirection(direction);
      direction.y = 0;
      direction = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      finalDirection.add(direction);
    }
  }

  if (clickMoving && character !== undefined) {
    const movingDirection = targetPosition.clone().sub(character.position);
    movingDirection.y = 0;
    // If the distance to target is large enough, move the character
    if (movingDirection.length() > 3) {
      const stepDirection = movingDirection.normalize().multiplyScalar(SPEED); // Step size

      // Check if the next step leads to a collision
      const newPosition = character.position.clone().add(stepDirection);
      const collisionNormal = isCollision(newPosition); // Check for collision at new position

      if (!collisionNormal) {
        // No collision, move the character
        character.position.add(stepDirection);
        updateRotation(stepDirection);
      } else {
        scene.remove(darkSpot);
        console.log(clickMoving);
        clickMoving = false;
      }
    } else {
      scene.remove(darkSpot);
      console.log(clickMoving);
      clickMoving = false; // Stop moving when the target is reached
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
  return { character, camera, currentScene };
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
    const newAngle = THREE.MathUtils.lerp(currentAngle, targetAngle, 1);

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
  const characterRadius = 40; // Approximate radius of the character
  const characterHitbox = new THREE.Sphere(newPosition, characterRadius);

  let collisionNormal = null;

  if (buildings !== undefined) {
    buildings.traverse((child) => {
      if (child.isMesh) {
        const partBoundingBox = new THREE.Box3().setFromObject(child);

        // Store the hitbox for collision checks
        child.userData.hitbox = partBoundingBox;
      }
    });
    buildings.traverse((child) => {
      if (child.isMesh && child.userData.hitbox) {
        const hitbox = child.userData.hitbox;
        if (hitbox.intersectsSphere(characterHitbox)) {
          // Calculate the closest point on the building's bounding box to the character
          const closestPoint = new THREE.Vector3(
            Math.max(hitbox.min.x, Math.min(newPosition.x, hitbox.max.x)),
            Math.max(hitbox.min.y, Math.min(newPosition.y, hitbox.max.y)),
            Math.max(hitbox.min.z, Math.min(newPosition.z, hitbox.max.z))
          );

          // Calculate collision normal
          collisionNormal = new THREE.Vector3()
            .subVectors(newPosition, closestPoint)
            .normalize();

          collisionNormal.y = 0; // Flatten the normal to the XZ plane
        }
      }
    });
  }
  return collisionNormal; // Return the collision normal or null
}

// Enter a building and show projects
function enterBuilding(scene, building) {
  mainScene = scene;
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

const resetButton = document.getElementById("resetButton");

resetButton.addEventListener("click", (e) => {
  renderer.render(mainScene, camera);
  character.position.set(...startPosition);
  scene.remove(darkSpot);
  clickMoving = false;
  keys = {};
  character.rotation.y = Math.PI;
});
