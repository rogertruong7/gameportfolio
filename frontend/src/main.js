import "../public/style.css";
import * as THREE from "three";
import { initGame, updateGame } from "./game.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/Addons.js";
import { updateInfoGame } from "./projects.js";

// Select the canvas and set up the renderer

const canvas = document.querySelector("#gameCanvas");
export const renderer = new THREE.WebGLRenderer({ canvas });

renderer.setClearColor(0xfad998, 1); // fad998
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow quality
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
export const scene = new THREE.Scene();
export const CAMERA_OFFSET = new THREE.Vector3(400, 300, 400);

document.body.style.cursor = "grab";

// Create a spherical grid
const radius = 2000; // Radius of the sphere
const gridDivisions = 36; // Number of grid lines (can adjust for more or less)

function createSphericalGrid(radius, divisions) {
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 0.5,
    transparent: true,
  });

  // Create horizontal circles (latitudes)
  for (let i = 0; i <= divisions; i++) {
    const lat = (Math.PI * i) / divisions - Math.PI / 2; // Latitude (ranging from -pi/2 to pi/2)
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let j = 0; j <= divisions; j++) {
      const lon = (2 * Math.PI * j) / divisions; // Longitude (ranging from 0 to 2pi)
      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);
      positions.push(x, y, z); // Add each vertex to the positions array
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    ); // Set the positions attribute
    const line = new THREE.Line(geometry, gridMaterial);
    scene.add(line);
  }

  // Create vertical circles (longitudes)
  for (let i = 0; i <= divisions; i++) {
    const lon = (2 * Math.PI * i) / divisions; // Longitude (ranging from 0 to 2pi)
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let j = 0; j <= divisions; j++) {
      const lat = (Math.PI * j) / divisions - Math.PI / 2; // Latitude (ranging from -pi/2 to pi/2)
      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);
      positions.push(x, y, z); // Add each vertex to the positions array
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    ); // Set the positions attribute
    const line = new THREE.Line(geometry, gridMaterial);
    scene.add(line);
  }
}

createSphericalGrid(radius, gridDivisions);

////////////////////////////////////////////////
///////////////////// Lights ///////////////////
////////////////////////////////////////////////

// Add an ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

////////////////////////////////////////////////
/////////////////// Game ///////////////////////
////////////////////////////////////////////////

// Store reference to the player character
let playerCharacter;
const sharedState = { mixer: null };
let currentScene = scene;
let mainScene = scene;

const clock = new THREE.Clock();
function setup() {
  playerCharacter = initGame(sharedState); // Adjusted to return the player character
}

setup();
let result;
// Animation loop
export function animate() {
  requestAnimationFrame(animate);
  // Update camera position smoothly

  if (currentScene === scene) {
    result = updateGame();
    playerCharacter = result.character;
    currentScene = result.currentScene;
    const delta = clock.getDelta(); // Time since the last frame
    renderer.render(currentScene, result.camera);
    if (sharedState.mixer) sharedState.mixer.update(delta);
  } else {
    result = updateInfoGame();
    renderer.render(currentScene, result.camera);
  }
}

animate();

resetButton.addEventListener("click", (e) => {
  currentScene = mainScene;
});

document.getElementById("back_button").addEventListener("click", () => {
  currentScene = mainScene;
});

////////////////////////////////////////////////
/////////////// Window Changes /////////////////
////////////////////////////////////////////////

// Resize listener
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});
