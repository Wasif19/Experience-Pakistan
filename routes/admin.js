const express = require("express");
const { check } = require("express-validator");

const Admin = require("../models/Admins");

const adminRoutes = express.Router();

const Organizer = require("../models/Organizers");

const adminController = require("../controllers/adminController");

const isAuth = require("../middleware/is-auth");

adminRoutes.get("/admin-login", adminController.getAdminLogin);
adminRoutes.get("/admin-signup", adminController.getAdminSignup);
adminRoutes.post(
  "/admin-dashboard",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return Admin.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already, please pick a different one."
            );
          }
        });
      }),
    check("password")
      .isLength({ min: 5 })
      .withMessage("Password should be at least 5 characters long!"),
    check("cpassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords should match!");
      }
      return true;
    }),
  ],
  adminController.postAdminSignup
);

adminRoutes.get("/admin-dashboard", isAuth, adminController.getAdminDashboard);
adminRoutes.post(
  "/postadmin-login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return Admin.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("E-Mail doesn't exist!");
          }
        });
      }),
  ],
  adminController.adminPostSignin
);
adminRoutes.post("/admin-logout", isAuth, adminController.postAdminLogout);
adminRoutes.get("/admin-artists", isAuth, adminController.getAdminArtists);
adminRoutes.get("/edit-artist/:artistId", isAuth, adminController.editArtist);
adminRoutes.post("/postEditArtist", isAuth, adminController.postEditArtist);
adminRoutes.get("/add-artist", isAuth, adminController.addArtists);
adminRoutes.post("/postAddArtist", isAuth, adminController.postAddArtists);
adminRoutes.get(
  "/delete-artist/:artistId",
  isAuth,
  adminController.deleteArtist
);
adminRoutes.get(
  "/delete-restaurant/:restaurantId",
  isAuth,
  adminController.deleteRestaurant
);
adminRoutes.get(
  "/admin-restaurants",
  isAuth,
  adminController.getAdminRestaurants
);
adminRoutes.get("/add-restaurants", isAuth, adminController.getAddRestaurants);
adminRoutes.post("/add-restaurant", isAuth, adminController.PostedRestaurants);
adminRoutes.get(
  "/admin-RestDetails/:restId",
  isAuth,
  adminController.getRestSeeMore
);
adminRoutes.get(
  "/admin-editRestDetails/:restId",
  isAuth,
  adminController.getEditRestaurant
);
adminRoutes.post(
  "/postEdit-restaurant",
  isAuth,
  adminController.postEditRestaurant
);

adminRoutes.get("/admin-events", isAuth, adminController.getAdminEvents);
adminRoutes.get(
  "/EventSeeMore/:eventId",
  isAuth,
  adminController.getEventSeeMore
);

adminRoutes.get("/add-event", isAuth, adminController.addEvents);
adminRoutes.post("/add-event", isAuth, adminController.AdminAddEvents);

adminRoutes.get(
  "/admin-organizers",
  isAuth,
  adminController.getAdminOrganizers
);
adminRoutes.get("/add-organizer", isAuth, adminController.getAddOrganizer);
adminRoutes.post("/organizer", isAuth, adminController.searchOrganizer);
adminRoutes.post(
  "/postAddOrganizer",
  isAuth,
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return Organizer.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already, please pick a different one."
            );
          }
        });
      }),
    check("password")
      .isLength({ min: 5 })
      .withMessage("Password should be at least 5 characters long!"),
    check("cpassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords should match!");
      }
      return true;
    }),
  ],
  adminController.postAddOrganizer
);

adminRoutes.get(
  "/delete-organizer/:organizerId",
  isAuth,
  adminController.deleteOrganizer
);

adminRoutes.post("/searchedArtist", isAuth, adminController.searchArtist);
adminRoutes.post("/searchedRestaurant", isAuth, adminController.searchRest);

adminRoutes.get("/settings", isAuth, adminController.getSettings);
adminRoutes.post("/settings", isAuth, adminController.updateSettings);

