const fs = require('fs');
const path = require('path');

// Polyfill FileReader for Node.js environment
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        if (this.onload) this.onload({ target: this });
      }).catch((err) => {
        if (this.onerror) this.onerror(err);
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        const base64 = Buffer.from(buf).toString('base64');
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
        if (this.onload) this.onload({ target: this });
      }).catch((err) => {
        if (this.onerror) this.onerror(err);
      });
    }
  };
}

const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

function createTotoroScene() {
  const scene = new THREE.Scene();
  scene.name = 'TotoroScene';

  const totoro = new THREE.Group();
  totoro.name = 'Totoro';

  // Materials
  const furColor = 0x7a7f79;
  const bellyColor = 0xf5ebd2;
  const darkDetailColor = 0x222222;
  const chevronColor = 0x666b65;
  const leafColor = 0x4f823a;
  const stemColor = 0x365825;
  const blushColor = 0xea9183;
  const clawColor = 0x353533;
  const padColor = 0xadaba4;

  const furMaterial = new THREE.MeshStandardMaterial({
    color: furColor,
    roughness: 0.78,
    metalness: 0.05,
    name: 'FurMaterial',
  });

  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: bellyColor,
    roughness: 0.72,
    metalness: 0.02,
    name: 'BellyMaterial',
  });

  const darkMaterial = new THREE.MeshStandardMaterial({
    color: darkDetailColor,
    roughness: 0.3,
    metalness: 0.1,
    name: 'DarkMaterial',
  });

  const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.05,
    name: 'EyeWhiteMaterial',
  });

  const chevronMaterial = new THREE.MeshStandardMaterial({
    color: chevronColor,
    roughness: 0.75,
    metalness: 0.05,
    name: 'ChevronMaterial',
  });

  const leafMaterial = new THREE.MeshStandardMaterial({
    color: leafColor,
    roughness: 0.5,
    metalness: 0.08,
    name: 'LeafMaterial',
  });

  const stemMaterial = new THREE.MeshStandardMaterial({
    color: stemColor,
    roughness: 0.6,
    metalness: 0.05,
    name: 'StemMaterial',
  });

  const blushMaterial = new THREE.MeshStandardMaterial({
    color: blushColor,
    roughness: 0.9,
    metalness: 0.0,
    name: 'BlushMaterial',
  });

  const clawMaterial = new THREE.MeshStandardMaterial({
    color: clawColor,
    roughness: 0.4,
    metalness: 0.1,
    name: 'ClawMaterial',
  });

  const padMaterial = new THREE.MeshStandardMaterial({
    color: padColor,
    roughness: 0.8,
    metalness: 0.02,
    name: 'PadMaterial',
  });

  // 1. Body using smooth LatheGeometry
  const bodyPoints = [
    new THREE.Vector2(0.001, -1.25),
    new THREE.Vector2(0.65, -1.22),
    new THREE.Vector2(1.18, -0.95),
    new THREE.Vector2(1.38, -0.45),
    new THREE.Vector2(1.36, 0.10),
    new THREE.Vector2(1.24, 0.55),
    new THREE.Vector2(1.10, 0.95),
    new THREE.Vector2(0.96, 1.30),
    new THREE.Vector2(0.70, 1.55),
    new THREE.Vector2(0.35, 1.68),
    new THREE.Vector2(0.001, 1.70),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 48);
  const bodyMesh = new THREE.Mesh(bodyGeo, furMaterial);
  bodyMesh.name = 'Body';
  bodyMesh.scale.set(1.05, 1.0, 0.98);
  totoro.add(bodyMesh);

  // 2. Cream Belly
  const bellyGeo = new THREE.SphereGeometry(1.0, 40, 32);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMaterial);
  bellyMesh.name = 'Belly';
  bellyMesh.position.set(0, -0.22, 0.46);
  bellyMesh.scale.set(1.04, 0.95, 0.60);
  totoro.add(bellyMesh);

  // 3. Chevrons on belly (3 on top row, 4 on second row)
  function createChevron() {
    const shape = new THREE.Shape();
    // Inverted V crescent
    shape.moveTo(-0.09, -0.05);
    shape.quadraticCurveTo(0, 0.065, 0.09, -0.05);
    shape.quadraticCurveTo(0, 0.005, -0.09, -0.05);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
    return new THREE.Mesh(geom, chevronMaterial);
  }

  // Row 1 (top): 3 chevrons
  const row1Positions = [
    { x: -0.38, y: 0.32, z: 0.96, rotZ: 0.1 },
    { x: 0.0,   y: 0.35, z: 1.02, rotZ: 0.0 },
    { x: 0.38,  y: 0.32, z: 0.96, rotZ: -0.1 },
  ];
  row1Positions.forEach((pos, idx) => {
    const ch = createChevron();
    ch.name = `Chevron_Row1_${idx}`;
    ch.position.set(pos.x, pos.y, pos.z);
    ch.rotation.set(-0.25, 0, pos.rotZ);
    totoro.add(ch);
  });

  // Row 2 (middle): 4 chevrons
  const row2Positions = [
    { x: -0.52, y: 0.10, z: 0.90, rotZ: 0.16 },
    { x: -0.18, y: 0.14, z: 1.03, rotZ: 0.05 },
    { x: 0.18,  y: 0.14, z: 1.03, rotZ: -0.05 },
    { x: 0.52,  y: 0.10, z: 0.90, rotZ: -0.16 },
  ];
  row2Positions.forEach((pos, idx) => {
    const ch = createChevron();
    ch.name = `Chevron_Row2_${idx}`;
    ch.position.set(pos.x, pos.y, pos.z);
    ch.rotation.set(-0.15, 0, pos.rotZ);
    totoro.add(ch);
  });

  // 4. Ears
  function createEar(isLeft) {
    const earGroup = new THREE.Group();
    // Main ear cone/cylinder
    const earGeo = new THREE.CylinderGeometry(0.06, 0.22, 0.85, 32);
    const earMesh = new THREE.Mesh(earGeo, furMaterial);
    earMesh.position.y = 0.425;
    earGroup.add(earMesh);

    // Rounded tip
    const tipGeo = new THREE.SphereGeometry(0.06, 20, 16);
    const tipMesh = new THREE.Mesh(tipGeo, furMaterial);
    tipMesh.position.y = 0.85;
    earGroup.add(tipMesh);

    // Ear base curve
    const baseGeo = new THREE.SphereGeometry(0.22, 20, 16);
    const baseMesh = new THREE.Mesh(baseGeo, furMaterial);
    baseMesh.position.y = 0.05;
    earGroup.add(baseMesh);

    const sign = isLeft ? -1 : 1;
    earGroup.position.set(sign * 0.52, 1.62, -0.05);
    earGroup.rotation.set(-0.06, 0, sign * 0.16);
    earGroup.name = isLeft ? 'LeftEar' : 'RightEar';
    return earGroup;
  }
  totoro.add(createEar(true));
  totoro.add(createEar(false));

  // 5. Leaf on Head
  const leafGroup = new THREE.Group();
  leafGroup.name = 'LeafOnHead';
  leafGroup.position.set(0, 1.68, 0.02);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.24);
  leafShape.bezierCurveTo(0.26, -0.12, 0.24, 0.18, 0, 0.30);
  leafShape.bezierCurveTo(-0.24, 0.18, -0.26, -0.12, 0, -0.24);

  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  const leafMesh = new THREE.Mesh(leafGeo, leafMaterial);
  leafMesh.rotation.x = -Math.PI / 2.2;
  leafMesh.scale.set(0.9, 0.9, 0.9);
  leafGroup.add(leafMesh);

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 16);
  const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
  stemMesh.position.set(0, 0.12, -0.08);
  stemMesh.rotation.x = -0.3;
  leafGroup.add(stemMesh);

  totoro.add(leafGroup);

  // 6. Eyes (Big white circles with round black pupils)
  function createEye(isLeft) {
    const eyeGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;

    // Sclera (White)
    const whiteGeo = new THREE.SphereGeometry(0.185, 32, 24);
    const whiteMesh = new THREE.Mesh(whiteGeo, eyeWhiteMaterial);
    whiteMesh.scale.set(1.0, 1.0, 0.65);
    eyeGroup.add(whiteMesh);

    // Pupil (Black)
    const pupilGeo = new THREE.SphereGeometry(0.085, 24, 16);
    const pupilMesh = new THREE.Mesh(pupilGeo, darkMaterial);
    pupilMesh.position.set(0, 0, 0.11);
    pupilMesh.scale.set(1.0, 1.0, 0.35);
    eyeGroup.add(pupilMesh);

    // Specular Highlight
    const highlightGeo = new THREE.SphereGeometry(0.03, 16, 12);
    const highlightMesh = new THREE.Mesh(highlightGeo, eyeWhiteMaterial);
    highlightMesh.position.set(sign * 0.035, 0.035, 0.135);
    eyeGroup.add(highlightMesh);

    eyeGroup.position.set(sign * 0.45, 0.96, 0.98);
    eyeGroup.rotation.y = sign * 0.25;
    eyeGroup.name = isLeft ? 'LeftEye' : 'RightEye';
    return eyeGroup;
  }
  totoro.add(createEye(true));
  totoro.add(createEye(false));

  // 7. Nose
  const noseGeo = new THREE.SphereGeometry(0.09, 24, 16);
  const noseMesh = new THREE.Mesh(noseGeo, darkMaterial);
  noseMesh.name = 'Nose';
  noseMesh.position.set(0, 0.88, 1.07);
  noseMesh.scale.set(1.35, 0.72, 0.6);
  totoro.add(noseMesh);

  // 8. Cheeks (Pink Blush)
  function createBlush(isLeft) {
    const sign = isLeft ? -1 : 1;
    const blushGeo = new THREE.SphereGeometry(0.14, 24, 16);
    const blushMesh = new THREE.Mesh(blushGeo, blushMaterial);
    blushMesh.position.set(sign * 0.76, 0.72, 0.78);
    blushMesh.scale.set(1.0, 0.65, 0.35);
    blushMesh.rotation.y = sign * 0.55;
    blushMesh.name = isLeft ? 'LeftBlush' : 'RightBlush';
    return blushMesh;
  }
  totoro.add(createBlush(true));
  totoro.add(createBlush(false));

  // 9. Whiskers (3 on each cheek)
  function createWhiskers(isLeft) {
    const group = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    const angles = [0.15, 0.0, -0.15];
    const yOffsets = [0.06, 0.0, -0.06];

    angles.forEach((ang, idx) => {
      const whiskerGeo = new THREE.CylinderGeometry(0.012, 0.007, 0.55, 12);
      const whiskerMesh = new THREE.Mesh(whiskerGeo, darkMaterial);
      whiskerMesh.name = `Whisker_${sign > 0 ? 'R' : 'L'}_${idx}`;
      whiskerMesh.position.set(sign * 0.28, yOffsets[idx], 0);
      whiskerMesh.rotation.z = Math.PI / 2 + sign * ang;
      whiskerMesh.rotation.y = sign * 0.15;
      group.add(whiskerMesh);
    });

    group.position.set(sign * 0.82, 0.76, 0.68);
    group.name = isLeft ? 'LeftWhiskers' : 'RightWhiskers';
    return group;
  }
  totoro.add(createWhiskers(true));
  totoro.add(createWhiskers(false));

  // 10. Arms
  function createArm(isLeft) {
    const sign = isLeft ? -1 : 1;
    const armGroup = new THREE.Group();
    armGroup.name = isLeft ? 'LeftArm' : 'RightArm';

    // Arm cylinder / capsule
    const armGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.85, 24);
    const armMesh = new THREE.Mesh(armGeo, furMaterial);
    armMesh.position.y = -0.35;
    armGroup.add(armMesh);

    // Shoulder sphere
    const shoulderGeo = new THREE.SphereGeometry(0.24, 20, 16);
    const shoulderMesh = new THREE.Mesh(shoulderGeo, furMaterial);
    armGroup.add(shoulderMesh);

    // Hand sphere
    const handGeo = new THREE.SphereGeometry(0.18, 20, 16);
    const handMesh = new THREE.Mesh(handGeo, furMaterial);
    handMesh.position.y = -0.75;
    armGroup.add(handMesh);

    // Tiny dark claws (3 claws)
    for (let i = -1; i <= 1; i++) {
      const clawGeo = new THREE.ConeGeometry(0.025, 0.08, 12);
      const clawMesh = new THREE.Mesh(clawGeo, clawMaterial);
      clawMesh.position.set(i * 0.06, -0.92, 0.08);
      clawMesh.rotation.x = 0.4;
      armGroup.add(clawMesh);
    }

    armGroup.position.set(sign * 1.18, 0.25, 0.12);
    armGroup.rotation.z = sign * 0.22;
    armGroup.rotation.y = -sign * 0.15;
    return armGroup;
  }
  totoro.add(createArm(true));
  totoro.add(createArm(false));

  // 11. Feet (Sitting position with pads & claws)
  function createFoot(isLeft) {
    const sign = isLeft ? -1 : 1;
    const footGroup = new THREE.Group();
    footGroup.name = isLeft ? 'LeftFoot' : 'RightFoot';

    // Main foot oval
    const footGeo = new THREE.SphereGeometry(0.32, 24, 18);
    const footMesh = new THREE.Mesh(footGeo, furMaterial);
    footMesh.scale.set(0.9, 0.65, 1.25);
    footGroup.add(footMesh);

    // Paw pad underneath
    const padGeo = new THREE.SphereGeometry(0.18, 20, 16);
    const padMesh = new THREE.Mesh(padGeo, padMaterial);
    padMesh.position.set(0, -0.05, 0.15);
    padMesh.scale.set(1.0, 0.3, 1.2);
    footGroup.add(padMesh);

    // 3 Claws on toes
    for (let i = -1; i <= 1; i++) {
      const clawGeo = new THREE.ConeGeometry(0.035, 0.10, 12);
      const clawMesh = new THREE.Mesh(clawGeo, clawMaterial);
      clawMesh.position.set(i * 0.11, -0.06, 0.40);
      clawMesh.rotation.x = Math.PI / 2.3;
      footGroup.add(clawMesh);
    }

    footGroup.position.set(sign * 0.54, -1.08, 0.58);
    footGroup.rotation.y = sign * 0.22;
    return footGroup;
  }
  totoro.add(createFoot(true));
  totoro.add(createFoot(false));

  // 12. Tail
  const tailGeo = new THREE.SphereGeometry(0.36, 24, 20);
  const tailMesh = new THREE.Mesh(tailGeo, furMaterial);
  tailMesh.name = 'Tail';
  tailMesh.position.set(0, -0.88, -0.92);
  tailMesh.scale.set(1.0, 0.9, 1.1);
  totoro.add(tailMesh);

  // 13. Soft Ground Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(1.4, 48);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.18,
    transparent: true,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.name = 'GroundShadow';
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -1.26, 0);
  totoro.add(shadowMesh);

  scene.add(totoro);
  return scene;
}

const scene = createTotoroScene();
const outputDir = path.join(__dirname, '..', 'assets', 'models');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Export as Three.js native JSON model
const jsonPath = path.join(outputDir, 'totoro.json');
fs.writeFileSync(jsonPath, JSON.stringify(scene.toJSON(), null, 2));
console.log(`Successfully generated 3D Totoro JSON model at: ${jsonPath}`);

module.exports = { createTotoroScene };
