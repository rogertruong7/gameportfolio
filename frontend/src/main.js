import "./style.css";
import * as THREE from "three";
import { initGame, updateGame } from "./game.js";

// Select the canvas and set up the renderer
const CAMERA_ROTATION_SPEED = 0.005;
const canvas = document.querySelector("#gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });


renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow quality
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
const scene = new THREE.Scene();

// Camera Movement
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let currentRotation = new THREE.Vector2(0, 0);
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
let CAMERA_OFFSET = new THREE.Vector3(200, 400, 200); // change x value to rotate camera

document.body.style.cursor = "grab";

document.addEventListener("mousedown", (event) => {
  isDragging = true;
  previousMousePosition = { x: event.clientX, y: event.clientY };
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

document.addEventListener("mouseup", () => {
	isDragging = false;
});

document.addEventListener("mouseleave", () => {
	if (isDragging) {
		isDragging = false;
	}
});

// Game
// Store reference to the player character
let playerCharacter;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(-100, 200, 300); // Position the light
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

// Add an ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Soft white light
scene.add(ambientLight);

// Set shadow camera to optimize for the scene
directionalLight.shadow.camera.left = -1000;
directionalLight.shadow.camera.right = 1000;
directionalLight.shadow.camera.top = 1000;
directionalLight.shadow.camera.bottom = -1000;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 10000;

// Initialize the game
function setup() {
  playerCharacter = initGame(scene); // Adjusted to return the player character
  camera.position.copy(playerCharacter.position.clone().add(CAMERA_OFFSET));
  camera.lookAt(playerCharacter.position);
}

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

	// Smoothly move the camera towards the target position based on the rotated offset
	const targetPosition = playerCharacter.position.clone().add(cameraOffset);
	camera.position.lerp(targetPosition, 0.1); // Smoothly follow player

	// Ensure the camera always looks at the player character
	camera.lookAt(playerCharacter.position);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update the game state
  updateGame(camera);

  // Update camera position smoothly
  if (playerCharacter) {
	updateCamera(playerCharacter, camera, CAMERA_OFFSET)
  }

  renderer.render(scene, camera);
}

animate();

///////////////
// Window Changes
///////////////

// Resize listener
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const popup = document.getElementById("popup");
const okButton = document.getElementById("okButton");

window.addEventListener("load", () => {
  if (localStorage.getItem("visited") === "true") {
    setup();
    return;
  }
  popup.style.display = "flex"; // Make the popup visible
  document.body.style.cursor = "default"; // Make the cursor visible during the popup
});

okButton.addEventListener("click", () => {
  popup.style.display = "none";
  document.body.style.cursor = "none"; // Hide the cursor
  localStorage.setItem("visited", true);
  setup();
});
