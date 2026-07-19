import { gsap } from 'gsap'
import { lenis } from './scroller.js'

const hqToggleBtn = document.querySelector('.telemetry-toggle')
const telemetryHq = document.getElementById('telemetry-hq')
const telemetryTabs = document.querySelectorAll('.telemetry-tab')
const telemetryPanels = document.querySelectorAll('.telemetry-panel')

if (hqToggleBtn && telemetryHq) {
  hqToggleBtn.addEventListener('click', () => {
    if (telemetryHq.classList.contains('hidden')) {
      telemetryHq.classList.remove('hidden')
      gsap.fromTo(telemetryHq, 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', onComplete: () => {
          lenis.scrollTo(telemetryHq, { offset: -50 })
        }}
      )
      hqToggleBtn.textContent = 'Close HQ'
    } else {
      gsap.to(telemetryHq, {
        opacity: 0, y: 30, duration: 0.4, ease: 'power2.in', onComplete: () => {
          telemetryHq.classList.add('hidden')
          hqToggleBtn.textContent = 'Access HQ'
        }
      })
    }
  })
}

telemetryTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    telemetryTabs.forEach((t) => t.classList.remove('active'))
    telemetryPanels.forEach((p) => p.classList.remove('active'))
    
    tab.classList.add('active')
    const targetTab = tab.getAttribute('data-tab')
    const activePanel = document.getElementById(`panel-${targetTab}`)
    if (activePanel) {
      activePanel.classList.add('active')
      gsap.fromTo(activePanel, { opacity: 0 }, { opacity: 1, duration: 0.4 })
    }
  })
})

const telemetrySpeed = document.getElementById('telemetry-speed')
const telemetryRpm = document.getElementById('telemetry-rpm')
const telemetryGear = document.getElementById('telemetry-gear')
const telemetryErs = document.getElementById('telemetry-ers')

let speedVal = 320
let rpmVal = 11500
let gearVal = 7
let ersVal = 94

function updateTelemetryValues() {
  if (telemetryHq && !telemetryHq.classList.contains('hidden')) {
    const seed = Math.random()
    
    if (seed > 0.85) {
      if (gearVal === 7 && seed > 0.95) {
        gearVal = 8
        rpmVal = 10500
      } else if (gearVal === 8 && seed > 0.95) {
        gearVal = 7
        rpmVal = 12100
      }
    }
    
    if (gearVal === 8) {
      speedVal += (Math.random() * 2 - 0.5)
      rpmVal += (Math.random() * 150 - 50)
      if (speedVal > 345) speedVal = 345
      if (rpmVal > 12400) rpmVal = 12400
    } else {
      speedVal += (Math.random() * 2 - 1)
      rpmVal += (Math.random() * 200 - 100)
      if (speedVal < 310) speedVal = 310
      if (rpmVal < 11000) rpmVal = 11000
    }
    
    ersVal += (Math.random() * 0.2 - 0.1)
    if (ersVal > 100) ersVal = 100
    if (ersVal < 80) ersVal = 80
    
    if (telemetrySpeed) telemetrySpeed.textContent = Math.round(speedVal)
    if (telemetryRpm) telemetryRpm.textContent = Math.round(rpmVal).toLocaleString()
    if (telemetryGear) telemetryGear.textContent = gearVal
    if (telemetryErs) telemetryErs.textContent = `${Math.round(ersVal)}%`
  }
  
  setTimeout(updateTelemetryValues, 200)
}
updateTelemetryValues()

const graphCanvas = document.getElementById('telemetry-graph-canvas')
const ctx = graphCanvas?.getContext('2d')
let points = Array(50).fill(75)

function drawTelemetryGraph() {
  if (!graphCanvas || !telemetryHq || telemetryHq.classList.contains('hidden')) {
    requestAnimationFrame(drawTelemetryGraph)
    return
  }
  
  const dpr = window.devicePixelRatio || 1
  const rect = graphCanvas.getBoundingClientRect()
  graphCanvas.width = rect.width * dpr
  graphCanvas.height = 150 * dpr
  if (ctx) {
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, 150)
    
    points.shift()
    const targetPoint = 130 - ((rpmVal - 10000) / 3000) * 100
    points.push(targetPoint)
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i < 150; i += 30) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(rect.width, i)
      ctx.stroke()
    }
    
    ctx.strokeStyle = '#E10600'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    ctx.shadowColor = 'rgba(225, 6, 0, 0.6)'
    ctx.shadowBlur = 10
    
    ctx.beginPath()
    const sliceWidth = rect.width / (points.length - 1)
    ctx.moveTo(0, points[0])
    
    for (let i = 1; i < points.length; i++) {
      const x = i * sliceWidth
      const y = points[i]
      ctx.lineTo(x, y)
    }
    ctx.stroke()
    
    ctx.shadowBlur = 0
  }
  
  requestAnimationFrame(drawTelemetryGraph)
}
if (graphCanvas) {
  requestAnimationFrame(drawTelemetryGraph)
}
