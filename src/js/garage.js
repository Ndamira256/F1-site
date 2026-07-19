import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
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

  // Performance: Lazy load the entire WebGL scene and 3D GLB model using a debounced IntersectionObserver.
  // This prevents CPU/main thread freezes during rapid scrolling.
  const garageSection = document.getElementById('scuderia-garage')
  if (garageSection) {
    let initTimeout
    let hasLoaded = false

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!hasLoaded) {
            window.addEventListener('scroll', onScrollDebounce, { passive: true })
            resetInitTimeout()
          }
        } else {
          clearTimeout(initTimeout)
          window.removeEventListener('scroll', onScrollDebounce)
        }
      })
    }, { rootMargin: '0px 0px 300px 0px' })

    observer.observe(garageSection)

    function resetInitTimeout() {
      clearTimeout(initTimeout)
      initTimeout = setTimeout(() => {
        if (!hasLoaded) {
          hasLoaded = true
          window.removeEventListener('scroll', onScrollDebounce)
          observer.disconnect()
          console.log('Scroll settled. Initializing WebGL context & 3D model parsing...')
          init()
        }
      }, 500)
    }

    function onScrollDebounce() {
      resetInitTimeout()
    }
  } else {
    init()
  }

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
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
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

    // Dedicated key light for the body diffuse highlights (PBR color definition)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(3, 5, 4)
    keyLight.castShadow = true
    scene.add(keyLight)

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

    // 7. Load GLB F1 Car Model
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

  // Load and configure the F1 3D GLB model
  function createF1Car() {
    car = new THREE.Group()
    scene.add(car)

    // 1. Create a temporary wireframe placeholder so the viewport works while the 27.8MB model loads
    const placeholderGeo = new THREE.BoxGeometry(0.7, 0.3, 2.5)
    const placeholderMat = new THREE.MeshBasicMaterial({ color: 0xe10600, wireframe: true })
    const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat)
    placeholder.position.y = 0.3
    car.add(placeholder)

    car.wheels = []
    car.rollingPivots = []

    // Red underglow LED strip
    const glowGeo = new THREE.BoxGeometry(0.65, 0.02, 1.9)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff1212 })
    const underglow = new THREE.Mesh(glowGeo, glowMat)
    underglow.position.set(0, 0.05, 0)
    car.add(underglow)

    // Blinking F1-style rain light at the rear exhaust position
    const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08)
    const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    rearRainLight = new THREE.Mesh(rainLightGeo, rainLightMat)
    rearRainLight.position.set(0, 0.25, -2.15)
    car.add(rearRainLight)

    rainLightGlow = new THREE.PointLight(0xff0000, 3, 4)
    rainLightGlow.position.set(0, 0.25, -2.2)
    car.add(rainLightGlow)

    // 2. Load the optimized Ferrari F1 GLB model with Draco compression (8.8MB)
    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)

    loader.load('/ferrari_f1_2019_opt.glb', (gltf) => {
      // Remove placeholder mesh
      car.remove(placeholder)

      const model = gltf.scene

      // Richer, slightly darker base red with clearcoat dielectric paint shader
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0xd60000,
        roughness: 0.35,
        metalness: 0.0, // Non-metallic dielectric (prevents environment reflections from crushing base color)
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        envMap: scene.environment,
        envMapIntensity: 1.0,
        emissive: 0x330000,
        emissiveIntensity: 0.15
      })

      // Enhance materials and enable shadows
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          
          if (child.material) {
            child.material.envMap = scene.environment
            child.material.envMapIntensity = 1.0 // Dial back general reflections

            const name = child.name.toLowerCase()
            if (name.includes('body') || name.includes('paint') || name.includes('red')) {
              child.material = bodyMat
            }
          }
        }
      })

      // 3. Auto-scale and align coordinates
      const box = new THREE.Box3().setFromObject(model)
      const size = new THREE.Vector3()
      box.getSize(size)
      
      // We expect the model length to be ~4.5 units along the Z axis
      let length = size.z
      let scaleFactor = 4.5 / length
      
      if (size.x > size.z) {
        length = size.x
        scaleFactor = 4.5 / length
        model.rotation.y = Math.PI / 2 // Correct alignment
      }
      
      model.scale.set(scaleFactor, scaleFactor, scaleFactor)
      
      // Center the model's bounding box
      const center = new THREE.Vector3()
      box.getCenter(center)
      model.position.sub(center.multiplyScalar(scaleFactor))
      
      // Sit the car directly on the ground grid
      model.position.y += size.y * scaleFactor * 0.5 - 0.04
      
      car.add(model)

      // Force recursive calculation of world matrices to ensure getWorldPosition() returns correct, fully-scaled coordinates!
      car.updateMatrixWorld(true)

      // 4. Dynamic Wheel Detection and Pivot Grouping
      const wheelCenters = []
      model.traverse((child) => {
        if (child.isMesh && child.name) {
          const name = child.name.toLowerCase()
          if (name.includes('tire') || name.includes('rim')) {
            const worldPos = new THREE.Vector3()
            child.getWorldPosition(worldPos)
            
            let found = false
            for (const center of wheelCenters) {
              if (center.distanceTo(worldPos) < 0.6) {
                found = true
                break
              }
            }
            if (!found) {
              wheelCenters.push(worldPos.clone())
            }
          }
        }
      })

      if (wheelCenters.length === 4) {
        // Sort wheel centers front-to-back
        wheelCenters.sort((a, b) => b.z - a.z)
        
        const fronts = [wheelCenters[0], wheelCenters[1]].sort((a, b) => a.x - b.x)
        const rears = [wheelCenters[2], wheelCenters[3]].sort((a, b) => a.x - b.x)
        
        const sortedCenters = [
          fronts[0], // FL
          fronts[1], // FR
          rears[0],  // RL
          rears[1]   // RR
        ]

        const pivots = []
        const rollingPivots = []
        sortedCenters.forEach((center) => {
          // Steering pivot handles steerAngle yaw (rotation.y)
          const steerPivot = new THREE.Group()
          steerPivot.position.copy(center)
          car.add(steerPivot)
          pivots.push(steerPivot)

          // Rolling pivot handles wheel speed roll (rotation.x)
          // Nesting this inside steerPivot ensures axes remain perfectly aligned during turning!
          const rollPivot = new THREE.Group()
          steerPivot.add(rollPivot)
          rollingPivots.push(rollPivot)
        })

        // Find all meshes belonging to wheels
        const meshesToMove = []
        model.traverse((child) => {
          if (child.isMesh && child.name) {
            const name = child.name.toLowerCase()
            if (name.includes('tire') || name.includes('rim') || name.includes('decal')) {
              // Ignore body decals
              if (name.includes('decal') && !name.includes('tire') && !name.includes('wheel')) {
                return
              }
              meshesToMove.push(child)
            }
          }
        })

        // Attach meshes to their closest nested rolling pivot
        meshesToMove.forEach((mesh) => {
          const worldPos = new THREE.Vector3()
          mesh.getWorldPosition(worldPos)
          
          let minDst = Infinity
          let closestRollPivot = null
          rollingPivots.forEach((rollPivot) => {
            const dst = rollPivot.parent.position.distanceTo(worldPos)
            if (dst < minDst) {
              minDst = dst
              closestRollPivot = rollPivot
            }
          })
          
          if (closestRollPivot && minDst < 1.0) {
            closestRollPivot.attach(mesh)
          }
        })

        // Set wheels pivots array for physics driving loop
        car.wheels = pivots
        car.rollingPivots = rollingPivots
      }

      // 5. Steering wheel rotation link
      const steeringWheelMesh = model.getObjectByName("Steering Wheel")
      if (steeringWheelMesh) {
        car.steeringWheel = steeringWheelMesh
      }

      console.log('Scuderia 3D Ferrari F1 GLB model successfully loaded, aligned, and optimized.')
    }, undefined, (err) => {
      console.error('Failed to load GLB model:', err)
    })
  }

  // Setup Keyboard Listeners using standard codes and key values (with console logs)
  function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase()
      
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

      // Spin tires and pivots based on velocity
      if (car.wheels && car.wheels.length === 4 && car.rollingPivots) {
        // Spin rolling pivots cleanly about their transverse local X axles
        car.rollingPivots.forEach((rollPivot) => {
          rollPivot.rotation.x += currentSpeed / 0.34
        })

        // Pivot front steering wheels (FL and FR steer pivots at index 0 and 1)
        car.wheels[0].rotation.y = steerAngle * 4.5
        car.wheels[1].rotation.y = steerAngle * 4.5
      }

      // Rotate internal steering wheel mesh if exists
      if (car.steeringWheel) {
        car.steeringWheel.rotation.y = steerAngle * 12.0
      }

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
      // Auto-spin wheels in Studio/Kit Mode turntable
      if (currentMode === 'studio' && car.rollingPivots && car.rollingPivots.length === 4) {
        car.rollingPivots.forEach((rollPivot) => {
          rollPivot.rotation.x += 0.005
        })
      }
      controls.update()
    }

    // Render Scene
    renderer.render(scene, camera)
  }
}
