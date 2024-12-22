import "./style.css";
import * as THREE from "three";
import { initGame, updateGame } from "./game.js";

// Select the canvas and set up the renderer
const canvas = document.querySelector("#gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow quality

renderer.setSize(window.innerWidth, window.innerHeight);

// Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);


// Camera offset from the player
const CAMERA_OFFSET = new THREE.Vector3(200, 300, 200); // change x value to rotate camera

// Store reference to the player character
let playerCharacter;

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 500, 500); // Position the light
directionalLight.castShadow = true; // Enable shadows
scene.add(directionalLight);

// Add an ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Soft white light
scene.add(ambientLight);

// Set shadow camera to optimize for the scene
directionalLight.shadow.camera.left = -500;
directionalLight.shadow.camera.right = 500;
directionalLight.shadow.camera.top = 500;
directionalLight.shadow.camera.bottom = -500;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 1000;

// Initialize the game
function setup() {
  playerCharacter = initGame(scene); // Adjusted to return the player character
  camera.position.copy(playerCharacter.position.clone().add(CAMERA_OFFSET));
  camera.lookAt(playerCharacter.position);
}

setup();

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update the game state
  updateGame();

  // Update camera position smoothly
  if (playerCharacter) {
    const targetPosition = playerCharacter.position.clone().add(CAMERA_OFFSET);
    camera.position.lerp(targetPosition, 0.1); // Smoothly follow player
    camera.lookAt(playerCharacter.position);
  }

  renderer.render(scene, camera);
}

animate();

// Resize listener
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const popup = document.getElementById("popup");
const okButton = document.getElementById("okButton");

window.onload(() => {
  popup.style.visibility = "visible"; // Make the popup visible
  document.body.style.cursor = "default"; // Make the cursor visible during the popup
});

okButton.addEventListener("click", () => {
  popup.style.visibility = "hidden"; // Hide the popup
  document.body.style.cursor = "none"; // Hide the cursor

  // Enable mouse movement to control camera rotation
  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener("mousemove", (event) => {
    // Get mouse position relative to the center of the window
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 - 1;

    // Rotate the camera based on mouse movement
    camera.rotation.y = mouseX * Math.PI; // Left/Right rotation
    camera.rotation.x = (mouseY * Math.PI) / 4; // Up/Down rotation
  });
});
