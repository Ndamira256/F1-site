import * as THREE from 'three'

let rearRainLight, rainLightGlow

export function initLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(ambientLight)

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.8)
  mainLight.position.set(10, 15, 5)
  mainLight.castShadow = true
  mainLight.shadow.mapSize.width = 2048
  mainLight.shadow.mapSize.height = 2048
  mainLight.shadow.bias = -0.0005
  scene.add(mainLight)

  const redLight1 = new THREE.PointLight(0xe10600, 4, 25)
  redLight1.position.set(-10, 4, -10)
  scene.add(redLight1)

  const redLight2 = new THREE.PointLight(0xe10600, 4, 25)
  redLight2.position.set(10, 4, 10)
  scene.add(redLight2)

  const studioLight1 = new THREE.DirectionalLight(0xffffff, 1.2)
  studioLight1.position.set(-5, 10, -5)
  scene.add(studioLight1)
}

export function createCarLights(carGroup) {
  const rainLightGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08)
  const rainLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  rearRainLight = new THREE.Mesh(rainLightGeo, rainLightMat)
  rearRainLight.position.set(0, 0.25, -2.15)
  carGroup.add(rearRainLight)

  rainLightGlow = new THREE.PointLight(0xff0000, 3, 4)
  rainLightGlow.position.set(0, 0.25, -2.2)
  carGroup.add(rainLightGlow)
}

export function updateRainLight(time) {
  const isLit = Math.floor(time / 150) % 2 === 0
  if (rearRainLight && rainLightGlow) {
    rearRainLight.material.color.setHex(isLit ? 0xff0000 : 0x220000)
    rainLightGlow.intensity = isLit ? 3 : 0
  }
}
