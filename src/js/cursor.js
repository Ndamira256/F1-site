const cursor = document.querySelector('.custom-cursor')
const cursorDot = document.querySelector('.custom-cursor-dot')

let mouseX = 0
let mouseY = 0
let cursorX = 0
let cursorY = 0

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX
  mouseY = e.clientY
  
  if (cursorDot) {
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`
  }
})

function animateCursor() {
  const dx = mouseX - cursorX
  const dy = mouseY - cursorY
  
  cursorX += dx * 0.15
  cursorY += dy * 0.15
  
  if (cursor) {
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`
  }
  
  requestAnimationFrame(animateCursor)
}

if (cursor && cursorDot) {
  animateCursor()
  
  const interactiveElements = document.querySelectorAll('a, button, .tilt-card, .driver-btn, .telemetry-toggle, .telemetry-tab')
  interactiveElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active')
    })
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active')
    })
  })
}
