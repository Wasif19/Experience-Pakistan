const express = require("express");
const { check } = require("express-validator");
const organizerRoutes = express.Router();
const organizerrController = require("../controllers/organizerController");
const Organizer = require("../models/Organizers");
const isOrganizer = require("../middleware/organizer-is-auth");

organizerRoutes.get("/login", organizerrController.getLogin);

organizerRoutes.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please Enter a Valid Email!")
      .custom((value, { req }) => {
        return Organizer.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("E-Mail doesn't exist!");
          }
          return true;
        });
      }),
  ],
  organizerrController.OrganizerPostSignin
);

organizerRoutes.get(
  "/dashboard",
  isOrganizer,
  organizerrController.getDashboard
);

organizerRoutes.get("/events", isOrganizer, organizerrController.getEventList);
organizerRoutes.get(
  "/organize-an-event",
  isOrganizer,
  organizerrController.organizeEvent
);

organizerRoutes.post("/add-event", organizerrController.organizerAddEvent);
organizerRoutes.get("/logout", isOrganizer, organizerrController.postLogout);
organizerRoutes.get("/ticket-info/:eventId", organizerrController.ticketInfo);
organizerRoutes.get("/edit-info/:organizerId", organizerrController.editInfo);
organizerRoutes.post("/edit-info", organizerrController.postEditOrganizer);
organizerRoutes.get(
  "/password-change",
  isOrganizer,
  organizerrController.passwordChange
);
organizerRoutes.post(
  "/edit-info",
  isOrganizer,
  [
    check("cpassword")
      .isLength({ min: 5 })
      .withMessage("Password should be at least 5 characters long!"),
  ],
  organizerrController.postPasswordChange
);

organizerRoutes.get("/resetPassword", organizerrController.resetPassword);
organizerRoutes.post("/reset-password", organizerrController.postresetPassword);
organizerRoutes.get("/newPassword/:token", organizerrController.updatePassword);
organizerRoutes.post("/newPassword", organizerrController.postupdatePassword);

module.exports = organizerRoutes;
