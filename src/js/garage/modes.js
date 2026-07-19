import { gsap } from 'gsap'
import * as THREE from 'three'

let currentMode = 'studio'
let activeStudioAngle = 'cinematic'

export function setupModes(controls, camera, getCarGroupCallback, modeButtons, instructionPanels, studioAngleButtons, kitHotspotButtons, resetPhysicsCallback) {
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      
      currentMode = btn.getAttribute('data-garage-mode')
      
      instructionPanels.forEach((p) => p.classList.remove('active'))
      const activeInstruction = document.getElementById(`instructions-${currentMode}`)
      if (activeInstruction) activeInstruction.classList.add('active')
      
      const carGroup = getCarGroupCallback()
      if (currentMode === 'drive') {
        controls.enabled = false
        gsap.killTweensOf(camera.position)
        gsap.killTweensOf(controls.target)
        resetPhysicsCallback()
        window.focus()
      } else {
        controls.enabled = true
        if (carGroup) {
          controls.target.set(carGroup.position.x, 0.5, carGroup.position.z)
        }
        
        if (currentMode === 'studio') {
          setStudioCameraAngle('cinematic', camera, carGroup, controls)
        }
      }
    })
  })

  studioAngleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      studioAngleButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      activeStudioAngle = btn.getAttribute('data-studio-angle')
      const carGroup = getCarGroupCallback()
      setStudioCameraAngle(activeStudioAngle, camera, carGroup, controls)
    })
  })

  kitHotspotButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const part = btn.getAttribute('data-kit-hotspot')
      const carGroup = getCarGroupCallback()
      focusKitPart(part, camera, carGroup, controls)
    })
  })
}

export function getActiveMode() {
  return currentMode
}

export function getActiveStudioAngle() {
  return activeStudioAngle
}

function setStudioCameraAngle(angle, camera, carGroup, controls) {
  if (currentMode !== 'studio' || !carGroup) return
  
  let targetPos = new THREE.Vector3()
  let targetLook = new THREE.Vector3(carGroup.position.x, 0.5, carGroup.position.z)

  if (angle === 'cinematic') {
    targetPos.set(carGroup.position.x + 6, 2.2, carGroup.position.z + 5)
  } else if (angle === 'top') {
    targetPos.set(carGroup.position.x, 9, carGroup.position.z)
  } else if (angle === 'cockpit') {
    targetPos.set(carGroup.position.x, 0.8, carGroup.position.z + 0.1)
    targetLook.set(carGroup.position.x, 0.7, carGroup.position.z + 2.5)
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

function focusKitPart(part, camera, carGroup, controls) {
  if (currentMode !== 'kit' || !carGroup) return
  
  let targetPos = new THREE.Vector3()
  let targetLook = new THREE.Vector3()

  if (part === 'aero') {
    targetPos.set(carGroup.position.x - 2.5, 0.8, carGroup.position.z + 3)
    targetLook.set(carGroup.position.x, 0.2, carGroup.position.z + 2.2)
  } else if (part === 'engine') {
    targetPos.set(carGroup.position.x + 2.5, 1.2, carGroup.position.z - 1.2)
    targetLook.set(carGroup.position.x, 0.5, carGroup.position.z - 0.8)
  } else if (part === 'suspension') {
    targetPos.set(carGroup.position.x + 1.8, 0.6, carGroup.position.z + 1.2)
    targetLook.set(carGroup.position.x + 0.9, 0.3, carGroup.position.z + 1.1)
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
