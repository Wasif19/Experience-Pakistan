const express = require("express");

const isUserAuth = require("../middleware/user-is-auth");

// const path = require("path");

// const rootdir = require("../util/path");

const customerroutes = express.Router();

const homeController = require("../controllers/CustomerController");

customerroutes.get("/", homeController.HomePage);
customerroutes.get("/search-by-city", homeController.searchCity);
customerroutes.get("/home", homeController.HomePage);
customerroutes.get("/artists", homeController.getArtists);
customerroutes.get("/artist-details/:artistId", homeController.ArtistDetails);
customerroutes.post("/specific-artist", homeController.getSpecificArtist);
customerroutes.get("/things-to-do/food&drinks", homeController.getRestaurants);
customerroutes.get("/things-to-do/experiences", homeController.getExperiences);
customerroutes.post(
  "/things-to-do/searched-experiences",
  homeController.searchedExperiences
);
// customerroutes.get("/add-restaurants", homeController.getAddRestaurants);
// customerroutes.post("/add-restaurant", homeController.PostedRestaurants);
customerroutes.post("/search-restaurants", homeController.filterRestaurants);
customerroutes.post(
  "/things-to-do/food&drinks/search-restaurant",
  homeController.searchRestaurant
);
customerroutes.get(
  "/specifictype-Restaurant",
  homeController.specificTypeRestaurants
);
customerroutes.get(
  "/things-to-do/food&drinks/:restaurantId",
  homeController.specificRestaurant
);

customerroutes.get("/checker", homeController.check);

customerroutes.get("/partners", homeController.getPartners);
customerroutes.get("/partners/:organizerId", homeController.getPartnerEvents);
customerroutes.get("/city", homeController.getCity);

customerroutes.get("/add-event", homeController.addEvent);

customerroutes.get("/view-all", homeController.getEvents);

customerroutes.post("/view-events", homeController.filterEvents);

customerroutes.get("/event-info/:eventId", homeController.getEventInfo);

customerroutes.post("/wishlist", homeController.addToWishlist);

customerroutes.get(
  "/ticket-detail/:eventId",
  isUserAuth,
  homeController.getTicketDetails
);
customerroutes.post(
  "/ticket-payment/:eventId",
  homeController.getTicketPayment
);

customerroutes.post(
  "/ticket-contact/:eventId",
  homeController.getTicketContact
);

customerroutes.get("/checkout/success", homeController.getCheckOutSuccess);

customerroutes.post("/question", homeController.launchChatbot);

customerroutes.get("/suggestion", homeController.Suggestions);
customerroutes.post("/suggestion", homeController.postSuggestions);
customerroutes.get("/complaint", homeController.complaints);
customerroutes.post("/complaints", homeController.postComplaint);
customerroutes.get("/aboutUs", homeController.aboutUs);

customerroutes.get("/blogs", homeController.blogs);
customerroutes.get("/blogs/:blogId", homeController.readMoreBlog);

customerroutes.get("/contactUs", homeController.contactUs);
customerroutes.post("/contact-us", homeController.postContact);
customerroutes.get("/privacypolicy", homeController.privacypolicy);
customerroutes.get("/termcondition", homeController.termcondition);
customerroutes.get("/cookiepolicy", homeController.cookiepolicy);
customerroutes.get("/faqs", homeController.faqs);
customerroutes.get(
  "/experiences/view-all",
  homeController.viewAllCategoryExperiences
);
customerroutes.get(
  "/experiences/see-more/:experienceId",
  homeController.viewSingleExperience
);

// customerroutes.get("/apiadder", homeController.addRestaurantsViaApi);
// customerroutes.get("/expadder", homeController.addExperiencesViaApi);

module.exports = customerroutes;
