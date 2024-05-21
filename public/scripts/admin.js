function closeCard() {
  var successCard = document.getElementById("successCard");
  successCard.style.display = "none";
}

function toggleProfileCard() {
  var profileCard = document.getElementById("profileCard");
  profileCard.style.display =
    profileCard.style.display === "none" || profileCard.style.display === ""
      ? "block"
      : "none";
}

document.addEventListener("click", function (event) {
  var profileCard = document.getElementById("profileCard");
  var profileIcon = document.getElementById("profileIcon");

  if (
    event.target !== profileCard &&
    event.target !== profileIcon &&
    !profileCard.contains(event.target)
  ) {
    profileCard.style.display = "none";
  }
});

function handleKeyPress(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default form submission behavior
    const searchForm = document.getElementById("searchForm");
    const searchInputValue = document.getElementById("searchInput").value;

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "searchText";
    hiddenInput.value = searchInputValue;
    searchForm.appendChild(hiddenInput);

    searchForm.submit();
  }
}

// var logOut = document.getElementById("logout");
// logOut.addEventListener("click", function () {
//   console.log("Logout Pressed");
// });

// document.addEventListener("DOMContentLoaded", function () {
//   const navLinks = document.querySelectorAll(".nav-link");

//   navLinks.forEach(function (navLink) {
//     navLink.addEventListener("click", function (event) {
//       navLinks.forEach(function (link) {
//         link.classList.remove("active");
//       });

//       this.classList.add("active");
//     });
//   });
// });

document.addEventListener("DOMContentLoaded", function () {
  const hamburgerMenu = document.querySelector(".fa-bars-staggered");
  const close = document.querySelector(".fa-xmark");
  const mainNav = document.querySelector(".mobile-navbar");

  hamburgerMenu.addEventListener("click", function () {
    mainNav.classList.toggle("show");
  });

  close.addEventListener("click", function () {
    mainNav.classList.toggle("show");
  });
});
