const organizer = require("../models/Organizers");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const event = require("../models/Events");
const helper = require("../public/scripts/scripts");
const Tickets = require("../models/Tickets");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const Newsletters = require("../models/Newsletters");
const Organizers = require("../models/Organizers");
let isEdited = false;
let isAdded = false;
const cloudinary = require("../util/cloudinary");
sgMail.setApiKey(process.env.SENDGRID_KEY);

function convertTo12HourFormat(time24) {
  // Extract hours and minutes
  const [hours, minutes] = time24.split(":");

  // Convert to number
  const hoursNum = parseInt(hours, 10);

  // Determine AM or PM
  const period = hoursNum >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  const hours12 = hoursNum % 12 || 12;

  // Format the result
  const time12 = `${hours12}:${minutes} ${period}`;

  return time12;
}

exports.getLogin = (req, res, next) => {
  if (req.session.Organizer) {
    res.redirect("/organizer/dashboard");
  }
  res.render("organizer/login", {
    path: "/login",
    pageTitle: "/login",
    isUserAuthenticated: req.session.OrganizerisLoggedin,
    oldInput: {
      email: "",
      password: "",
    },
    wrongPass: false,
    errorMessage: null,
  });
};

exports.OrganizerPostSignin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("organizer/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
      },
      validationErrors: errors.array(),
      isUserAuthenticated: req.session.OrganizerisLoggedin,
      wrongPass: false,
    });
  }

  organizer
    .findOne({ email: email })
    .then((user) => {
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.Organizer = user;
            req.session.OrganizerisLoggedin = true;
            return req.session.save(() => {
              res.redirect("/organizer/dashboard");
            });
          }
          res.render("organizer/login", {
            errorMessage: "Wrong Password!",
            oldInput: {
              email: req.body.email,
              password: password,
            },
            path: "/login",
            isUserAuthenticated: req.session.Organizer,
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

exports.getDashboard = (req, res, next) => {
  res.render("organizer/dashboard", {
    isOrganizerAuthenticated: req.session.OrganizerisLoggedin,
    pageTitle: "Organizer Dashbord",
    Organizer: req.session.Organizer,
    path: "dashboard",
  });
};

exports.getEventList = async (req, res, next) => {
  const Events = await event.find({ OrganizerId: req.session.Organizer._id });

  res.render("organizer/events-list", {
    isOrganizerAuthenticated: req.session.OrganizerisLoggedin,
    Events: Events,
    pageTitle: "Organizer Event List",
    Organizer: req.session.Organizer,
    path: "eventlist",
    helper: helper,
  });
};

exports.organizeEvent = (req, res, next) => {
  res.render("organizer/add-event", {
    isOrganizerAuthenticated: req.session.OrganizerisLoggedin,
    pageTitle: "Organizer Event List",
    Organizer: req.session.Organizer,
    path: "organizeevent",
    isAdded: isAdded,
  });
};

exports.postLogout = (req, res, next) => {
  delete req.session.Organizer;
  req.session.OrganizerisLoggedin = false;
  req.session.destroy();
  res.redirect("/organizer/login");
};

exports.organizerAddEvent = async (req, res, next) => {
  console.log(req.body);
  const startDate = new Date(req.body.sdate);
  const endDate = new Date(req.body.edate);
  let time = req.body.sTime;
  time = convertTo12HourFormat(time);
  //const imageurl = req.body.imageURL;
  const city = req.body.city;
  const description = req.body.description;
  const category = req.body.category;
  const name = req.body.name;
  const address = req.body.address;
  const imageData = req.files;
  const tickited = req.body.ticketedEvent === "no" ? false : true;
  let Tickets = [];
  if (tickited) {
    let numofTickets = Number(req.body.numOfTickets);
    for (let i = 1; i <= numofTickets; i++) {
      Tickets.push({
        Name: req.body[`ticketType${i}`],
        price: Number(req.body[`ticketPrice${i}`]),
      });
    }
  }

  let data = await cloudinary.uploader.upload(
    imageData[0].path,
    function (err, result) {
      if (err) {
        console.log(err);
      }
    }
  );

  organizer
    .findById(req.session.Organizer._id)
    .then((organizer) => {
      const Event = new event({
        name: name,
        description: description,
        eventType: category,
        imageUrl: data.url,
        address: address,
        city: city,
        startDate: startDate,
        endDate: endDate,
        eventTime: time,
        featured: false,
        ticketed: tickited,
        tickets: Tickets,
        OrganizerId: organizer._id,
      });

      return Event.save();
    })
    .then((response) => {
      res.render("organizer/SentForApproval", {
        isOrganizerAuthenticated: req.session.OrganizerisLoggedin,
        pageTitle: "Organizer Event List",
        Organizer: req.session.Organizer,
        path: "organizeevent",
        isUserAuthenticated: req.session.Organizer,
      });
    })

    .catch((err) => {
      console.log(err);
    });
};

exports.ticketInfo = async (req, res, next) => {
  const tickets = await Tickets.find({ eventId: req.params.eventId });

  res.render("organizer/ticket-info", {
    path: "/ticket",
    Tickets: tickets,
  });
};

exports.editInfo = async (req, res, next) => {
  const Organizer = await organizer.findById(req.params.organizerId);

  res.render("organizer/organizer-edit", {
    path: "/ticket",
    Organizer: Organizer,
    isEdited: isEdited,
  });
  if (isEdited) {
    isEdited = false;
  }
};

exports.passwordChange = async (req, res, next) => {
  res.render("organizer/password-change", {
    path: "/ticket",
    errorMessage: "",
    success: false,
    password: "",
    cpassword: "",
  });
};

exports.postPasswordChange = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("organizer/password-change", {
      path: "/organizer",
      pageTitle: "Update Password",
      errorMessage: errors.array()[0].msg,
      password: req.body.password,
      cpassword: req.body.cpassword,
    });
  }
  const password = req.body.password;

  const Organizer = await organizer.findById(req.session.Organizer._id);

  const checkPassword = await bcrypt.compare(password, Organizer.password);

  if (!checkPassword) {
    return res.status(422).render("organizer/password-change", {
      path: "/organizer",
      pageTitle: "Update Password",
      errorMessage: "Please enter the correct password!",
      password: req.body.password,
      cpassword: req.body.cpassword,
    });
  }

  const hashedPass = await bcrypt.hash(req.body.cpassword, 12);

  Organizer.password = hashedPass;
  await Organizer.save();

  res.render("organizer/password-change", {
    path: "/ticket",
    errorMessage: "",
    success: true,
    password: "",
    cpassword: "",
  });
};

exports.resetPassword = (req, res, next) => {
  res.render("organizer/reset", {
    path: "reset",
    pageTitle: "reset",
    errorMessage: null,
  });
};

exports.postresetPassword = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/organizer/resetPassword");
    }
    const token = buffer.toString("hex");

    organizer
      .findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          res.render("organizer/reset", {
            errorMessage: "No Account with Email Found!",
          });
        } else {
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save().then((result) => {
            res.redirect("/");
            const name = req.body.email.split("@")[0];
            const resetLink = `http://experience-pakistan.onrender.com/organizer/newPassword/${token}`;
            const dynamicTemplateData = { name, resetLink };
            const msg = {
              to: req.body.email, // recipient email
              from: {
                email: "wasif.shahid8@gmail.com",
                name: "Experience Pakistan",
              },
              templateId: process.env.TEMPLATE_ID,
              dynamicTemplateData: dynamicTemplateData,
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

exports.updatePassword = (req, res, next) => {
  const token = req.params.token;

  organizer
    .findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res.render("organizer/new-password", {
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

  organizer
    .findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    })
    .then((user) => {
      if (!user) {
        return res.redirect("/organizer/login");
      } else if (password === cpassword) {
        bcrypt
          .hash(password, 12)
          .then((hashedpass) => {
            user.password = hashedpass;
            return user.save();
          })
          .then(() => {
            res.redirect("/organizer/login");
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditOrganizer = async (req, res, next) => {
  const firstName = req.body.fname;
  const lastName = req.body.lname;
  const description = req.body.description;
  const organizationName = req.body.organization;
  const imageData = req.files;

  const organizer = await Organizers.findById(req.body.organizerId);

  if (imageData) {
    let data = await cloudinary.uploader.upload(
      imageData[0].path,
      function (err, result) {
        if (err) {
          console.log(err);
        }
      }
    );
  }

  organizer.firstname = firstName;
  organizer.lastname = lastName;
  organizer.description = description;
  organizer.organizationName = organizationName;
  organizer.logo = imageData?.length > 0 ? data.url : organizer.logo;

  await organizer.save();
  req.session.Organizer = organizer;
  await req.session.save();
  isEdited = true;

  res.render("organizer/organizer-edit", {
    path: "/ticket",
    Organizer: organizer,
    isEdited: isEdited,
  });

  if (isEdited) {
    isEdited = false;
  }
};
