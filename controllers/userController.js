const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const newsLetter = require("../models/Newsletters");
var passport = require("passport");
var GoogleStrategy = require("passport-google-oidc");
const event = require("../models/Events");
const helper = require("../public/scripts/scripts");
const fileHelper = require("../util/file");
const organizer = require("../models/Organizers");
let isUpdated = false;
let passwordError = false;

if (process.env.NODE_ENV !== "production") require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const Newsletters = require("../models/Newsletters");
sgMail.setApiKey(process.env.SENDGRID_KEY);

const ticket = require("../models/Tickets");
const Users = require("../models/Users");
const Experiences = require("../models/Experiences");
const Events = require("../models/Events");
const Tickets = require("../models/Tickets");

exports.emailChecker = (req, res, next) => {
  console.log(req.query);
  const User = {
    name: req.query.name,
    number: req.query.number,
    email: req.query.email,
    password: req.query.password,
    city: req.query.city,
  };
  const name = req.query.name;
  const email = req.query.email;
  const verificationCode = String(Math.floor(10000 + Math.random() * 90000));

  // Construct the dynamic template data
  const dynamicTemplateData = {
    verification_code_digits: verificationCode.split(""),
    name: name,
  };

  // Construct the email
  const msg = {
    to: email, // recipient email
    from: {
      email: "wasif.shahid8@gmail.com",
      name: "Experience Pakistan",
    }, // sender email
    templateId: "d-882c8928e6684422ac6bb4e957dfb218",
    dynamicTemplateData: {
      verification_code_digits: dynamicTemplateData.verification_code_digits,
      name: dynamicTemplateData.name, // Assuming `dynamicTemplateData` contains the name
    },
  };

  // Send the email
  sgMail
    .send(msg)
    .then(() => {
      req.session.tempUser = User;
      return req.session.save(() => {
        res.render("user/otp", {
          verificationCode: verificationCode,
        });
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).send("Error sending verification code.");
    });
};

exports.getuserLogin = (req, res, next) => {
  res.render("user/login", {
    path: "login",
    pageTitle: "Login",
    errorMessage: null,
    oldInput: {
      email: "",
      password: "",
    },
    wrongPass: false,
  });
};

exports.resetPassword = (req, res, next) => {
  res.render("organizer/reset", {
    path: "reset",
    pageTitle: "reset",
    errorMessage: null,
  });
};
exports.updatePassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("user/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: null,
        userId: user._id.toString(),
        token: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postupdatePassword = (req, res, next) => {
  const token = req.body.token;
  const password = req.body.password;
  const cpassword = req.body.cpassword;
  const userId = req.body.userId;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      if (!user) {
        return res.redirect("/user/login");
      } else if (password === cpassword) {
        console.log("yes");
        bcrypt
          .hash(password, 12)
          .then((hashedpass) => {
            console.log(user);
            user.password = hashedpass;
            return user.save();
          })
          .then(() => {
            console.log(user);
            res.redirect("/user/login");
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postresetPassword = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/user/resetPassword");
    }
    const token = buffer.toString("hex");

    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          res.render("user/reset", {
            errorMessage: "No Account with Email Found!",
          });
        } else {
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save().then((result) => {
            res.redirect("/");
            const name = req.body.email.split("@")[0];
            const resetLink = `http://localhost:3001/user/newPassword/${token}`;
            const dynamicTemplateData = { name, resetLink };
            const msg = {
              to: req.body.email, // recipient email
              from: {
                email: "wasif.shahid8@gmail.com",
                name: "Experience Pakistan",
              },
              templateId: "d-22ca9d1ba33b4aafa51c073716b67f0d",
              dynamicTemplateData: dynamicTemplateData,
              // subject: "Password Reset",
              // html: `
              // <p>
              // You Requested a password reset</p>
              // <p>Click this <a href="http://localhost:3001/user/newPassword/${token}">link</a> to set a new Password!</p>`, // sender email
            };

            // Send the email
            sgMail.send(msg).then(() => {
              console.log("Password Reset Email Sent!");
            });
          });
        }
      })

      .catch((error) => {
        console.error(error);
      });
  });
};
exports.getuserSignup = (req, res, next) => {
  res.render("user/signup", {
    path: "signup",
    pageTitle: "signup",
    errorMessage: null,
    oldInput: {
      email: "",
      password: "",
      cpassword: "",
      name: "",
      phone: "",
    },
  });
};

