// Scuderia Ferrari Interactive Site Performance Logger & Analytics
let logs = []
let activeSection = 'Hero'
let frameTimes = []
let lastFrameTime = performance.now()

// Helper to push logs with structured meta
export function logEntry(category, message, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    elapsedMs: Math.round(performance.now()),
    category, // Network, GPU, FPS, UI_Interactions, SectionChange
    activeSection,
    message,
    details
  }
  logs.push(entry)
  console.log(`[Ferrari PerfLogger] [${category}] ${message}`, details)
}

// 1. GPU / WebGL Profiling
function profileGPU() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const gpuDetails = {
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        precision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision
      }
      logEntry('GPU', `WebGL Initialized on GPU: ${gpuDetails.renderer}`, gpuDetails)
    }
  } catch (e) {
    logEntry('GPU', 'Failed to detect WebGL hardware info', { error: e.message })
  }
}

// 2. Network Resource Timing
function initNetworkObserver() {
  const resources = performance.getEntriesByType('resource')
  resources.forEach(res => recordResource(res))

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(res => recordResource(res))
  })
  observer.observe({ entryTypes: ['resource'] })
}

function recordResource(res) {
  const sizeKb = Math.round(res.transferSize / 1024)
  const durationMs = Math.round(res.duration)

  // Log resource fetches that take >100ms or are larger than 50KB or are GLBs
  const isGLB = res.name.endsWith('.glb')
  if (sizeKb > 50 || durationMs > 100 || isGLB) {
    logEntry('Network', `Loaded asset: ${res.name.split('/').pop()}`, {
      url: res.name,
      sizeKb,
      durationMs,
      initiator: res.initiatorType
    })
  }
}

// 3. UI Section Activity Observation
function initSectionObserver() {
  const sections = ['hero', 'sections', 'scuderia-garage', 'telemetry-hq']
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeSection = entry.target.id
        logEntry('SectionChange', `User scrolled to section: #${activeSection}`)
      }
    })
  }, { threshold: 0.25 })

  sections.forEach(id => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })
}

// 4. Thread Blocks (Long Tasks)
function initLongTaskObserver() {
  if (typeof PerformanceObserver === 'undefined') return
  try {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        logEntry('ThreadBlock', `Main thread blocked for ${Math.round(entry.duration)}ms`, {
          durationMs: Math.round(entry.duration),
          name: entry.name
        })
      })
    })
    observer.observe({ entryTypes: ['longtask'] })
  } catch (e) {
    // Unsupported in some browsers
  }
}

