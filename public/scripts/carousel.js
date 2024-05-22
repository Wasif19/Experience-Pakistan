document.addEventListener("DOMContentLoaded", function () {
  const eventsWrapper = document.querySelector(".events-wrapper");
  let currentIndex = 0;

  function updateCarousel() {
    const cardWidth = document.querySelector(".event-card").clientWidth;
    const visibleCards = Math.floor(window.innerWidth / cardWidth);
    const offset = -currentIndex * cardWidth;
    eventsWrapper.style.transform = `translateX(${offset}px)`;
  }

  document.getElementById("next-btn").addEventListener("click", function () {
    if (currentIndex < document.querySelectorAll(".event-card").length - 1) {
      currentIndex++;
      updateCarousel();
    }
  });

  document.getElementById("prev-btn").addEventListener("click", function () {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  window.addEventListener("resize", updateCarousel);

  updateCarousel();
});
