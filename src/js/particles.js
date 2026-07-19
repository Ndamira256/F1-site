import * as THREE from 'three'
import { lenis } from './scroller.js'

const container = document.getElementById('canvas-container')
if (container) {
  const scene = new THREE.Scene()
  
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 5
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(1)
  container.appendChild(renderer.domElement)
  
  const particleCount = 1800
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const speeds = new Float32Array(particleCount)
  const angles = new Float32Array(particleCount)
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 15
    positions[i + 1] = (Math.random() - 0.5) * 10
    positions[i + 2] = (Math.random() - 0.5) * 8
    
    speeds[i / 3] = 0.005 + Math.random() * 0.01
    angles[i / 3] = Math.random() * Math.PI * 2
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  const material = new THREE.PointsMaterial({
    color: 0xE10600, 
    size: 0.04,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  
  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  
  let localMouseX = 0
  let localMouseY = 0
  window.addEventListener('mousemove', (e) => {
    localMouseX = e.clientX
    localMouseY = e.clientY
  })
  
  let targetSpeedMultiplier = 1
  let currentSpeedMultiplier = 1
  
  const clock = new THREE.Clock()
  
  function animateParticles() {
    requestAnimationFrame(animateParticles)
    
    const elapsedTime = clock.getElapsedTime()
    const positionArr = geometry.attributes.position.array
    
    currentSpeedMultiplier += (targetSpeedMultiplier - currentSpeedMultiplier) * 0.1
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      positionArr[i3 + 1] -= (speeds[i] * currentSpeedMultiplier)
      positionArr[i3] += Math.cos(elapsedTime * 0.5 + angles[i]) * 0.002
      
      if (positionArr[i3 + 1] < -5) {
        positionArr[i3 + 1] = 5
        positionArr[i3] = (Math.random() - 0.5) * 15
      }
    }
    
    particles.rotation.y = (localMouseX / window.innerWidth - 0.5) * 0.3
    particles.rotation.x = -(localMouseY / window.innerHeight - 0.5) * 0.2
    
    geometry.attributes.position.needsUpdate = true
    renderer.render(scene, camera)
  }
  animateParticles()
  
  lenis.on('scroll', (e) => {
    const velocity = Math.abs(e.velocity)
    targetSpeedMultiplier = 1 + velocity * 2.5
    material.size = 0.04 + Math.min(velocity * 0.015, 0.06)
  })
  
  lenis.on('scrollEnd', () => {
    targetSpeedMultiplier = 1
    material.size = 0.04
  })
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}
