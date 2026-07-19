import { gsap } from 'gsap'

window.addEventListener('DOMContentLoaded', () => {
  gsap.from('.hero-section', {
    opacity: 0,
    duration: 1.5,
    ease: 'power3.out'
  })
  
  gsap.from('.hero-title', {
    y: 100,
    opacity: 0,
    duration: 1.2,
    delay: 0.4,
    ease: 'power4.out'
  })
  
  gsap.from('.hero-left .sub-tag, .hero-left .btn-primary', {
    y: 30,
    opacity: 0,
    duration: 1,
    stagger: 0.15,
    delay: 0.8,
    ease: 'power3.out'
  })

  gsap.from('.hero-right span', {
    x: 40,
    opacity: 0,
    duration: 1,
    stagger: 0.15,
    delay: 1.0,
    ease: 'power3.out'
  })

  gsap.from('.info-card-overlay', {
    y: 80,
    opacity: 0,
    duration: 1.2,
    delay: 1.2,
    ease: 'power4.out'
  })
})

gsap.from('.tilt-card', {
  scrollTrigger: {
    trigger: '.sections-container',
    start: 'top 75%',
    toggleActions: 'play none none none'
  },
  opacity: 0,
  y: 60,
  duration: 0.8,
  stagger: 0.15,
  ease: 'power3.out'
})

gsap.from('.split-left', {
  scrollTrigger: {
    trigger: '.split-banner',
    start: 'top 80%',
  },
  xPercent: -30,
  opacity: 0,
  duration: 1,
  ease: 'power3.out'
})

gsap.from('.split-right', {
  scrollTrigger: {
    trigger: '.split-banner',
    start: 'top 80%',
  },
  xPercent: 30,
  opacity: 0,
  duration: 1,
  ease: 'power3.out'
})

gsap.from('.compare-container', {
  scrollTrigger: {
    trigger: '.driver-compare-section',
    start: 'top 80%',
  },
  y: 50,
  opacity: 0,
  duration: 1,
  ease: 'power3.out'
})

gsap.from('.more-col', {
  scrollTrigger: {
    trigger: '.more-section',
    start: 'top 80%',
  },
  y: 60,
  opacity: 0,
  duration: 1,
  stagger: 0.2,
  ease: 'power3.out'
})
