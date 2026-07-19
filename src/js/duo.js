import { gsap } from 'gsap'

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
    img: '/src/assets/card_leclerc.jpg'
  },
  hamilton: {
    num: '#44',
    name: 'LEWIS HAMILTON',
    podiums: '201',
    wins: '105',
    poles: '104',
    country: 'United Kingdom',
    img: '/src/assets/card_hamilton.jpg'
  }
}

driverToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const driverKey = toggle.getAttribute('data-driver-toggle')
    
    driverToggles.forEach((btn) => btn.classList.remove('active'))
    toggle.classList.add('active')
    
    gsap.to('.animate-showcase', {
      opacity: 0,
      y: 15,
      duration: 0.3,
      stagger: 0.05,
      onComplete: () => {
        const data = driverData[driverKey]
        if (data) {
          if (showcaseNum) showcaseNum.textContent = data.num
          if (showcaseName) showcaseName.textContent = data.name
          if (showcaseImg) showcaseImg.src = data.img
          
          if (statPodiums) statPodiums.textContent = data.podiums
          if (statWins) statWins.textContent = data.wins
          if (statPoles) statPoles.textContent = data.poles
          if (statCountry) statCountry.textContent = data.country
        }
        
        gsap.to('.animate-showcase', {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05
        })
      }
    })
  })
})
