import * as THREE from 'three'

// Constants matching original driving code
const maxSpeed = 0.85
const acceleration = 0.012
const drag = 0.97
const brakeFriction = 0.82
const maxSteerAngle = 0.05

let carPosition = new THREE.Vector3(0, 0, 0)
let carRotation = 0
let currentSpeed = 0
let steerAngle = 0

export function updatePhysics(keys, carGroup, camera) {
  if (!carGroup) return currentSpeed

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

  // Braking
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
      steerAngle *= 0.7
    }
    
    carRotation += steerAngle * steeringMultiplier
  } else {
    steerAngle *= 0.5
  }

  // Update position
  carPosition.x += Math.sin(carRotation) * currentSpeed
  carPosition.z += Math.cos(carRotation) * currentSpeed
  carGroup.position.copy(carPosition)
  carGroup.rotation.y = carRotation

  // Spin wheels and pivots (Original driving code: direct wheel children rotation)
  if (carGroup.wheels && carGroup.wheels.length === 4) {
    carGroup.wheels.forEach((wheel, index) => {
      wheel.children.forEach((child) => {
        child.rotation.x += currentSpeed / 0.34
      })
      if (index < 2) {
        wheel.rotation.y = steerAngle * 4.5
      }
    })
  }

  // Steering wheel mesh rotation
  if (carGroup.steeringWheel) {
    carGroup.steeringWheel.rotation.y = steerAngle * 12.0
  }

  // Camera follow logic (lerp behind the car)
  const followOffsetDistance = 4.8
  const followHeight = 1.35
  
  const offsetX = -Math.sin(carRotation) * followOffsetDistance
  const offsetZ = -Math.cos(carRotation) * followOffsetDistance
  
  const targetCameraPos = new THREE.Vector3(
    carGroup.position.x + offsetX,
    carGroup.position.y + followHeight,
    carGroup.position.z + offsetZ
  )
  camera.position.lerp(targetCameraPos, 0.08)
  
  const cameraLookAt = new THREE.Vector3(
    carGroup.position.x + Math.sin(carRotation) * 1.5,
    carGroup.position.y + 0.3,
    carGroup.position.z + Math.cos(carRotation) * 1.5
  )
  camera.lookAt(cameraLookAt)

  return currentSpeed
}

export function resetPhysicsState(carGroup) {
  carPosition.set(0, 0, 0)
  currentSpeed = 0
  carRotation = 0
  steerAngle = 0
  if (carGroup) {
    carGroup.position.set(0, 0, 0)
    carGroup.rotation.set(0, 0, 0)
    if (carGroup.wheels && carGroup.wheels.length === 4) {
      carGroup.wheels.forEach((w) => {
        w.rotation.set(0, 0, 0)
        w.children.forEach((c) => c.rotation.set(0, 0, 0))
      })
    }
  }
}