adminRoutes.get("/add-experience", isAuth, adminController.getAddExperiences);
adminRoutes.get(
  "/edit-experience/:experienceId",
  isAuth,
  adminController.getEditExperience
);
adminRoutes.post(
  "/edit-experience",
  isAuth,
  adminController.postEditExperience
);

adminRoutes.post("/add-experience", isAuth, adminController.postAddExperience);
adminRoutes.post("/experience", isAuth, adminController.searchExperience);
adminRoutes.get(
  "/admin-experiences",
  isAuth,
  adminController.getAdminExperiences
);
adminRoutes.get(
  "/ExpDetails/:experienceId",
  isAuth,
  adminController.getSingleExperience
);

adminRoutes.get("/blogs", isAuth, adminController.getBlogs);
adminRoutes.get("/blogs/:BlogId");
adminRoutes.get("/blogs/add-blog", isAuth, adminController.getAddBlogs);
adminRoutes.post("/blogs/add-blog", isAuth, adminController.postAddBlogs);
adminRoutes.get(
  "/blogs/delete-blog/:blogId",
  isAuth,
  adminController.deleteBlog
);
adminRoutes.get("/blogs/edit-blog/:blogId", isAuth, adminController.editBlog);
adminRoutes.post("/blogs/edit-blog", isAuth, adminController.postEditBlog);
adminRoutes.get("/approve-event", isAuth, adminController.getApproveEvents);
adminRoutes.get(
  "/events/approved/:eventId",
  isAuth,
  adminController.approveEvent
);
adminRoutes.get("/events/reject/:eventId", isAuth, adminController.rejectEvent);
adminRoutes.get("/events/deleted", isAuth, adminController.getApproveEvents);
adminRoutes.get("/feedbackhub", isAuth, adminController.getFeedbackHub);
adminRoutes.get(
  "/event/delete-event/:eventId",
  isAuth,
  adminController.deleteEvent
);

adminRoutes.get(
  "/event/ticket-details/:eventId",
  isAuth,
  adminController.eventTicketDetails
);
adminRoutes.get(
  "/feedback-hub/suggestions",
  isAuth,
  adminController.getSuggestions
);
adminRoutes.get(
  "/feedback-hub/complaints",
  isAuth,
  adminController.getComplaints
);
adminRoutes.get("/orders", isAuth, adminController.getOrders);
adminRoutes.get("/add-admin", isAuth, adminController.getAddAdmin);
adminRoutes.post("/add-admin", isAuth, adminController.postAddAdmin);

adminRoutes.get(
  "/delExperience/:experienceId",
  isAuth,
  adminController.deleteExperience
);

adminRoutes.get("/event/edit-event/:eventId", adminController.getEditEvent);
adminRoutes.post("/event/edit-event", adminController.postEditEvent);
adminRoutes.post("/event", isAuth, adminController.searchEvent);
adminRoutes.get("/view-blog/:blogId", isAuth, adminController.viewBlog);
adminRoutes.get("/approve-organizer", isAuth, adminController.approveOrganizer);
adminRoutes.get("/approve-organizer", isAuth, adminController.approveOrganizer);
adminRoutes.get("/check-organizer", isAuth, adminController.checkOrganizer);
adminRoutes.get(
  "/cancel-ticket/:ticketId",
  isAuth,
  adminController.cancelTicket
);

adminRoutes.get(
  "/edit-organizer/:organizerId",
  isAuth,
  adminController.getEditOrganizer
);
adminRoutes.post("/edit-organizer", isAuth, adminController.postEditOrganizer);

adminRoutes.get(
  "/event/add-to-featured/:eventId",
  isAuth,
  adminController.addEventToFeatured
);

adminRoutes.get(
  "/event/remove-from-featured/:eventId",
  isAuth,
  adminController.removeEventToFeatured
);

///admin/delete-organizer
module.exports = adminRoutes;
