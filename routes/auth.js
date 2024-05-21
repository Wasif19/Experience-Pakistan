const express = require("express");
const { check } = require("express-validator");
const Organizer = require("../models/Organizers");

const authRoutes = express.Router();

const authController = require("../controllers/authController");

// authRoutes.get("/hijj", authController.checker);

authRoutes.get("/organizer/signup", authController.OrganizerSignup);
authRoutes.post(
  "/organizer/signup",
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
  authController.postSignup
);
authRoutes.get("/organizer-login", authController.OrganizerSignin);
authRoutes.post(
  "/organizer-login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return Organizer.findOne({ email: value }).then((userDoc) => {
          if (!userDoc) {
            return Promise.reject("E-Mail doesn't exist!");
          }
        });
      }),
  ],
  authController.OrganizerPostSignin
);
authRoutes.get("/signout", authController.postLogout);

authRoutes.post("/newsletter", authController.postNewsletter);
authRoutes.get("/organizer/getOTP", authController.getOTP);
authRoutes.post("/verify-otp", authController.verifyOTP);

// authRoutes.post("/question", (req, res) => {
//   let question = req.body.question;
//   question = question.toLowerCase(); // Assuming the question is sent in the request body
//   const response = generateResponse(question);
//   if (response.lin) {
//     let website = response.lin;
//     let text = response.text;
//     res.json({ text, website });
//   } else {
//     res.json({ response });
//   }
// });

module.exports = authRoutes;
