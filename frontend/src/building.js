import * as THREE from "three";

// Display projects inside a building
export function showInterior(scene, building) {
    const interiorMaterial = new THREE.MeshBasicMaterial({ color: 0xecf0f1 });
    const interiorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
    interior.rotation.x = -Math.PI / 2;
    scene.add(interior);
    scene.add(character);
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
