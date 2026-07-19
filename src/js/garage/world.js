import * as THREE from 'three'

export function createWorld(scene) {
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

  const grid = new THREE.GridHelper(250, 80, 0x440000, 0x222222)
  grid.position.y = 0.001
  scene.add(grid)

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
  const trackLine = new THREE.Line(trackGeo, trackMat)
  scene.add(trackLine)

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