exports.postuserSignup = (req, res, next) => {
  const imageData = req.files;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("user/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
        cpassword: req.body.cpassword,
        name: req.body.name,
        phone: req.body.phone,
      },
      validationErrors: errors.array(),
    });
  }

  return bcrypt.hash(password, 12).then((hashedpass) => {
    const user = {
      haha: "hah",
      name: req.body.name,
      number: req.body.phone,
      email: req.body.email,
      password: hashedpass,
      city: req.body.city,
      // cart: { Event: [] },
    };

    console.log(user);

    res.redirect("/user/getOTP?user=" + new URLSearchParams(user));
  });
};

exports.userPostLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(email, password);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("user/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
      },
      wrongPass: false,
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user.password) {
        return res.render("user/login", {
          errorMessage: "Please Sign in Via Google!",
          oldInput: {
            email: req.body.email,
            password: password,
          },
          wrongPass: false,
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.user = user;
            req.session.UserisLoggedin = true;
            return req.session.save(() => {
              res.redirect("/user/dashboard");
            });
          }
          res.render("user/login", {
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

exports.userVerified = (req, res, next) => {
  console.log(req.session.tempUser);
  const name = req.session.tempUser.name;
  const number = req.session.tempUser.number;
  const email = req.session.tempUser.email;
  const city = req.session.tempUser.city;
  const password = req.session.tempUser.password;
  const user = new User({
    name: name,
    number: number,
    email: email,
    city: city,
    password: password,
  });
  user
    .save()
    .then((result) => {
      res.render("user/verified");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getUserDashboard = async (req, res, next) => {
  const User = await Users.findById(req.session.user).populate("Tickets.Event");
  const recommendations = await getRecommendations(User);
  let eventTickets = [];
  let events = [];

  for (let ticket of User.Tickets) {
    eventTickets.push(ticket.Event);
  }

  for (let ev of eventTickets) {
    const result = await event.findById(ev);
    events.push(result);
  }

  let reviewedEvents = [];
  let counter = 0;
  for (let rEvents of events) {
    if (rEvents.endDate < Date.now()) {
      for (let reviews of User.Reviews) {
        if (reviews.EventId.toString() === rEvents._id.toString()) {
          counter = counter + 1;
        }
      }
      if (counter === 0) {
        reviewedEvents.push(rEvents);
      }
    }
  }

  //console.log(admin);

  if (User) {
    return res.render("user/dashboard", {
      User: User,
      path: "/dashboard",
      reviewedEvents: reviewedEvents,
      helper: helper,
      recommendations: recommendations,
    });
  }
  res.redirect("/user/login");
};

exports.getUserInterests = async (req, res, next) => {
  //console.log(admin);
  try {
    const user = await User.findById(req.params.userID);
    res.render("user/interests", {
      interests: user.interests,
      path: "/interests",
    });
  } catch (err) {
    {
      console.log(err);
    }
  }
};

exports.postUserLogout = (req, res, next) => {
  // req.session.Admin.destroy((err) => {
  //   res.redirect("/admin/admin-login");

  // });

  delete req.session.user;
  delete req.session.passport;
  req.session.UserisLoggedin = false;
  res.redirect("/user/login");
};

exports.postinterests = (req, res, next) => {
  // req.session.Admin.destroy((err) => {
  //   res.redirect("/admin/admin-login");

  // });
  console.log(req.body);
  User.findById(req.session.user)
    .then((user) => {
      if (user) {
        user.interests = req.body.interest;
        return user.save().then(() => {
          req.session.user = user;
          return req.session.save();
        });
      }
      res.redirect("/user/dashboard");
    })
    .then(() => {
      res.redirect("/user/dashboard");
    });
};

exports.getUserEvents = async (req, res, next) => {
  const User = req.session.user;
  let eventTickets = [];

  for (let ticket of User.Tickets) {
    eventTickets.push(ticket.Event);
  }

  let cdocs = await event
    .find({ startDate: { $gte: new Date() } })
    .countDocuments();
  event.find({ startDate: { $gte: new Date() } }).then(async (Events) => {
    console.log(ticket);
    res.render("user/events", {
      events: Events,
      helper: helper,
      cdocs: cdocs,
      yourevents: eventTickets.length,
      path: "/user-events",
    });
  });
};

exports.getYourEvents = async (req, res, next) => {
  const User = req.session.user;
  let eventTickets = [];
  let events = [];

  let cdocs = await event
    .find({ startDate: { $gte: new Date() } })
    .countDocuments();

  for (let ticket of User.Tickets) {
    eventTickets.push(ticket.Event);
  }

  for (let ev of eventTickets) {
    const result = await event.findById(ev);
    events.push(result);
  }

  res.render("user/events", {
    events: events,
    helper: helper,
    cdocs: cdocs,
    yourevents: eventTickets.length,
    path: "/your-events",
  });

  // let cdocs = await event
  //   .find({ startDate: { $gte: new Date() } })
  //   .countDocuments();
  // event.find({ startDate: { $gte: new Date() } }).then((Events) => {
  //   res.render("user/events", {
  //     events: Events,
  //     helper: helper,
  //     cdocs: cdocs,
  //   });
  // });
};

exports.getUserTickets = async (req, res, next) => {
  const tickets = await ticket
    .find({ customerEmail: req.session.user.email })
    .populate("eventId")
    .populate({
      path: "eventId",
      populate: {
        path: "OrganizerId",
        model: "Organizer",
      },
    });

  res.render("user/tickets", {
    Tickets: tickets,
    helper: helper,
    path: "/ticket",
  });
};

exports.emailsent = (req, res, next) => {
  console.log("yes");
  res.render("user/email-sent", {
    errorMessage: null,
    pageTitle: "Email Send",
    path: "email-sent",
  });
};

exports.getUserSettings = (req, res, next) => {
  console.log(isUpdated, passwordError);
  res.render("user/setting", {
    path: "settings",
    User: req.session.user,
    isUpdated: isUpdated,
    passwordError: passwordError,
  });
  if (isUpdated) {
    isUpdated = false;
  }
  if (passwordError) {
    passwordError = false;
  }
};

exports.postUpdateUserData = async (req, res, next) => {
  try {
    const { name, email, number } = req.body;
    const imageData = req.files;

    const User = await Users.findById(req.session.user._id);

    if (imageData) {
      if (imageData[0].path === User.imageUrl || !User.imageUrl) {
        User.imageUrl = imageData[0].path;
      } else {
        fileHelper.deleteFile(User.imageUrl);
        User.imageUrl = imageData[0].path;
      }

      User.name = name;
      User.number = number;
      User.email = email;

      await User.save();

      req.session.user = User;
      isUpdated = true;

      res.redirect("/user/settings");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postUpdateUserPasswordData = (req, res, next) => {
  Users.findById(req.session.user._id).then((Admin) => {
    return bcrypt.compare(req.body.password, Admin.password).then((match) => {
      if (match) {
        return bcrypt
          .compare(req.body.cpassword, Admin.password)
          .then((doMatch) => {
            if (!doMatch) {
              bcrypt.hash(req.body.cpassword, 12).then((hashedpass) => {
                Admin.password = hashedpass;
                return Admin.save().then((result) => {
                  console.log("UPDATED User!");
                  isUpdated = true;
                  res.redirect("/user/settings");
                });
              });
            } else {
              return Admin.save().then((result) => {
                console.log("UPDATED User!");
                isUpdated = true;
                res.redirect("/user/settings");
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        passwordError = true;
        res.redirect("/user/settings");
      }
    });
  });
};

exports.getReviews = async (req, res, next) => {
  console.log(req.session.user);
  const user = await User.findById(req.session.user._id).populate(
    "Reviews.EventId"
  );
  console.log("The reviews are", user.Reviews);
  res.render("user/reviews", {
    path: "/review",
    reviews: user.Reviews,
  });
};

exports.getAddReview = async (req, res, next) => {
  console.log(req.params);
  const event = await Events.findById(req.params.eventId);
  res.render("user/review-form", {
    path: "/review",
    Event: event,
  });
};

exports.postAddReview = async (req, res, next) => {
  const review = req.body;
  const user = await Users.findById(req.session.user._id);
  for (let reviews of user.Reviews) {
    if (review.EventId === reviews.EventId) {
      return res.redirect("/user/dashboard");
    }
  }
  user.Reviews.push(review);
  await user.save();
  res.render("user/reviews", {
    path: "/review",
  });
};

exports.getTicketDetails = async (req, res, next) => {
  const ticket = await Tickets.findById(req.params.eventId).populate("eventId");
  res.render("user/ticket-detail", {
    path: "/tickets",
    Ticket: ticket,
    User: req.session.user,
  });
};

exports.getWishlist = async (req, res, next) => {
  console.log(req.session.user);
  const user = await User.findById(req.session.user._id).populate(
    "wishlist.item"
  );
  const wishlists = user.wishlist;
  console.log(wishlists);
  res.render("user/wishlist", {
    path: "wishlist",
    pageTitle: "Wishlist",
    Wishlist: wishlists,
  });
};

getRecommendations = async (user) => {
  try {
    const interests = user.interests;
    const attendedEvents = user.Tickets.map((ticket) => ticket.Event);
    const PREVIOUS_EVENT_WEIGHT = 2;
    const INTEREST_WEIGHT = 1;

    const categoryMapping = {
      Reading: ["Seminars, Conferences & Community", "Education"],
      Traveling: ["Seminars, Conferences & Community"],
      Cooking: ["Food"],
      Music: ["Concert"],
      Photography: ["Arts & Culture", "Exhibition & Workshops"],
      Sports: ["Sports"],
      "Art&Culture": ["Arts & Culture"],
      "Fashion&Lifestyle": ["Fashion & LifeStyle"],
      "Fitness&Health": ["Sports"],
      Technology: ["Technology"],
    };

    const relevantCategories = new Set();
    interests.forEach((interest) => {
      if (categoryMapping[interest]) {
        categoryMapping[interest].forEach((category) =>
          relevantCategories.add(category)
        );
      }
    });

    const attendedCategories = new Set(
      attendedEvents.map((event) => event.eventType)
    );

    const upcomingEvents = await Events.find({
      startDate: { $gte: new Date() },
    });

    const eventScores = upcomingEvents.map((event) => {
      let score = 0;
      if (attendedCategories.has(event.eventType)) {
        score += PREVIOUS_EVENT_WEIGHT;
      }
      if (relevantCategories.has(event.eventType)) {
        score += INTEREST_WEIGHT;
      }
      return { event, score };
    });

    eventScores.sort((a, b) => b.score - a.score);

    const recommendedEvents = eventScores
      .filter((eventScore) => eventScore.score > 0)
      .map((eventScore) => eventScore.event);
    let finalRecommendations = [];

    if (attendedEvents.length === 0) {
      return recommendedEvents;
    } else {
      finalRecommendations = recommendedEvents.filter((event) => {
        const result = attendedEvents.filter((ev) => {
          if (ev._id.toString() === event._id.toString()) {
            return ev;
          }
        });
        if (result.length === 0) {
          return result;
        }
      });
    }

    return finalRecommendations;
  } catch (err) {
    console.log(err);
  }
};

// exports.getEventInfo = async (req, res, next) => {
//   const event = req.params.eventId;

//   const events = await Tickets.findById(event).populate("eventId");
//   const Organizer = await organizer.findById(events.eventId.OrganizerId);

//   console.log(events);

//   res.render("user/event-info", {
//     path: "/home",
//     pageTitle: "EventInfo",
//     Event: events,
//     Organizer: Organizer,
//     isUserAuthenticated: req.session.UserisLoggedin,
//     helper: helper,
//     number: Organizer.number || "+923274791154",
//     eventId: events.eventId._id,
//   });
// };
