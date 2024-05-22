function getMonthAbbreviation(monthNumber) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Check if the provided monthNumber is within a valid range
  if (monthNumber >= 1 && monthNumber <= 12) {
    return months[monthNumber - 1]; // Arrays are zero-indexed
  } else {
    return "Invalid Month";
  }
}

const cities = [
  "multan",
  "faisalabad",
  "gujranwala",
  "murree",
  "sargodha",
  "sialkot",
  "jhang",
  "sheikhupura",
  "abbotabad",
  "sahiwal",
  "peshawer",
];

function generateResponse(question) {
  // Logic to map questions to responses

  if (question.includes("experience")) {
    return "Experience Pakistan is like a one-stop shop app where you can find all the cool events, places to eat, and fun stuff happening in Pakistan's big cities. It's like having your own personal guide to the best things to do in town!";
  } else if (question === "hello" || question === "hey" || question === "hi") {
    return "Hello, how can I help you?";
  } else if (question.includes("cancel") || question.includes("refund")) {
    return `For cancellation/refund of tickets, please call us at: +923081877779 or email us at: info@experiencepakistan.com. Thank you!`;
  } else if (question.includes("aoa") || question.includes("assalam alaikum")) {
    return `Walikum Asalam, how can I help you?`;
  }
  for (city of cities) {
    if (question.includes(city)) {
      return `We are coming to ${city} soon!`;
    }
  }
  switch (question) {
    case "how are you?":
      return "I am fine, thank you!";
    case "how to book tickets":
      return `1. Navigate to the events section of the website.
      2. Choose the event you want to attend from the list of available events.
      3. Click on the "Book Tickets" button or link associated with the chosen event.`;
    // Add more cases for other questions
    case "how can we signup?":
      return {
        text: "Click on: ",
        lin: "http://experience-pakistan.onrender.com/user/signup",
      };

    case "host an event?":
      return {
        text: "In order to host an event, please sign up as an Organizer. Organizer Sign up: ",
        lin: "http://experience-pakistan.onrender.com/organizer/signup",
      };

    default:
      return "Sorry, I couldn't understand.";
  }
}

module.exports = {
  getMonthAbbreviation: getMonthAbbreviation,
  getMonthAbbreviation: getMonthAbbreviation,
  generateResponse: generateResponse,
};