// 5. Framerate (FPS) Profiler
function startFPSProfiler() {
  function loop() {
    const now = performance.now()
    const delta = now - lastFrameTime
    lastFrameTime = now

    frameTimes.push(delta)
    if (frameTimes.length > 60) {
      frameTimes.shift()
    }

    const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const fps = Math.round(1000 / avgDelta)

    if (fps < 40 && frameTimes.length >= 60) {
      if (!window._lastFpsDropLog || now - window._lastFpsDropLog > 3000) {
        logEntry('FPS_Drop', `Framerate dropped to ${fps} FPS`, { fps })
        window._lastFpsDropLog = now
      }
    }

    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
}

// 6. UI Dashboard Overlay for Logging
function createLoggerOverlay() {
  const overlay = document.createElement('div')
  overlay.id = 'perf-logger-panel'
  overlay.innerHTML = `
    <div class="logger-header">
      <h4><i class="fa-solid fa-bug"></i> PERFORMANCE ANALYTICS LOGGER</h4>
      <button class="logger-close-btn">&times;</button>
    </div>
    <div class="logger-metrics">
      <div class="metric-item"><strong>GPU:</strong> <span id="logger-gpu-val">Detecting...</span></div>
      <div class="metric-item"><strong>Active Section:</strong> <span id="logger-section-val">Hero</span></div>
    </div>
    <div class="logger-console" id="logger-console-list"></div>
    <div class="logger-footer">
      <button class="logger-download-btn">Download Log File (.json)</button>
    </div>
  `

  document.body.appendChild(overlay)

  // Floating Toggle Button
  const toggleBtn = document.createElement('button')
  toggleBtn.id = 'perf-logger-toggle'
  toggleBtn.innerHTML = '<i class="fa-solid fa-chart-line"></i> Analytics'
  document.body.appendChild(toggleBtn)

  // CSS for overlays
  const style = document.createElement('style')
  style.textContent = `
    #perf-logger-toggle {
      position: fixed;
      bottom: 25px;
      left: 25px;
      z-index: 10000;
      background: rgba(225, 6, 0, 0.95);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px 18px;
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(225, 6, 0, 0.4);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #perf-logger-toggle:hover {
      background: #ff1c1c;
      transform: translateY(-2px) scale(1.05);
    }
    #perf-logger-panel {
      position: fixed;
      bottom: 85px;
      left: 25px;
      width: 380px;
      height: 480px;
      background: rgba(10, 10, 10, 0.95);
      border: 1px solid rgba(225, 6, 0, 0.3);
      backdrop-filter: blur(15px);
      border-radius: 8px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      font-family: 'Inter', sans-serif;
      color: #ccc;
      overflow: hidden;
      transition: opacity 0.3s ease;
    }
    #perf-logger-panel.open {
      display: flex;
    }
    .logger-header {
      padding: 14px;
      background: rgba(225, 6, 0, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logger-header h4 {
      margin: 0;
      font-family: 'Orbitron', sans-serif;
      color: #fff;
      font-size: 11px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .logger-close-btn {
      background: none;
      border: none;
      color: #aaa;
      font-size: 20px;
      cursor: pointer;
    }
    .logger-close-btn:hover {
      color: #fff;
    }
    .logger-metrics {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 11px;
    }
    .logger-console {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 10px;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .log-item {
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.02);
      word-break: break-all;
    }
    .log-item.Network { color: #5bc0de; }
    .log-item.GPU { color: #f0ad4e; }
    .log-item.FPS_Drop { color: #d9534f; }
    .log-item.SectionChange { color: #5cb85c; }
    .logger-footer {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      text-align: center;
    }
    .logger-download-btn {
      width: 100%;
      background: #e10600 !important;
      color: #fff !important;
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      font-weight: 700;
      padding: 10px !important;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(225, 6, 0, 0.3);
      transition: all 0.3s ease;
    }
    .logger-download-btn:hover {
      background: #ff1c1c !important;
      transform: translateY(-1px);
    }
  `
  document.head.appendChild(style)

  // Event handlers
  toggleBtn.addEventListener('click', () => {
    overlay.classList.toggle('open')
    renderConsoleLogs()
  })

  overlay.querySelector('.logger-close-btn').addEventListener('click', () => {
    overlay.classList.remove('open')
  })

  // Download log file logic
  overlay.querySelector('.logger-download-btn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", "ferrari_perf_log.json")
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    logEntry('System', 'Performance log downloaded by user')
  })

  // Intercept logs to show on UI Console
  const consoleList = overlay.querySelector('#logger-console-list')
  function renderConsoleLogs() {
    consoleList.innerHTML = logs.slice(-50).map(log => {
      const timeStr = new Date(log.timestamp).toLocaleTimeString()
      return `<div class="log-item ${log.category}">
        [${timeStr}] [${log.category}] ${log.message}
      </div>`
    }).join('')
    consoleList.scrollTop = consoleList.scrollHeight

    // Update dynamic overlays
    const gpuInfo = logs.find(l => l.category === 'GPU')
    if (gpuInfo) {
      document.getElementById('logger-gpu-val').textContent = gpuInfo.details.renderer || 'Detected'
    }
    document.getElementById('logger-section-val').textContent = activeSection
  }

  // Hook setInterval to update console periodically if open
  setInterval(() => {
    if (overlay.classList.contains('open')) {
      renderConsoleLogs()
    }
  }, 1000)
}

// 7. Track User Clicks and Document Events
function setupEventListeners() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, .tilt-card')
    if (target) {
      let desc = target.textContent.trim() || target.className || target.tagName
      if (target.classList.contains('tilt-card')) {
        desc = `Card: ${target.getAttribute('data-driver') || target.getAttribute('data-card')}`
      }
      logEntry('UI_Interaction', `Clicked: ${desc}`)
    }
  })

  window.addEventListener('resize', () => {
    logEntry('System', `Window resized to: ${window.innerWidth}x${window.innerHeight}`)
  })

  document.addEventListener('visibilitychange', () => {
    logEntry('System', `Page visibility state changed to: ${document.visibilityState}`)
  })
}

// 8. Initialize Profilers
if (typeof window !== 'undefined') {
  profileGPU()
  initNetworkObserver()
  initSectionObserver()
  initLongTaskObserver()
  startFPSProfiler()
  createLoggerOverlay()
  setupEventListeners()
}
export { logs }
