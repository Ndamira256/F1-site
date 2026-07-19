// Isolated Three.js Procedural F1 Car Model (Scuderia Ferrari SF-26 Livery Design)
// Compatible with Three.js (v0.140.0+)
// Uses standard geometries and THREE.MeshPhysicalMaterial / THREE.MeshStandardMaterial

function createF1Car(scene) {
  const car = new THREE.Group()

  // --- MATERIAL DEFINITIONS ---
  
  // 2026 SF-26 Rosso Scuderia paint with high-clearcoat reflections
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xff1212, // Vibrant Ferrari racing red
    roughness: 0.1,
    metalness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.3
  })

  // Matte/Gloss carbon fiber weave material
  const carbonMat = new THREE.MeshPhysicalMaterial({
    color: 0x090909,
    roughness: 0.4,
    metalness: 0.35,
    clearcoat: 0.5,
    clearcoatRoughness: 0.15
  })

  // White sponsor decals livery color
  const whiteLiveryMat = new THREE.MeshPhysicalMaterial({
    color: 0xf3f3f0,
    roughness: 0.12,
    metalness: 0.08,
    clearcoat: 0.8,
    clearcoatRoughness: 0.06
  })

  // Yellow highlights (Shell branding / Pirelli hard compounds)
  const yellowLiveryMat = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.1,
    metalness: 0.1
  })

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.08,
    metalness: 0.95
  })

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1c,
    roughness: 0.78,
    metalness: 0.02
  })

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.06,
    metalness: 0.95
  })


  // --- 1. CHASSIS & NOSE ASSEMBLY ---

  // Main Monocoque
  const chassisGeo = new THREE.BoxGeometry(0.70, 0.36, 3.4)
  const chassis = new THREE.Mesh(chassisGeo, bodyMat)
  chassis.position.y = 0.32
  chassis.castShadow = true
  chassis.receiveShadow = true
  car.add(chassis)

  // Pointy Nose Cone
  const noseGeo = new THREE.ConeGeometry(0.24, 1.3, 4)
  const nose = new THREE.Mesh(noseGeo, bodyMat)
  nose.rotation.x = Math.PI / 2 + 0.05
  nose.rotation.y = Math.PI / 4 // Align flat faces
  nose.position.set(0, 0.22, 1.95)
  nose.scale.set(1, 0.8, 0.38)
  nose.castShadow = true
  car.add(nose)

  // Central white livery block on nose cone
  const noseStripeGeo = new THREE.BoxGeometry(0.20, 0.03, 1.25)
  const noseStripe = new THREE.Mesh(noseStripeGeo, whiteLiveryMat)
  noseStripe.position.set(0, 0.26, 1.8)
  noseStripe.rotation.x = 0.05
  car.add(noseStripe)

  // Nose Driver Number Plate
  const numPlateGeo = new THREE.BoxGeometry(0.18, 0.02, 0.22)
  const numPlate = new THREE.Mesh(numPlateGeo, whiteLiveryMat)
  numPlate.position.set(0, 0.32, 1.4)
  car.add(numPlate)

  // Driver Number backing shape
  const numShapeGeo = new THREE.BoxGeometry(0.1, 0.03, 0.12)
  const numShape = new THREE.Mesh(numShapeGeo, carbonMat)
  numShape.position.set(0, 0.322, 1.4)
  car.add(numShape)

  // Nose Cameras
  const cameraHousingLGeo = new THREE.BoxGeometry(0.08, 0.04, 0.08)
  const cameraHousingL = new THREE.Mesh(cameraHousingLGeo, carbonMat)
  cameraHousingL.position.set(-0.25, 0.24, 2.3)
  car.add(cameraHousingL)

  const cameraHousingR = cameraHousingL.clone()
  cameraHousingR.position.x = 0.25
  car.add(cameraHousingR)


  // --- 2. SIDEPODS & ENGINE COVER ---

  // Sidepods Left & Right
  const podLGeo = new THREE.BoxGeometry(0.3, 0.36, 1.7)
  const podL = new THREE.Mesh(podLGeo, bodyMat)
  podL.position.set(-0.44, 0.29, -0.1)
  podL.castShadow = true
  car.add(podL)

  const podR = podL.clone()
  podR.position.x = 0.44
  car.add(podR)

  // Sidepod Intake Openings
  const intakeGeo = new THREE.BoxGeometry(0.24, 0.26, 0.02)
  const intakeL = new THREE.Mesh(intakeGeo, carbonMat)
  intakeL.position.set(-0.44, 0.32, 0.76)
  car.add(intakeL)

  const intakeR = intakeL.clone()
  intakeR.position.x = 0.44
  car.add(intakeR)

  // White sidepod-top panel overlays
  const sponsorStripeLGeo = new THREE.BoxGeometry(0.06, 0.2, 1.3)
  const sponsorStripeL = new THREE.Mesh(sponsorStripeLGeo, whiteLiveryMat)
  sponsorStripeL.position.set(-0.585, 0.3, -0.1)
  car.add(sponsorStripeL)

  const sponsorStripeR = sponsorStripeL.clone()
  sponsorStripeR.position.x = 0.585
  car.add(sponsorStripeR)

  // Shell sponsor logos
  const shellLogoLGeo = new THREE.BoxGeometry(0.025, 0.12, 0.12)
  const shellLogoL = new THREE.Mesh(shellLogoLGeo, yellowLiveryMat)
  shellLogoL.position.set(-0.61, 0.29, 0.6)
  car.add(shellLogoL)

  const shellLogoLInner = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.06), bodyMat)
  shellLogoLInner.position.set(-0.61, 0.29, 0.6)
  car.add(shellLogoLInner)

  const shellLogoR = shellLogoL.clone()
  shellLogoR.position.x = 0.61
  car.add(shellLogoR)

  const shellLogoRInner = shellLogoLInner.clone()
  shellLogoRInner.position.x = 0.61
  car.add(shellLogoRInner)

  // Engine Cover Fin
  const sharkFinGeo = new THREE.BoxGeometry(0.04, 0.65, 1.2)
  const sharkFin = new THREE.Mesh(sharkFinGeo, bodyMat)
  sharkFin.position.set(0, 0.72, -0.65)
  sharkFin.castShadow = true
  car.add(sharkFin)

  // Serrated top edge on the engine fin (9 teeth)
  const toothCount = 9
  for (let i = 0; i < toothCount; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 3), carbonMat)
    tooth.position.set(0, 1.05, -1.1 + i * 0.15)
    tooth.rotation.x = Math.PI / 2
    tooth.rotation.y = Math.PI / 6
    tooth.castShadow = true
    car.add(tooth)
  }

  // Engine Cover White Panel Overlay
  const engineCoverPanel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 1.0), whiteLiveryMat)
  engineCoverPanel.position.set(0, 0.53, -0.5)
  car.add(engineCoverPanel)

  // HP logo circles
  const hpCircleL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 16), whiteLiveryMat)
  hpCircleL.rotation.z = Math.PI / 2
  hpCircleL.position.set(-0.25, 0.55, -0.45)
  car.add(hpCircleL)

  const hpCircleR = hpCircleL.clone()
  hpCircleR.position.x = 0.25
  car.add(hpCircleR)

  const hpInnerCircleL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.024, 16), new THREE.MeshBasicMaterial({ color: 0x0096ff }))
  hpInnerCircleL.rotation.z = Math.PI / 2
  hpInnerCircleL.position.set(-0.25, 0.55, -0.45)
  car.add(hpInnerCircleL)

  const hpInnerCircleR = hpInnerCircleL.clone()
  hpInnerCircleR.position.x = 0.25
  car.add(hpInnerCircleR)

  // Exhaust pipe
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16)
  const exhaust = new THREE.Mesh(exhaustGeo, metalMat)
  exhaust.rotation.x = Math.PI / 2
  exhaust.position.set(0, 0.28, -1.5)
  car.add(exhaust)


  // --- 3. AERODYNAMIC WINGS & FLOOR ---

  // Multi-element Front Wing
  const frontWingMain = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.02, 0.15), carbonMat)
  frontWingMain.position.set(0, 0.06, 2.45)
  frontWingMain.castShadow = true
  car.add(frontWingMain)

  const frontWingFlap1 = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.02, 0.12), whiteLiveryMat)
  frontWingFlap1.position.set(0, 0.09, 2.54)
  frontWingFlap1.rotation.x = 0.08
  car.add(frontWingFlap1)

  const frontWingFlap2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.015, 0.10), whiteLiveryMat)
  frontWingFlap2.position.set(0, 0.12, 2.62)
  frontWingFlap2.rotation.x = 0.14
  car.add(frontWingFlap2)

  const endplateL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.55), bodyMat)
  endplateL.position.set(-1.05, 0.18, 2.5)
  endplateL.castShadow = true
  car.add(endplateL)

  const endplateR = endplateL.clone()
  endplateR.position.x = 1.05
  car.add(endplateR)

  // Rear Wing
  const wingPillL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.35), carbonMat)
  wingPillL.position.set(-0.2, 0.6, -1.45)
  wingPillL.rotation.x = -Math.PI / 10
  wingPillL.castShadow = true
  car.add(wingPillL)

  const wingPillR = wingPillL.clone()
  wingPillR.position.x = 0.2
  car.add(wingPillR)

  const rearWingMain = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.48), carbonMat)
  rearWingMain.position.set(0, 0.98, -1.5)
  rearWingMain.castShadow = true
  car.add(rearWingMain)

  const rearWingFlap = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.04, 0.2), whiteLiveryMat)
  rearWingFlap.position.set(0, 1.02, -1.42)
  rearWingFlap.rotation.x = 0.15
  car.add(rearWingFlap)

  // DRS Actuator
  const drsActuator = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), carbonMat)
  drsActuator.position.set(0, 1.0, -1.46)
  car.add(drsActuator)

  const rearWingEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.65, 0.6), bodyMat)
  rearWingEndL.position.set(-0.75, 0.8, -1.5)
  rearWingEndL.castShadow = true
  car.add(rearWingEndL)

  const rearWingEndR = rearWingEndL.clone()
  rearWingEndR.position.x = 0.75
  car.add(rearWingEndR)

  // Ground Effect Floor Plate
  const floorPlateGeo = new THREE.BoxGeometry(1.4, 0.02, 2.2)
  const floorPlate = new THREE.Mesh(floorPlateGeo, carbonMat)
  floorPlate.position.set(0, 0.16, -0.2)
  floorPlate.castShadow = true
  floorPlate.receiveShadow = true
  car.add(floorPlate)

  // Floor fences
  const floorFenceL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 1.4), carbonMat)
  floorFenceL.position.set(-0.7, 0.18, -0.2)
  car.add(floorFenceL)

  const floorFenceR = floorFenceL.clone()
  floorFenceR.position.x = 0.7
  car.add(floorFenceR)


  // --- 4. COCKPIT INTERIOR & DRIVER ---

  const cockpitOpening = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.75), carbonMat)
  cockpitOpening.position.set(0, 0.48, 0.2)
  car.add(cockpitOpening)

  // F1 Steering Wheel
  const wheelFrameGeo = new THREE.BoxGeometry(0.18, 0.1, 0.03)
  const steeringWheel = new THREE.Mesh(wheelFrameGeo, carbonMat)
  steeringWheel.position.set(0, 0.44, 0.42)
  steeringWheel.rotation.x = -0.35
  
  // Steering LCD Screen
  const screenGeo = new THREE.BoxGeometry(0.08, 0.05, 0.01)
  const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0x00ff44 }))
  screen.position.set(0, 0.01, 0.015)
  steeringWheel.add(screen)
  car.add(steeringWheel)

  // Helmet
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldMat)
  helmet.position.set(0, 0.54, -0.05)
  helmet.castShadow = true
  car.add(helmet)

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.18), carbonMat)
  visor.position.set(0, 0.54, 0.08)
  car.add(visor)

  // Halo protection loop
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 24, Math.PI), whiteLiveryMat)
  halo.rotation.x = -Math.PI / 6
  halo.position.set(0, 0.46, 0.35)
  halo.castShadow = true
  car.add(halo)

  const haloCenterSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28), whiteLiveryMat)
  haloCenterSupport.position.set(0, 0.4, 0.55)
  haloCenterSupport.rotation.x = -0.35
  car.add(haloCenterSupport)

  // Halo Winglets
  const haloWingletL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.15), carbonMat)
  haloWingletL.position.set(-0.25, 0.54, 0.25)
  haloWingletL.rotation.y = 0.2
  car.add(haloWingletL)

  const haloWingletR = haloWingletL.clone()
  haloWingletR.position.x = 0.25
  haloWingletR.rotation.y = -0.2
  car.add(haloWingletR)

  // Rear View Mirrors
  const mirrorStemLGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2)
  const mirrorStemL = new THREE.Mesh(mirrorStemLGeo, carbonMat)
  mirrorStemL.rotation.z = Math.PI / 3
  mirrorStemL.position.set(-0.44, 0.44, 0.3)
  car.add(mirrorStemL)

  const mirrorBoxLGeo = new THREE.BoxGeometry(0.18, 0.08, 0.06)
  const mirrorBoxL = new THREE.Mesh(mirrorBoxLGeo, bodyMat)
  mirrorBoxL.position.set(-0.54, 0.49, 0.3)
  car.add(mirrorBoxL)

  const mirrorStemR = mirrorStemL.clone()
  mirrorStemR.rotation.z = -Math.PI / 3
  mirrorStemR.position.x = 0.44
  car.add(mirrorStemR)

  const mirrorBoxR = mirrorBoxL.clone()
  mirrorBoxR.position.x = 0.54
  car.add(mirrorBoxR)


  // --- 5. LED LIGHTS & RAIN LIGHTS ---

  // Blinking rain light mesh
  const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08)
  const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  const rainLightMesh = new THREE.Mesh(rainLightGeo, rainLightMat)
  rainLightMesh.position.set(0, 0.2, -1.68)
  car.add(rainLightMesh)

  // Red underglow LED strip
  const glowGeo = new THREE.BoxGeometry(0.65, 0.02, 1.9)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff1212 })
  const underglow = new THREE.Mesh(glowGeo, glowMat)
  underglow.position.set(0, 0.05, 0)
  car.add(underglow)


  // --- 6. WHEELS & SUSPENSIONS ---

  const wheelPositions = [
    { x: -0.92, y: 0.32, z: 1.2, radius: 0.34, width: 0.38, front: true },   // Front Left
    { x: 0.92, y: 0.32, z: 1.2, radius: 0.34, width: 0.38, front: true },    // Front Right
    { x: -0.96, y: 0.36, z: -1.0, radius: 0.38, width: 0.48, front: false }, // Rear Left
    { x: 0.96, y: 0.36, z: -1.0, radius: 0.38, width: 0.48, front: false }   // Rear Right
  ]

  car.wheels = []

  wheelPositions.forEach((pos, idx) => {
    const wheelGroup = new THREE.Group()
    wheelGroup.position.set(pos.x, pos.y, pos.z)
    
    // Tire cylinder
    const tireGeo = new THREE.CylinderGeometry(pos.radius, pos.radius, pos.width, 32)
    const tire = new THREE.Mesh(tireGeo, tireMat)
    tire.rotation.z = Math.PI / 2
    tire.castShadow = true
    wheelGroup.add(tire)

    // Rim base
    const rimGeo = new THREE.CylinderGeometry(pos.radius * 0.58, pos.radius * 0.58, pos.width + 0.01, 24)
    const rim = new THREE.Mesh(rimGeo, carbonMat)
    rim.rotation.z = Math.PI / 2
    wheelGroup.add(rim)

    // Rim spokes
    for (let s = 0; s < 5; s++) {
      const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, pos.radius * 0.58)
      const spoke = new THREE.Mesh(spokeGeo, carbonMat)
      spoke.rotation.x = (s / 5) * Math.PI * 2
      wheelGroup.add(spoke)
    }

    // Left threads (Red nut) vs Right threads (Blue nut)
    const nutColor = pos.x < 0 ? 0xff0000 : 0x0033ff
    const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, pos.width + 0.02, 12)
    const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: nutColor, metalness: 0.9, roughness: 0.1 }))
    hub.rotation.z = Math.PI / 2
    wheelGroup.add(hub)

    // Yellow Pirelli ring decals
    const ringGeo = new THREE.RingGeometry(pos.radius * 0.68, pos.radius * 0.72, 32)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide })
    const ringL = new THREE.Mesh(ringGeo, ringMat)
    ringL.position.x = -pos.width / 2 - 0.005
    ringL.rotation.y = Math.PI / 2
    wheelGroup.add(ringL)

    const ringR = ringL.clone()
    ringR.position.x = pos.width / 2 + 0.005
    ringR.rotation.y = -Math.PI / 2
    wheelGroup.add(ringR)

    car.add(wheelGroup)
    car.wheels.push(wheelGroup)

    // Suspensions
    const arm1Geo = new THREE.CylinderGeometry(0.02, 0.02, Math.abs(pos.x) - 0.35)
    const arm1 = new THREE.Mesh(arm1Geo, carbonMat)
    arm1.rotation.z = Math.PI / 2
    arm1.position.set(pos.x * 0.6, pos.y, pos.z)
    car.add(arm1)

    const arm2Geo = new THREE.CylinderGeometry(0.015, 0.015, Math.abs(pos.x) - 0.3)
    const arm2 = new THREE.Mesh(arm2Geo, carbonMat)
    arm2.rotation.z = Math.PI / 2 + 0.15 * Math.sign(pos.x)
    arm2.position.set(pos.x * 0.58, pos.y + 0.1, pos.z - 0.1)
    car.add(arm2)
  })

  // Add the car to the active scene
  scene.add(car)
  
  return car
}
