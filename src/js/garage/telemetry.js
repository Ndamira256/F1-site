const hudSpeed = document.getElementById('drive-speed')
const hudGear = document.getElementById('drive-gear')
const telemetrySpeed = document.getElementById('telemetry-speed')
const telemetryGear = document.getElementById('telemetry-gear')
const telemetryRpm = document.getElementById('telemetry-rpm')

export function updateTelemetry(currentSpeed) {
  const speedKmh = Math.round(Math.abs(currentSpeed) * 620)
  let currentGear = 1
  let currentRpm = 1000

  if (hudSpeed) hudSpeed.textContent = speedKmh
  
  if (speedKmh === 0) {
    currentGear = 'N'
    currentRpm = 1100
  } else {
    currentGear = Math.min(8, Math.floor(speedKmh / 42) + 1)
    const gearMinSpeed = (currentGear - 1) * 42
    const gearRange = 42
    const gearPercentage = (speedKmh - gearMinSpeed) / gearRange
    currentRpm = Math.round(9000 + gearPercentage * 3200)
  }
  
  if (hudGear) hudGear.textContent = currentGear

  // Binding to Live Telemetry Dials
  if (telemetrySpeed) telemetrySpeed.textContent = speedKmh
  if (telemetryGear) telemetryGear.textContent = currentGear
  if (telemetryRpm) telemetryRpm.textContent = currentRpm.toLocaleString()
}
