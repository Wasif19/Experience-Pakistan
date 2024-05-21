function toggleMenu() {
  const menu = document.querySelector(".menu");
  menu.style.left = menu.style.left === "-1500px" ? "0" : "-1500px";

  const bars = document.querySelectorAll(".bar");
  bars.forEach((bar) => bar.classList.toggle("change"));
}
