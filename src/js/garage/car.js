import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

let carGroup

export function loadF1Car(scene, onCompleteCallback) {
  carGroup = new THREE.Group()
  scene.add(carGroup)

  // 1. Create a temporary wireframe placeholder so the viewport works while the model loads
  const placeholderGeo = new THREE.BoxGeometry(0.7, 0.3, 2.5)
  const placeholderMat = new THREE.MeshBasicMaterial({ color: 0xe10600, wireframe: true })
  const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat)
  placeholder.position.y = 0.3
  carGroup.add(placeholder)

  carGroup.wheels = []

  // Red underglow LED strip
  const glowGeo = new THREE.BoxGeometry(0.65, 0.02, 1.9)
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xff1212 })
  const underglow = new THREE.Mesh(glowGeo, glowMat)
  underglow.position.set(0, 0.05, 0)
  carGroup.add(underglow)

  // 2. Load the Draco compressed GLB file
  const loader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  loader.setDRACOLoader(dracoLoader)

  loader.load('/ferrari_f1_2019_draco.glb', (gltf) => {
    carGroup.remove(placeholder)
    const model = gltf.scene

    // Enhance materials and enable shadows
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (child.material) {
          child.material.envMap = scene.environment
          child.material.envMapIntensity = 1.8
          
          const name = child.name.toLowerCase()
          if (name.includes('body') || name.includes('paint') || name.includes('red')) {
            child.material.roughness = 0.1
            child.material.metalness = 0.3
            
            if (child.material.isMeshPhysicalMaterial) {
              child.material.clearcoat = 1.0
              child.material.clearcoatRoughness = 0.03
            }
          }
        }
      }
    })

    // 3. Auto-scale and align coordinates
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)
    
    let length = size.z
    let scaleFactor = 4.5 / length
    if (size.x > size.z) {
      length = size.x
      scaleFactor = 4.5 / length
      model.rotation.y = Math.PI / 2
    }
    model.scale.set(scaleFactor, scaleFactor, scaleFactor)
    
    const center = new THREE.Vector3()
    box.getCenter(center)
    model.position.sub(center.multiplyScalar(scaleFactor))
    model.position.y += size.y * scaleFactor * 0.5 - 0.04
    
    carGroup.add(model)

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
      sortedCenters.forEach((center) => {
        const pivot = new THREE.Group()
        pivot.position.copy(center)
        carGroup.add(pivot)
        pivots.push(pivot)
      })

      const meshesToMove = []
      model.traverse((child) => {
        if (child.isMesh && child.name) {
          const name = child.name.toLowerCase()
          if (name.includes('tire') || name.includes('rim') || name.includes('decal')) {
            if (name.includes('decal') && !name.includes('tire') && !name.includes('wheel')) {
              return
            }
            meshesToMove.push(child)
          }
        }
      })

      meshesToMove.forEach((mesh) => {
        const worldPos = new THREE.Vector3()
        mesh.getWorldPosition(worldPos)
        
        let minDst = Infinity
        let closestPivot = null
        pivots.forEach((pivot) => {
          const dst = pivot.position.distanceTo(worldPos)
          if (dst < minDst) {
            minDst = dst
            closestPivot = pivot
          }
        })
        
        if (closestPivot && minDst < 1.0) {
          closestPivot.attach(mesh)
        }
      })

      carGroup.wheels = pivots
    }

    // Steering wheel reference
    const steeringWheelMesh = model.getObjectByName("Steering Wheel")
    if (steeringWheelMesh) {
      carGroup.steeringWheel = steeringWheelMesh
    }

    if (onCompleteCallback) onCompleteCallback(carGroup)
  }, undefined, (err) => {
    console.error('Failed to load original GLB model:', err)
  })
}

export function getCarGroup() {
  return carGroup
}
