import { gsap } from 'gsap'

// Import assets to allow Vite to resolve and hash the image names in the production build
import leclercImg from '../assets/card_leclerc.jpg'
import hamiltonImg from '../assets/card_hamilton.jpg'

const driverToggles = document.querySelectorAll('[data-driver-toggle]')
const showcaseNum = document.getElementById('showcase-num')
const showcaseName = document.getElementById('showcase-name')
const showcaseImg = document.getElementById('showcase-img')

const statPodiums = document.getElementById('stat-podiums')
const statWins = document.getElementById('stat-wins')
const statPoles = document.getElementById('stat-poles')
const statCountry = document.getElementById('stat-country')

const driverData = {
  leclerc: {
    num: '#16',
    name: 'CHARLES LECLERC',
    podiums: '41',
    wins: '8',
    poles: '26',
    country: 'Monaco',
    img: leclercImg
  },
  hamilton: {
    num: '#44',
    name: 'LEWIS HAMILTON',
    podiums: '201',
    wins: '105',
    poles: '104',
    country: 'United Kingdom',
    img: hamiltonImg
  }
}

driverToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const driverKey = toggle.getAttribute('data-driver-toggle')
    
    // Toggle active state on buttons
    driverToggles.forEach((btn) => btn.classList.remove('active'))
    toggle.classList.add('active')
    
    // Animate out current showcase elements
    gsap.to('.animate-showcase', {
      opacity: 0,
      y: 15,
      duration: 0.3,
      stagger: 0.05,
      onComplete: () => {
        const data = driverData[driverKey]
        if (data) {
          // Update texts
          if (showcaseNum) showcaseNum.textContent = data.num
          if (showcaseName) showcaseName.textContent = data.name
          
          if (statPodiums) statPodiums.textContent = data.podiums
          if (statWins) statWins.textContent = data.wins
          if (statPoles) statPoles.textContent = data.poles
          if (statCountry) statCountry.textContent = data.country
          
          // Image load synchronization to prevent blank flashing or image popping
          if (showcaseImg) {
            showcaseImg.onload = () => {
              // Animate in only after image is fully loaded in memory
              gsap.to('.animate-showcase', {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.05
              })
              showcaseImg.onload = null // Clear listener
            }
            showcaseImg.src = data.img
          } else {
            // Fallback if image element is missing
            gsap.to('.animate-showcase', {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.05
            })
          }
        }
      }
    })
  })
})
