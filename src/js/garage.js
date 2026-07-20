import { initScene } from './garage/scene.js'
import { initLights, createCarLights, updateRainLight } from './garage/lights.js'
import { createWorld } from './garage/world.js'
import { setupInputs, getKeysState, clearKeysState } from './garage/input.js'
import { loadF1Car } from './garage/car.js'
import { updatePhysics, resetPhysicsState } from './garage/physics.js'
import { setupModes, getActiveMode, getActiveStudioAngle } from './garage/modes.js'
import { updateTelemetry } from './garage/telemetry.js'

// DOM Elements
const container = document.getElementById('garage-viewport')
const loadingOverlay = document.getElementById('garage-loading')
const modeButtons = document.querySelectorAll('[data-garage-mode]')
const instructionPanels = document.querySelectorAll('.hud-instructions')
const studioAngleButtons = document.querySelectorAll('[data-studio-angle]')
const kitHotspotButtons = document.querySelectorAll('[data-kit-hotspot]')

if (container) {
  let scene, camera, renderer, controls
  let carGroup = null

  function init() {
    // 1. Initialize Scene Context
    const sceneContext = initScene(container)
    scene = sceneContext.scene
    camera = sceneContext.camera
    renderer = sceneContext.renderer
    controls = sceneContext.controls

    // 2. Initialize Lights
    initLights(scene)

    // 3. Initialize Ground & Track
    createWorld(scene)

    // 4. Setup Inputs
    setupInputs(container, getActiveMode)

    // 5. Load F1 Car Model
    loadF1Car(scene, (loadedCar) => {
      carGroup = loadedCar
      createCarLights(carGroup)

      // Hide Loading Screen
      if (loadingOverlay) {
        setTimeout(() => {
          loadingOverlay.style.opacity = 0
          loadingOverlay.style.pointerEvents = 'none'
          setTimeout(() => loadingOverlay.classList.add('hidden'), 500)
        }, 1000)
      }

      // Center controls target
      controls.target.set(carGroup.position.x, 0.5, carGroup.position.z)
    })

    // 6. Setup mode controls
    setupModes(
      controls,
      camera,
      () => carGroup,
      modeButtons,
      instructionPanels,
      studioAngleButtons,
      kitHotspotButtons,
      () => {
        clearKeysState()
        resetPhysicsState(carGroup)
      }
    )

    // 7. Start Render Loop
    renderer.setAnimationLoop(update)
  }

  // Main Render Loop
  function update(time) {
    if (!carGroup) return

    // Blinking rain light
    updateRainLight(time)

    const currentMode = getActiveMode()
    const activeStudioAngle = getActiveStudioAngle()

    // Studio rotation turntable
    if (currentMode === 'studio' && activeStudioAngle === 'cinematic') {
      carGroup.rotation.y = time * 0.00015
    }

    if (currentMode === 'drive') {
      const keys = getKeysState()
      const speed = updatePhysics(keys, carGroup, camera)
      updateTelemetry(speed)
    } else {
      // Auto-spin wheels in Studio/Kit Mode turntable
      if (currentMode === 'studio' && carGroup.wheels && carGroup.wheels.length === 4) {
        carGroup.wheels.forEach((wheel) => {
          wheel.children.forEach((child) => {
            child.rotation.x += 0.005
          })
        })
      }
      controls.update()
    }

    // Render Scene
    renderer.render(scene, camera)
  }

  // Lazy-load and debounce the 3D engine initialization so it only loads when the user stops scrolling for 500ms
  let initialized = false
  let debounceTimeout = null

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !initialized) {
        if (debounceTimeout) clearTimeout(debounceTimeout)

        debounceTimeout = setTimeout(() => {
          if (!initialized) {
            initialized = true
            init()
            observer.disconnect()
          }
        }, 500)
      } else {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout)
          debounceTimeout = null
        }
      }
    })
  }, { rootMargin: '400px' })

  const section = document.getElementById('scuderia-garage')
  if (section) {
    observer.observe(section)
  } else {
    init()
  }
}
