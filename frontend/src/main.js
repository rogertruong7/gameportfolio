import "./style.css";
import * as THREE from "three";
import { initGame, updateGame } from "./game.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/Addons.js";

// Select the canvas and set up the renderer

const canvas = document.querySelector("#gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });

renderer.setClearColor(0xfad998, 1);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Shadow quality
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
const scene = new THREE.Scene();
export const CAMERA_OFFSET = new THREE.Vector3(500, 1000, 500);

document.body.style.cursor = "grab";

// Create a spherical grid
const radius = 2000; // Radius of the sphere
const gridDivisions = 50; // Number of grid lines (can adjust for more or less)

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
const directionalLight = new THREE.DirectionalLight(0xfabe57, 4);
directionalLight.position.set(800, 500, 300); // Position the light
directionalLight.castShadow = true; // Enable shadows
directionalLight.shadow.camera.near = 0.5; // Shadow camera near plane
directionalLight.shadow.camera.far = 10000; // Shadow camera far plane
directionalLight.shadow.camera.left = -4000; // Set shadow camera left
directionalLight.shadow.camera.right = 4000; // Set shadow camera right
directionalLight.shadow.camera.top = 4000; // Set shadow camera top
directionalLight.shadow.camera.bottom = -4000; // Set shadow camera bottom

scene.add(directionalLight);



// Add an ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Soft white light
scene.add(ambientLight);

////////////////////////////////////////////////
/////////////////// Game ///////////////////////
////////////////////////////////////////////////

// Store reference to the player character
let playerCharacter;
const sharedState = { mixer: null };

const clock = new THREE.Clock();
function setup() {
  playerCharacter = initGame(scene, sharedState); // Adjusted to return the player character
  animate();
  console.log("setup", playerCharacter);
}

setup();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  // Update camera position smoothly
  let result = updateGame();
  playerCharacter = result.character;
  const delta = clock.getDelta(); // Time since the last frame

  if (sharedState.mixer) sharedState.mixer.update(delta);
  renderer.render(scene, result.camera);
}

animate();

////////////////////////////////////////////////
/////////////// Window Changes /////////////////
////////////////////////////////////////////////

// Resize listener
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const popup = document.getElementById("popup");
const okButton = document.getElementById("okButton");

window.addEventListener("load", () => {
  if (localStorage.getItem("visited") !== "true") {
    popup.style.display = "flex"; // Make the popup visible
    document.body.style.cursor = "grab"; // Make the cursor visible during the popup
  }
});

okButton.addEventListener("click", () => {
  popup.style.display = "none";
  localStorage.setItem("visited", true);
});
