document.addEventListener("DOMContentLoaded", function () {
  const eventForm = document.getElementById("eventForm");

  eventForm.addEventListener("change", function (event) {
    const target = event.target;
    const inputField = document.createElement("input");
    inputField.type = "number";

    if (target.type === "checkbox" && target.checked) {
      inputField.name = `${target.value}Tickets`;
      inputField.placeholder = `Price of a ${target.value} ticket`;
      inputField.classList.add("width-small");
      const label = target.parentElement;
      label.appendChild(inputField);
    } else if (target.type === "checkbox" && !target.checked) {
      const inputToRemove = target.parentElement.querySelector(
        `input[name="${target.value}Tickets"]`
      );
      if (inputToRemove) {
        target.parentElement.removeChild(inputToRemove);
      }
    }
  });
});
