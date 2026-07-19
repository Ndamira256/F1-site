const cards = document.querySelectorAll('.tilt-card')

cards.forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const cardInner = card.querySelector('.card-inner')
    if (cardInner) {
      const rect = card.getBoundingClientRect()
      
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const rotateY = ((x / rect.width) - 0.5) * 25
      const rotateX = -(((y / rect.height) - 0.5) * 25)
      
      cardInner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`
    }
  })
  
  card.addEventListener('mouseleave', () => {
    const cardInner = card.querySelector('.card-inner')
    if (cardInner) {
      cardInner.style.transform = 'rotateX(0) rotateY(0) scale(1)'
    }
  })
})
