import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { lenis } from './scroller.js'
import { gsap } from 'gsap'

// DOM Elements
const container = document.getElementById('garage-viewport')
const loadingOverlay = document.getElementById('garage-loading')
const modeButtons = document.querySelectorAll('[data-garage-mode]')
const instructionPanels = document.querySelectorAll('.hud-instructions')
const studioAngleButtons = document.querySelectorAll('[data-studio-angle]')
const kitHotspotButtons = document.querySelectorAll('[data-kit-hotspot]')
const hudSpeed = document.getElementById('drive-speed')
const hudGear = document.getElementById('drive-gear')

// Main Telemetry elements for integration
const telemetrySpeed = document.getElementById('telemetry-speed')
const telemetryGear = document.getElementById('telemetry-gear')
const telemetryRpm = document.getElementById('telemetry-rpm')

if (container) {
  let currentMode = 'studio' // studio, kit, drive
  let scene, camera, renderer, controls
  let car, environmentGrid, trackLine
  let rearRainLight, rainLightGlow
  
  // Physics / Driving state
  const keys = { w: false, a: false, s: false, d: false, space: false }
  let carPosition = new THREE.Vector3(0, 0, 0)
  let carRotation = 0 // Yaw rotation in radians
  let currentSpeed = 0
  const maxSpeed = 0.85 
  const acceleration = 0.012 
  const drag = 0.97 
  const brakeFriction = 0.82 
  let steerAngle = 0
  const maxSteerAngle = 0.05 
  let currentGear = 1
  let currentRpm = 1000

  // Camera settings
  const targetCameraPos = new THREE.Vector3()
  let activeStudioAngle = 'cinematic'

  // Initialize Three.js
  init()

  function init() {
    // 1. Scene setup
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x111111, 0.015)

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.set(8, 4, 10)

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    // PMREM Generator for realistic room environment reflections (clearcoat paint shine!)
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

    // 4. Orbit Controls (for Kit / Studio mode)
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.05 
    controls.minDistance = 3
    controls.maxDistance = 25
    controls.target.set(0, 0.5, 0)

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.8)
    mainLight.position.set(10, 15, 5)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.bias = -0.0005
    scene.add(mainLight)

    // Glowing Neon red lights for garage look
    const redLight1 = new THREE.PointLight(0xe10600, 4, 25)
    redLight1.position.set(-10, 4, -10)
    scene.add(redLight1)

    const redLight2 = new THREE.PointLight(0xe10600, 4, 25)
    redLight2.position.set(10, 4, 10)
    scene.add(redLight2)

    // Overhead white LED strip lights
    const studioLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
    studioLight1.position.set(-5, 10, -5)
    scene.add(studioLight1)

    // 6. Ground & Track
    createGround()

    // 7. Procedural F1 Car Model
    createF1Car()

    // Hide Loading Screen
    if (loadingOverlay) {
      setTimeout(() => {
        loadingOverlay.style.opacity = 0
        loadingOverlay.style.pointerEvents = 'none'
        setTimeout(() => loadingOverlay.classList.add('hidden'), 500)
      }, 1000)
    }

    // 8. Event Listeners
    setupInputListeners()
    setupModeSwitcher()

    // Cinematic angle on load
    setStudioCameraAngle('cinematic')
    
    // 9. Start Render Loop
    renderer.setAnimationLoop(update)
  }

  // Create Ground grid and F1 track outline
  function createGround() {
    const floorGeo = new THREE.PlaneGeometry(250, 250)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.85,
      metalness: 0.15
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Dynamic grid overlay
    const grid = new THREE.GridHelper(250, 80, 0x440000, 0x222222)
    grid.position.y = 0.001
    scene.add(grid)

    // Create a circular glowing F1 race track line
    const trackPoints = []
    const segments = 128
    const radiusX = 65
    const radiusZ = 45
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      const rx = radiusX + Math.sin(theta * 3) * 10
      const rz = radiusZ + Math.cos(theta * 2) * 6
      trackPoints.push(new THREE.Vector3(Math.cos(theta) * rx, 0.002, Math.sin(theta) * rz))
    }

    const trackCurve = new THREE.CatmullRomCurve3(trackPoints)
    const trackGeo = new THREE.BufferGeometry().setFromPoints(trackCurve.getPoints(300))
    const trackMat = new THREE.LineBasicMaterial({ color: 0xe10600, linewidth: 3 })
    trackLine = new THREE.Line(trackGeo, trackMat)
    scene.add(trackLine)

    // Add curbs along track
    const curbPoints = trackCurve.getPoints(200)
    curbPoints.forEach((pt, idx) => {
      if (idx % 2 === 0) {
        const curbGeo = new THREE.BoxGeometry(2.0, 0.06, 0.5)
        const curbMat = new THREE.MeshStandardMaterial({
          color: idx % 4 === 0 ? 0xffffff : 0xe10600,
          emissive: idx % 4 === 0 ? 0x222222 : 0x550000,
          roughness: 0.4
        })
        const curb = new THREE.Mesh(curbGeo, curbMat)
        curb.position.copy(pt)
        curb.lookAt(idx < curbPoints.length - 1 ? curbPoints[idx + 1] : curbPoints[0])
        curb.rotation.y += Math.PI / 2
        scene.add(curb)
      }
    })
  }

  // Construct High-Fidelity Procedural F1 Car Model matching the Scuderia Ferrari HP livery details
  function createF1Car() {
    car = new THREE.Group()

    // 2026 SF-26 Rosso Scuderia physical shader paint with clearcoat
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xff1212, // Vibrant Ferrari racing red
      roughness: 0.1,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.3
    })

    // Carbon fiber elements / physical details
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

    // 1. Chassis Main Body (Slender 2026 monocoque structure)
    const chassisGeo = new THREE.BoxGeometry(0.70, 0.36, 3.4)
    const chassis = new THREE.Mesh(chassisGeo, bodyMat)
    chassis.position.y = 0.32
    chassis.castShadow = true
    chassis.receiveShadow = true
    car.add(chassis)

    // Nose Cone (Pointy and slanted downwards with connection tabs)
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

    // Nose Driver Number Plate (#16 / #44)
    const numPlateGeo = new THREE.BoxGeometry(0.18, 0.02, 0.22)
    const numPlate = new THREE.Mesh(numPlateGeo, whiteLiveryMat)
    numPlate.position.set(0, 0.32, 1.4)
    car.add(numPlate)

    // Driver Number representation
    const numShapeGeo = new THREE.BoxGeometry(0.1, 0.03, 0.12)
    const numShape = new THREE.Mesh(numShapeGeo, carbonMat)
    numShape.position.set(0, 0.322, 1.4)
    car.add(numShape)

    // Nose Cameras (Small carbon wings on nose tip)
    const cameraHousingLGeo = new THREE.BoxGeometry(0.08, 0.04, 0.08)
    const cameraHousingL = new THREE.Mesh(cameraHousingLGeo, carbonMat)
    cameraHousingL.position.set(-0.25, 0.24, 2.3)
    car.add(cameraHousingL)

    const cameraHousingR = cameraHousingL.clone()
    cameraHousingR.position.x = 0.25
    car.add(cameraHousingR)

    // 2. Aerodynamic Undercut Sidepods (Crucial 2026 radiator packaging look)
    const podLGeo = new THREE.BoxGeometry(0.3, 0.36, 1.7)
    const podL = new THREE.Mesh(podLGeo, bodyMat)
    podL.position.set(-0.44, 0.29, -0.1)
    podL.castShadow = true
    car.add(podL)

    const podR = podL.clone()
    podR.position.x = 0.44
    car.add(podR)

    // Intake Openings (Black recessed indicators on front of sidepods)
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

    // Shell sponsor logo (yellow box with red center) on sidepods
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

    // Engine Cover Shark Fin
    const sharkFinGeo = new THREE.BoxGeometry(0.04, 0.65, 1.2)
    const sharkFin = new THREE.Mesh(sharkFinGeo, bodyMat)
    sharkFin.position.set(0, 0.72, -0.65)
    sharkFin.castShadow = true
    car.add(sharkFin)

    // Serrated top edge on the engine fin (SF-26 signature detailing)
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

    // Engine HP logo branding circles
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

    // Exhaust Pipe at the rear center
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16)
    const exhaust = new THREE.Mesh(exhaustGeo, metalMat)
    exhaust.rotation.x = Math.PI / 2
    exhaust.position.set(0, 0.28, -1.5)
    car.add(exhaust)

    // 3. Multi-element Front Wing (3 distinct elements instead of one block)
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

    // 4. Rear Wing (Sleek aerodynamic DRS spoiler)
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

    // DRS Actuator mechanism (small block in rear wing center)
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

    // 5. Cockpit & Driver Details
    const cockpitOpening = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.75), carbonMat)
    cockpitOpening.position.set(0, 0.48, 0.2)
    car.add(cockpitOpening)

    // Interactive Steering Wheel (Rectangular with glowing LCD screen and buttons)
    const wheelFrameGeo = new THREE.BoxGeometry(0.18, 0.1, 0.03)
    const steeringWheel = new THREE.Mesh(wheelFrameGeo, carbonMat)
    steeringWheel.position.set(0, 0.44, 0.42)
    steeringWheel.rotation.x = -0.35 // Angled towards driver
    
    // LCD Screen
    const screenGeo = new THREE.BoxGeometry(0.08, 0.05, 0.01)
    const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ color: 0x00ff44 }))
    screen.position.set(0, 0.01, 0.015)
    steeringWheel.add(screen)
    car.add(steeringWheel)

    // Driver Helmet
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), goldMat)
    helmet.position.set(0, 0.54, -0.05)
    helmet.castShadow = true
    car.add(helmet)

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.18), carbonMat)
    visor.position.set(0, 0.54, 0.08)
    car.add(visor)

    // White halo protection loop
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 8, 24, Math.PI), whiteLiveryMat)
    halo.rotation.x = -Math.PI / 6
    halo.position.set(0, 0.46, 0.35)
    halo.castShadow = true
    car.add(halo)

    const haloCenterSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28), whiteLiveryMat)
    haloCenterSupport.position.set(0, 0.4, 0.55)
    haloCenterSupport.rotation.x = -0.35
    car.add(haloCenterSupport)

    // Aerodynamic fairing winglets on top of halo sides
    const haloWingletL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.15), carbonMat)
    haloWingletL.position.set(-0.25, 0.54, 0.25)
    haloWingletL.rotation.y = 0.2
    car.add(haloWingletL)

    const haloWingletR = haloWingletL.clone()
    haloWingletR.position.x = 0.25
    haloWingletR.rotation.y = -0.2
    car.add(haloWingletR)

    // Aerodynamic Rear View Mirrors on chassis sides
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

    // 6. Rear F1 Blinking Rain Light
    const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08)
    const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    rearRainLight = new THREE.Mesh(rainLightGeo, rainLightMat)
    rearRainLight.position.set(0, 0.2, -1.68)
    car.add(rearRainLight)

    rainLightGlow = new THREE.PointLight(0xff0000, 3, 4)
    rainLightGlow.position.set(0, 0.2, -1.72)
    car.add(rainLightGlow)

    // 7. Wheels & Suspension Setup
    const wheelPositions = [
      { x: -0.92, y: 0.32, z: 1.2, radius: 0.34, width: 0.38, front: true },  // FL
      { x: 0.92, y: 0.32, z: 1.2, radius: 0.34, width: 0.38, front: true },   // FR
      { x: -0.96, y: 0.36, z: -1.0, radius: 0.38, width: 0.48, front: false }, // RL
      { x: 0.96, y: 0.36, z: -1.0, radius: 0.38, width: 0.48, front: false }  // RR
    ]

    car.wheels = []

    wheelPositions.forEach((pos, idx) => {
      const wheelGroup = new THREE.Group()
      wheelGroup.position.set(pos.x, pos.y, pos.z)
      
      const tireGeo = new THREE.CylinderGeometry(pos.radius, pos.radius, pos.width, 32)
      const tire = new THREE.Mesh(tireGeo, tireMat)
      tire.rotation.z = Math.PI / 2
      tire.castShadow = true
      wheelGroup.add(tire)

      const rimGeo = new THREE.CylinderGeometry(pos.radius * 0.58, pos.radius * 0.58, pos.width + 0.01, 24)
      const rim = new THREE.Mesh(rimGeo, carbonMat)
      rim.rotation.z = Math.PI / 2
      wheelGroup.add(rim)

      // Spoke details inside rim (5 cylinders radiating outwards)
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, pos.radius * 0.58)
        const spoke = new THREE.Mesh(spokeGeo, carbonMat)
        spoke.rotation.x = (s / 5) * Math.PI * 2
        spoke.position.x = 0
        wheelGroup.add(spoke)
      }

      // Left vs Right thread wheel nuts (Red nut on left, Blue nut on right!)
      const nutColor = pos.x < 0 ? 0xff0000 : 0x0033ff
      const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, pos.width + 0.02, 12)
      const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: nutColor, metalness: 0.9, roughness: 0.1 }))
      hub.rotation.z = Math.PI / 2
      wheelGroup.add(hub)

      // Yellow ring decals (Pirelli tire compounds)
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

      // Carbon wishbone suspensions
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

    // Carbon fiber floor assembly extending wider than chassis (Ground effect floor fences)
    const floorPlateGeo = new THREE.BoxGeometry(1.4, 0.02, 2.2)
    const floorPlate = new THREE.Mesh(floorPlateGeo, carbonMat)
    floorPlate.position.set(0, 0.16, -0.2)
    floorPlate.castShadow = true
    floorPlate.receiveShadow = true
    car.add(floorPlate)

    // Vertical floor fences (slits on sides)
    const floorFenceL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 1.4), carbonMat)
    floorFenceL.position.set(-0.7, 0.18, -0.2)
    car.add(floorFenceL)

    const floorFenceR = floorFenceL.clone()
    floorFenceR.position.x = 0.7
    car.add(floorFenceR)

    // 8. Bottom LED strip underglow
    const glowGeo = new THREE.BoxGeometry(0.65, 0.02, 1.9)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff1212 })
    const underglow = new THREE.Mesh(glowGeo, glowMat)
    underglow.position.set(0, 0.05, 0)
    car.add(underglow)

    scene.add(car)
  }

  // Setup Keyboard Listeners using standard codes and key values (with console logs)
  function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase()
      console.log('F1 Keydown input caught:', e.key, e.code)
      
      if (key === 'w' || e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true
      if (key === 's' || e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true
      if (key === 'a' || e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true
      if (key === 'd' || e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true
      if (key === ' ' || e.code === 'Space') keys.space = true

      // Focus window focus prevention
      if (currentMode === 'drive' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    })

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase()
      if (key === 'w' || e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false
      if (key === 's' || e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false
      if (key === 'a' || e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false
      if (key === 'd' || e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false
      if (key === ' ' || e.code === 'Space') keys.space = false
    })

    // Set keyboard focus on window when clicking the viewport
    container.addEventListener('click', () => {
      window.focus()
      console.log('Garage viewport focused for keyboard inputs')
    })
  }

  // Set up Studio, Kit, and Drive switcher
  function setupModeSwitcher() {
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeButtons.forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        
        currentMode = btn.getAttribute('data-garage-mode')
        
        instructionPanels.forEach((p) => p.classList.remove('active'))
        const activeInstruction = document.getElementById(`instructions-${currentMode}`)
        if (activeInstruction) activeInstruction.classList.add('active')
        
        if (currentMode === 'drive') {
          controls.enabled = false
          gsap.killTweensOf(camera.position)
          gsap.killTweensOf(controls.target)
          
          car.position.set(0, 0, 0)
          carPosition.set(0, 0, 0)
          currentSpeed = 0
          carRotation = 0
          window.focus()
        } else {
          controls.enabled = true
          controls.target.set(car.position.x, 0.5, car.position.z)
          
          if (currentMode === 'studio') {
            setStudioCameraAngle('cinematic')
          }
        }
      })
    })

    studioAngleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        studioAngleButtons.forEach((b) => b.classList.remove('active'))
        btn.classList.add('active')
        activeStudioAngle = btn.getAttribute('data-studio-angle')
        setStudioCameraAngle(activeStudioAngle)
      })
    })

    kitHotspotButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const part = btn.getAttribute('data-kit-hotspot')
        focusKitPart(part)
      })
    })
  }

  function setStudioCameraAngle(angle) {
    if (currentMode !== 'studio') return
    
    let targetPos = new THREE.Vector3()
    let targetLook = new THREE.Vector3(car.position.x, 0.5, car.position.z)

    if (angle === 'cinematic') {
      targetPos.set(car.position.x + 6, 2.2, car.position.z + 5)
    } else if (angle === 'top') {
      targetPos.set(car.position.x, 9, car.position.z)
    } else if (angle === 'cockpit') {
      targetPos.set(car.position.x, 0.8, car.position.z + 0.1)
      targetLook.set(car.position.x, 0.7, car.position.z + 2.5)
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        controls.target.copy(targetLook)
      }
    })
  }

  function focusKitPart(part) {
    if (currentMode !== 'kit') return
    
    let targetPos = new THREE.Vector3()
    let targetLook = new THREE.Vector3()

    if (part === 'aero') {
      targetPos.set(car.position.x - 2.5, 0.8, car.position.z + 3)
      targetLook.set(car.position.x, 0.2, car.position.z + 2.2)
    } else if (part === 'engine') {
      targetPos.set(car.position.x + 2.5, 1.2, car.position.z - 1.2)
      targetLook.set(car.position.x, 0.5, car.position.z - 0.8)
    } else if (part === 'suspension') {
      targetPos.set(car.position.x + 1.8, 0.6, car.position.z + 1.2)
      targetLook.set(car.position.x + 0.9, 0.3, car.position.z + 1.1)
    }

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        controls.target.copy(targetLook)
      }
    })
  }

  // Physics Update & Render loop
  function update(time, frame) {
    // 1. Blinking rear rain light (150ms frequency F1-style)
    const isLit = Math.floor(time / 150) % 2 === 0
    if (rearRainLight && rainLightGlow) {
      rearRainLight.material.color.setHex(isLit ? 0xff0000 : 0x220000)
      rainLightGlow.intensity = isLit ? 3 : 0
    }

    // 2. Studio Mode auto rotation
    if (currentMode === 'studio' && activeStudioAngle === 'cinematic') {
      car.rotation.y = time * 0.00015
    } else if (currentMode !== 'studio') {
      car.rotation.y = carRotation
    }

    // 3. Drive Mode Physics Calculations
    if (currentMode === 'drive') {
      const wPressed = keys.w
      const sPressed = keys.s
      const aPressed = keys.a
      const dPressed = keys.d
      const isBraking = keys.space

      // Acceleration / Drag
      if (wPressed) {
        currentSpeed += acceleration
        if (currentSpeed > maxSpeed) currentSpeed = maxSpeed
      } else if (sPressed) {
        currentSpeed -= acceleration
        if (currentSpeed < -maxSpeed * 0.35) currentSpeed = -maxSpeed * 0.35
      } else {
        currentSpeed *= drag
      }

      // Brake / Drift friction
      if (isBraking) {
        currentSpeed *= brakeFriction
      }

      // Steering
      if (Math.abs(currentSpeed) > 0.01) {
        const steeringMultiplier = Math.sign(currentSpeed) * (1 - Math.abs(currentSpeed) * 0.3)
        
        if (aPressed) {
          steerAngle += 0.006
          if (steerAngle > maxSteerAngle) steerAngle = maxSteerAngle
        } else if (dPressed) {
          steerAngle -= 0.006
          if (steerAngle < -maxSteerAngle) steerAngle = -maxSteerAngle
        } else {
          steerAngle *= 0.7 // Self-centering steering
        }
        
        carRotation += steerAngle * steeringMultiplier
      } else {
        steerAngle *= 0.5
      }

      // Update position vector
      carPosition.x += Math.sin(carRotation) * currentSpeed
      carPosition.z += Math.cos(carRotation) * currentSpeed
      car.position.copy(carPosition)

      // Spin tires based on velocity
      car.wheels.forEach((wheel, index) => {
        wheel.children[0].rotation.x += currentSpeed / 0.34
        
        // Pivot front wheels when steering (FL and FR wheels)
        if (index < 2) {
          wheel.rotation.y = steerAngle * 4.5
        }
      })

      // 4. Follow Camera calculations (smooth lerp damping behind the car)
      const followOffsetDistance = 4.8
      const followHeight = 1.35
      
      const offsetX = -Math.sin(carRotation) * followOffsetDistance
      const offsetZ = -Math.cos(carRotation) * followOffsetDistance
      
      targetCameraPos.set(
        car.position.x + offsetX,
        car.position.y + followHeight,
        car.position.z + offsetZ
      )

      camera.position.lerp(targetCameraPos, 0.08)
      
      const cameraLookAt = new THREE.Vector3(
        car.position.x + Math.sin(carRotation) * 1.5,
        car.position.y + 0.3,
        car.position.z + Math.cos(carRotation) * 1.5
      )
      camera.lookAt(cameraLookAt)

      // 5. Update HUD and main Live Telemetry values
      const speedKmh = Math.round(Math.abs(currentSpeed) * 620)
      if (hudSpeed) hudSpeed.textContent = speedKmh
      
      if (speedKmh === 0) {
        currentGear = 'N'
        currentRpm = 1100
      } else {
        currentGear = Math.min(8, Math.floor(speedKmh / 42) + 1)
        const gearMinSpeed = (currentGear - 1) * 42
        const gearRange = 42
        const gearPercentage = (speedKmh - gearMinSpeed) / gearRange
        currentRpm = Math.round(9000 + gearPercentage * 3200)
      }
      
      if (hudGear) hudGear.textContent = currentGear

      // Direct binding to Live Telemetry Dials
      if (telemetrySpeed) telemetrySpeed.textContent = speedKmh
      if (telemetryGear) telemetryGear.textContent = currentGear
      if (telemetryRpm) telemetryRpm.textContent = currentRpm.toLocaleString()
    } else {
      if (currentMode === 'studio') {
        car.wheels.forEach((wheel) => {
          wheel.children[0].rotation.x += 0.005
        })
      }
      controls.update()
    }

    // Render Scene
    renderer.render(scene, camera)
  }
}
