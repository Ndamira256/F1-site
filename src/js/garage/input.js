const keys = { w: false, a: false, s: false, d: false, space: false }

export function setupInputs(container, getModeCallback) {
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    
    if (key === 'w' || e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true
    if (key === 's' || e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true
    if (key === 'a' || e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true
    if (key === 'd' || e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true
    if (key === ' ' || e.code === 'Space') keys.space = true

    if (getModeCallback() === 'drive' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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

  container.addEventListener('click', () => {
    window.focus()
  })
}

export function getKeysState() {
  return keys
}
export function clearKeysState() {
  keys.w = false
  keys.a = false
  keys.s = false
  keys.d = false
  keys.space = false
}
