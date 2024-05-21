const multer = require("multer");
const Organizer = require("../models/Organizers");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const newsLetter = require("../models/Newsletters");

if (process.env.NODE_ENV !== "production") require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const { channel } = require("process");
const { errorMonitor } = require("events");
sgMail.setApiKey(process.env.SENDGRID_KEY);

const smsKey = process.env.SMS_KEY;

function isValidPhoneNumber(phoneNumber) {
  const regex = /^\+923\d{9}$/;
  return regex.test(phoneNumber);
}

function generateOTP() {
  // Generate a random number between 0 and 9999
  let otp = Math.floor(Math.random() * 10000);

  // Pad the number with leading zeros if necessary
  otp = otp.toString().padStart(4, "0");

  return otp;
}

exports.OrganizerSignup = (req, res, next) => {
  // let message = req.flash("error");
  // if (message.length > 0) {
  //   message = message[0];
  // } else {
  //   message = null;
  // }

  res.render("auth/organizer-signup", {
    path: "/home",
    pageTitle: "HomePage",
    oldInput: {
      email: "",
      password: "",
      cpassword: "",
      lname: "",
      fname: "",
      organization: "",
      description: "",
      phone: "",
    },
    errorMessage: null,
    isUserAuthenticated: req.session.UserisLoggedIn,
    //errorMessage: message,
  });
};

exports.postSignup = async (req, res, next) => {
  const imageData = req.files;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/organizer-signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
        cpassword: req.body.cpassword,
        lname: req.body.lname,
        fname: req.body.fname,
        organization: req.body.organization,
        description: req.body.description,
        phone: req.body.phone,
      },
      validationErrors: errors.array(),
    });
  }

  if (!isValidPhoneNumber(req.body.phone)) {
    return res.status(422).render("auth/organizer-signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: "Enter a Valid Number!",
      oldInput: {
        email: req.body.email,
        password: password,
        cpassword: req.body.cpassword,
        lname: req.body.lname,
        fname: req.body.fname,
        organization: req.body.organization,
        description: req.body.description,
        phone: req.body.phone,
      },
      validationErrors: "Enter a Valid Number!",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const organizer = {
    checks: "sXLHa21718bsahbdhjsbd21y2183",
    firstname: req.body.fname,
    lastname: req.body.lname,
    organizationName: req.body.organization,
    description: req.body.description,
    logo: imageData[0].path,
    email: req.body.email,
    password: hashedPassword,
    number: req.body.phone,
  };

  req.session.otpOrganizer = organizer;
  await req.session.save();
  // cart: { Event: [] }

  console.log("The organizer is: ", organizer);

  res.redirect("/organizer/getOTP");

  // return bcrypt
  //   .hash(password, 12)
  //   .then((hashedpass) => {
  //     const organizer = new Organizer({
  //       firstname: req.body.fname,
  //       lastname: req.body.lname,
  //       organizationName: req.body.organization,
  //       description: req.body.description,
  //       logo: imageData[0].path,
  //       email: req.body.email,
  //       password: hashedpass,
  //     });

  //     return organizer.save();
  //   })
  //   .then((result) => {
  //     res.redirect("/organizer-login");
  //     const msg = {
  //       to: req.body.email, // Change to your recipient
  //       from: "wasif.shahid8@gmail.com", // Change to your verified sender
  //       subject: "Welcome to Experience Pakistan!",
  //       text: `Hey ${req.body.fname}, Welcome to our application!`,
  //     };
  //     sgMail
  //       .send(msg)
  //       .then(() => {
  //         console.log("Email sent");
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
};

exports.OrganizerSignin = (req, res, next) => {
  res.render("auth/organizer-login", {
    path: "/login",
    pageTitle: "Login",
    oldInput: {
      email: "",
      password: "",
    },

    errorMessage: null,
  });
};

exports.OrganizerPostSignin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array[0].msg);
    return res.status(422).render("auth/organizer-login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
      },
      validationErrors: errors.array(),
      wrongPass: false,
    });
  }

  Organizer.findOne({ email: email })
    .then((user) => {
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.Organizer = user;
            req.session.isLoggedin = true;
            return req.session.save(() => {
              res.redirect("/");
            });
          }
          res.render("auth/organizer-login", {
            errorMessage: "Wrong Password!",
            oldInput: {
              email: req.body.email,
              password: password,
            },
            wrongPass: true,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
  });
};

exports.postNewsletter = (req, res, next) => {
  const email = req.body.email;

  newsLetter
    .findOne({ email: email })
    .then((ema) => {
      if (ema) {
        console.log("Email already exists!");
        return res.redirect("/");
      } else {
        const nl = new newsLetter({
          email: email,
        });
        nl.save()
          .then((result) => {
            res.render("shop/newsletter-success", {
              path: "/home",
              isUserAuthenticated: req.session.user,
            });
            const name = email.split("@")[0];
            const dynamicTemplateData = { name: name };
            const msg = {
              to: req.body.email, // Change to your recipient
              from: {
                email: "wasif.shahid8@gmail.com",
                name: "Experience Pakistan",
              }, // Change to your verified sender
              templateId: "d-58331d3b87584ea1ad6daf038ee532ab",
              dynamicTemplateData: dynamicTemplateData,
            };
            sgMail
              .send(msg)
              .then(() => {
                console.log("Email sent");
              })
              .catch((error) => {
                console.log("yes");
                newsLetter
                  .deleteOne({ email: email })
                  .then((res) => {
                    console.log("Deleted Product");
                    console.error(error);
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

//           req.flash("error", "Invalid Email or Password");
//           res.redirect("/login");
//         })
//         .catch((err) => {
//           console.log(err);
//           res.redirect("/login");
//         });
//     })
//     .catch((err) => {
//       console.log(err);
//     });
// };

exports.getOTP = async (req, res, next) => {
  const otp = generateOTP();
  const message = `Your one-time-password is ${otp}`;

  const url = `https://api.veevotech.com/v3/sendsms?hash=${smsKey}&receivernum=${encodeURIComponent(
    req.session.otpOrganizer.number
  )}&sendernum=Default&textmessage=${encodeURIComponent(message)}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      req.session.OTP = otp;
      await req.session.save();
      console.log("SMS sent successfully:", data);
    } else {
      console.error("Failed to send SMS:", response.statusText);
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
  }
  console.log(req.query);
  const fpart = req.session.otpOrganizer.number.slice(0, 6);
  const lpart = req.session.otpOrganizer.number.slice(11);
  res.render("organizer/getOTP", {
    fpart: fpart,
    lpart: lpart,
    errorMessage: "",
  });
};

exports.verifyOTP = async (req, res, next) => {
  const num = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
  const fpart = req.session.otpOrganizer.number.slice(0, 6);
  const lpart = req.session.otpOrganizer.number.slice(11);
  const otpOrg = req.session.otpOrganizer;
  if (num === req.session.OTP) {
    const organizer = new Organizer({
      firstname: otpOrg.firstname,
      lastname: otpOrg.lastname,
      organizationName: otpOrg.organizationName,
      description: otpOrg.description,
      logo: otpOrg.logo,
      email: otpOrg.email,
      password: otpOrg.password,
      number: otpOrg.number,
      isVerified: false,
    });

    await organizer.save();

    await req.session.destroy();
    res.render("organizer/organizer-success", {
      path: "/home",
      isUserAuthenticated: req?.session?.UserisLoggedIn,
    });
  } else {
    res.render("organizer/getOTP", {
      fpart: fpart,
      lpart: lpart,
      errorMessage: "Wrong OTP",
    });
  }
};
