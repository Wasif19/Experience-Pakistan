const express = require("express");
// const path = require("path");
// const rootdir = require("../util/path");
const { check } = require("express-validator");
const userRoutes = express.Router();
const userController = require("../controllers/userController");
const User = require("../models/Users");
const isUserAuth = require("../middleware/user-is-auth");
var passport = require("passport");
var GoogleStrategy = require("passport-google-oidc");
GOOGLE_CLIENT_ID =
  "1054219125066-euuvb74350vtkku3unb7efjc9osmp4a5.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://experience-pakistan.onrender.com/user/oauth2/redirect/google",
      scope: ["profile", "email"],
    },
    async function (accessToken, profile, cb) {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          // User not found, create a new one
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
          });

          // Save the user
          await user.save();
        }

        // Return user
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    }
  )
);
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
userRoutes.get("/login", userController.getuserLogin);
userRoutes.get("/resetPassword", userController.resetPassword);
userRoutes.post("/resetPassword", userController.postresetPassword);
userRoutes.get("/updatePassword", userController.postresetPassword);
userRoutes.get("/newPassword/:token", userController.updatePassword);
userRoutes.post("/newPassword", userController.postupdatePassword);

userRoutes.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("E-Mail doesn't exist!");
          }
        });
      }),
  ],
  userController.userPostLogin
);
userRoutes.get("/signup", userController.getuserSignup);
userRoutes.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
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
  userController.postuserSignup
);
userRoutes.get("/dashboard", isUserAuth, userController.getUserDashboard);
userRoutes.get("/tickets", isUserAuth, userController.getUserTickets);
userRoutes.get("/verified", userController.userVerified);

userRoutes.get("/logout", userController.postUserLogout);

userRoutes.get("/login/federated/google", passport.authenticate("google"));

// userRoutes.get(
//   "/oauth2/redirect/google",
//   passport.authenticate("google", {
//     successRedirect: "/",
//     failureRedirect: "/user/login",
//   })
// );

userRoutes.get("/lo", userController.emailChecker);

userRoutes.get("/getOTP", userController.emailChecker);
userRoutes.get("/interests/:userID", userController.getUserInterests);
userRoutes.post("/postInterest", userController.postinterests);
userRoutes.get("/events", userController.getUserEvents);
userRoutes.get("/events/your-events", userController.getYourEvents);

userRoutes.get(
  "/oauth2/redirect/google",
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  function (req, res) {
    // Here you have access to req object
    req.session.UserisLoggedin = true;
    req.session.user = req.user;
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
      }
      res.redirect("/"); // Redirect to desired page after session is saved
    });
  }
);
module.exports = userRoutes;

userRoutes.post("/email-sent", userController.postresetPassword);

userRoutes.get("/settings", userController.getUserSettings);
userRoutes.post("/settings", userController.postUpdateUserData);
userRoutes.post(
  "/password-settings",
  userController.postUpdateUserPasswordData
);
userRoutes.get("/reviews", userController.getReviews);
userRoutes.get("/add-review/:eventId", userController.getAddReview);
userRoutes.post("/add-review", userController.postAddReview);
userRoutes.get("/ticket-details/:eventId", userController.getTicketDetails);
userRoutes.get("/wishlist", isUserAuth, userController.getWishlist);
// userRoutes.get("/event-info/:eventId", userController.getEventInfo);
// userRoutes.get("/r", isUserAuth, userController.getRecommendations);
