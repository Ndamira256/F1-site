const slides = document.querySelectorAll('.hero-slideshow .slide')
let currentSlideIndex = 0

function showNextSlide() {
  if (slides.length > 0) {
    slides[currentSlideIndex].classList.remove('active')
    currentSlideIndex = (currentSlideIndex + 1) % slides.length
    slides[currentSlideIndex].classList.add('active')
  }
}

if (slides.length > 1) {
  setInterval(showNextSlide, 4500)
}
