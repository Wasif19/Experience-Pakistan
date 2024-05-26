const Admin = require("../models/Admins");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Organizer = require("../models/Organizers");
const Artist = require("../models/Artists");
const Event = require("../models/Events");
const Restuarant = require("../models/Restaurants");
const fileHelper = require("../util/file");
const helper = require("../public/scripts/scripts");
const Experience = require("../models/Experiences");
const Experiences = require("../models/Experiences");
const User = require("../models/Users");
const Blogs = require("../models/Blog");
const Suggestions = require("../models/Comp&Sugg");
const Tickets = require("../models/Tickets");
const Newsletters = require("../models/Newsletters");
const Users = require("../models/Users");
const cloudinary = require("../util/cloudinary");
if (process.env.NODE_ENV !== "production") require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const { name } = require("ejs");
sgMail.setApiKey(process.env.SENDGRID_KEY);
let isArtist = "null";
let isDeleted = false;
let isEdited = false;
let isApproved = false;
let isRejected = false;

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

exports.getAdminLogin = (req, res, next) => {
  if (req.session.Admin) {
    res.redirect("/admin/admin-dashboard");
  }
  res.render("admin/admin-login", {
    path: "login",
    pageTitle: "Login",
    errorMessage: "",
  });
};

exports.getAdminSignup = (req, res, next) => {
  res.render("admin/admin-signup", {
    path: "/SignUp",
    pageTitle: "SignUp",
    errorMessage: "",
    oldInput: {
      email: "",
      password: "",
      cpassword: "",
      lname: "",
      fname: "",
    },
  });
};

exports.postAdminSignup = (req, res, next) => {
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/admin-signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
        cpassword: req.body.cpassword,
        lname: req.body.lname,
        fname: req.body.fname,
      },
      validationErrors: errors.array(),
    });
  }

  return bcrypt
    .hash(password, 12)
    .then((hashedpass) => {
      const admin = new Admin({
        firstName: req.body.fname,
        lastName: req.body.lname,
        email: req.body.email,
        password: hashedpass,
      });

      return admin.save();
    })
    .then((result) => {
      console.log("admin");
      res.redirect("/admin/admin-login");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAdminDashboard = async (req, res, next) => {
  const admin = req.session.Admin;
  //console.log(admin);
  let restaurantCount;
  let EventCount;
  let OrganizerCount;
  let ArtistCount;
  let UserCount;
  let newsletterCount = await Newsletters.countDocuments();
  let ticketCount = await Tickets.countDocuments();
  let revenue = 0;

  const tickets = await Tickets.find();

  for (let ticket of tickets) {
    revenue = revenue + ticket.customerTotalBill;
  }

  Restuarant.countDocuments()
    .then((res) => {
      restaurantCount = res;
    })
    .then(() => {
      return User.countDocuments().then((res) => {
        UserCount = res;
      });
    })
    .then(() => {
      return Event.countDocuments().then((res) => {
        EventCount = res;
      });
    })
    .then((res) => {
      return Artist.countDocuments().then((res) => {
        ArtistCount = res;
      });
    })
    .then((res) => {
      return Organizer.countDocuments().then((res) => {
        OrganizerCount = res;
      });
    })
    .then((result) => {
      res.render("admin/admin-dashboard", {
        admin: admin,
        path: "dashboard",
        OrganizerCount: OrganizerCount,
        restaurantCount: restaurantCount,
        EventCount: EventCount,
        ArtistCount: ArtistCount,
        UserCount: UserCount,
        ticketCount: ticketCount,
        revenue: revenue,
        newsletterCount: newsletterCount,
      });
    });
};

exports.adminPostSignin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(email);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/admin-login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: req.body.email,
        password: password,
      },
      validationErrors: errors.array(),
    });
  }

  Admin.findOne({ email: email })
    .then((user) => {
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.Admin = user;
            req.session.isLoggedin = true;
            return req.session.save(() => {
              res.redirect("/admin/admin-dashboard");
            });
          }
          res.render("admin/admin-login", {
            errorMessage: "Wrong Password!",
            oldInput: {
              email: req.body.email,
              password: password,
            },
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

exports.postAdminLogout = (req, res, next) => {
  // req.session.Admin.destroy((err) => {
  //   res.redirect("/admin/admin-login");

  // });

  delete req.session.Admin;
  res.redirect("/admin/admin-login");
};

exports.getAdminArtists = (req, res, next) => {
  Artist.find({})
    .then((artists) => {
      res.render("admin/admin-artist", {
        Artists: artists,
        path: "artist",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isDeleted) {
        isDeleted = false;
      }
      if (isEdited) {
        isEdited = false;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.editArtist = (req, res, next) => {
  Artist.findById(req.params.artistId)
    .then((artist) => {
      res.render("admin/edit-artist", {
        Artist: artist,
        path: "artist",
        admin: req.session.Admin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditArtist = async (req, res, next) => {
  const imageData = req.files;
  const name = req.body.name;
  const category = req.body.category;
  const description = req.body.description;
  const artistId = req.body.artistId;

  // console.log(req.body.artistId);
  // res.redirect("/admin/admin-dashboard"

  let data = await cloudinary.uploader.upload(
    imageData[0].path,
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
      }
    }
  );

  Artist.findById(artistId)
    .then((artist) => {
      artist.name = name;
      artist.description = description;
      artist.category = category;
      artist.imageUrl = data.url;
      return artist.save().then((result) => {
        isEdited = true;
        res.redirect("/admin/admin-artists");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.addArtists = (req, res, next) => {
  res.render("admin/add-artist", {
    path: "/artists",
    pageTitle: "Artists",
    admin: req.session.Admin,
  });
};

exports.postAddArtists = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const imageURL = req.files;
  const category = req.body.category;

  //console.log(name, description, imageURL, category);

  let data = await cloudinary.uploader.upload(
    imageURL[0].path,
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
      }
    }
  );

  const myArtist = new Artist({
    name: name,
    category: category,
    description: description,
    imageUrl: data.url,
  });

  myArtist
    .save()
    .then((result) => {
      console.log("Created an Artist!");
      isArtist = "true";
    })
    .then(() => {
      res.redirect("/admin/admin-artists");
    });
};

exports.getAdminRestaurants = (req, res, next) => {
  Restuarant.find({})
    .then((artists) => {
      res.render("admin/admin-restaurant", {
        Rests: artists,
        path: "restaurant",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isDeleted) {
        isDeleted = false;
      }
      if (isEdited) {
        isEdited = false;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAddRestaurants = (req, res, next) => {
  res.render("admin/add-restaurant", {
    path: "/home",
    pageTitle: "HomePage",
    admin: req.session.Admin,
  });
};
exports.PostedRestaurants = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const imageURL = req.files;
  const address = req.body.address;
  const number = req.body.number;
  const rating = req.body.rating;
  const city = req.body.city;
  const cuisine = req.body.CuisineOptions;
  const category = req.body.category;

  // let imageurl = [];

  // for (let images of imageURL) {
  //   imageurl.push(images.path);
  // }

  const uploadPromises = imageURL.map((imagePath) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(imagePath.path, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });

  const results = await Promise.all(uploadPromises);

  let imageurl = [];

  for (let result of results) {
    imageurl.push(result.url);
  }

  const Rest = new Restuarant({
    name: name,
    description: description,
    imageUrl: imageurl,
    rating: Number(rating),
    restaurantType: category,
    city: city,
    PhoneNumber: number,
    address: address,
    cuisine: cuisine,
  });

  Rest.save()
    .then((result) => {
      console.log("Created a Restaurant!");
      isArtist = "true";
      res.redirect("/admin/admin-restaurants");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getRestSeeMore = (req, res, next) => {
  Restuarant.findById(req.params.restId)
    .then((rest) => {
      res.render("admin/rest-see-more", {
        path: "/home",
        pageTitle: "HomePage",
        admin: req.session.Admin,
        Rest: rest,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditRestaurant = (req, res, next) => {
  Restuarant.findById(req.params.restId)
    .then((artist) => {
      res.render("admin/edit-restaurant", {
        Rest: artist,
        path: "restaurant",
        admin: req.session.Admin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getEditExperience = (req, res, next) => {
  Experiences.findById(req.params.experienceId)
    .then((artist) => {
      res.render("admin/edit-experience", {
        exp: artist,
        path: "experience",
        admin: req.session.Admin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditOrganizer = (req, res, next) => {
  Organizer.findById(req.params.organizerId)
    .then((organizer) => {
      res.render("admin/edit-organizer", {
        Organizer: organizer,
        path: "/organizer",
        admin: req.session.Admin,
        errorMessage: null,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEditEvent = async (req, res, next) => {
  const org = await Organizer.find();
  Event.findById(req.params.eventId)
    .then((artist) => {
      res.render("admin/edit-event", {
        Event: artist,
        path: "event",
        admin: req.session.Admin,
        Organizers: org,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditEvent = (req, res, next) => {
  Event.findById(req.params.eventId)
    .then((artist) => {
      res.render("admin/edit-event", {
        Event: artist,
        path: "event",
        admin: req.session.Admin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditRestaurant = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const imageURL = req.files;
  const address = req.body.address;
  const number = req.body.number;
  const rating = req.body.rating;
  const city = req.body.city;
  const cuisine = req.body.CuisineOptions;
  const category = req.body.category;

  const uploadPromises = imageURL.map((imagePath) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(imagePath.path, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });

  const results = await Promise.all(uploadPromises);

  let imageurl = [];

  for (let result of results) {
    imageurl.push(result.url);
  }

  // res.redirect("/admin/admin-dashboard");

  // console.log(req.body.artistId);
  // res.redirect("/admin/admin-dashboard"

  Restuarant.findById(req.body.RestId)
    .then((artist) => {
      artist.name = name;
      artist.description = description;
      artist.restaurantType = category;
      artist.imageUrl = imageurl.length > 0 ? imageurl : artist.imageUrl;
      artist.rating = Number(rating);
      artist.city = city;
      artist.PhoneNumber = number;
      artist.address = address;
      artist.cuisine = cuisine;

      return artist.save().then((result) => {
        console.log("Restaurant Updated!");
        isEdited = true;
        res.redirect("/admin/admin-restaurants");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditExperience = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const imageURL = req.files;
  const address = req.body.address;
  const number = req.body.number;
  const city = req.body.city;
  const category = req.body.category;

  const uploadPromises = imageURL.map((imagePath) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(imagePath.path, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });

  const results = await Promise.all(uploadPromises);

  let imageurl = [];

  for (let result of results) {
    imageurl.push(result.url);
  }

  Experiences.findById(req.body.experienceId)
    .then((artist) => {
      artist.name = name;
      artist.description = description;
      artist.imageUrl = imageurl.length > 0 ? imageurl : artist.imageUrl;
      artist.city = city;
      artist.category = category;
      artist.number = number;
      artist.address = address;

      return artist.save().then((result) => {
        console.log("Experience Updated!");
        isEdited = true;
        res.redirect("/admin/admin-experiences");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteArtist = (req, res, next) => {
  Artist.findByIdAndDelete(req.params.artistId)
    .then((result) => {
      console.log("Artist Deleted!");
      isDeleted = true;
      res.redirect("/admin/admin-artists");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAdminEvents = (req, res, next) => {
  Event.find({ isApproved: true })
    .populate("OrganizerId")
    .then((rests) => {
      res.render("admin/admin-events", {
        admin: req.session.Admin,
        path: "event",
        Events: rests,
        helper: helper,
        isArt: isArtist,
        isEdited: isEdited,
        isDel: isDeleted,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isEdited) {
        isEdited = false;
      }
      if (isDeleted) {
        isDeleted = false;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getEventSeeMore = (req, res, next) => {
  Event.findById(req.params.eventId)
    .populate("OrganizerId")
    .then((rest) => {
      res.render("admin/event-see-more", {
        path: "/home",
        pageTitle: "HomePage",
        admin: req.session.Admin,
        Event: rest,
        helper: helper,
        number: rest.OrganizerId.number || "03274791154",
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.addEvents = (req, res, next) => {
  Organizer.find({})
    .then((organizers) => {
      res.render("admin/add-event", {
        path: "/Add-Event",
        pageTitle: "Add An Event",
        admin: req.session.Admin,
        Organizers: organizers,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.AdminAddEvents = async (req, res, next) => {
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
  let data;
  if (tickited) {
    let numofTickets = Number(req.body.numOfTickets);
    for (let i = 1; i <= numofTickets; i++) {
      Tickets.push({
        Name: req.body[`ticketType${i}`],
        price: Number(req.body[`ticketPrice${i}`]),
      });
    }
  }
  if (imageData.length > 0) {
    data = await cloudinary.uploader.upload(
      imageData[0].path,
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
        }
      }
    );
  }
  Organizer.findOne({ organizationName: req.body.organizer })
    .then((organizer) => {
      const event = new Event({
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
        isApproved: true,
      });

      return event.save();
    })
    .then((response) => {
      isArtist = "true";
      res.redirect("/admin/admin-events");
    })

    .catch((err) => {
      console.log(err);
    });
};
exports.getAddOrganizer = (req, res, next) => {
  res.render("admin/add-organizer", {
    path: "/Add-Organizer",
    pageTitle: "Add An organizer",
    admin: req.session.Admin,
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
  });
};

exports.getAdminOrganizers = (req, res, next) => {
  Organizer.find({ $or: [{ isVerified: true }, { isVerified: null }] })
    .then((artists) => {
      res.render("admin/admin-organizers", {
        Organizers: artists,
        path: "organizer",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isDeleted) {
        isDeleted = false;
      }
      if (isEdited) {
        isEdited = false;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postAddOrganizer = async (req, res, next) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const org = req.body.organization;
  const description = req.body.description;
  const imageURL = req.files;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  const cpassword = req.body.cpassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/add-organizer", {
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
      admin: req.session.Admin,
      isArt: isArtist,
      isDel: isDeleted,
    });
  }

  let data = await cloudinary.uploader.upload(
    imageURL[0].path,
    function (err, result) {
      if (err) {
        console.log(err);
      }
    }
  );

  const hashedPass = await bcrypt.hash(password, 12);
  const myOrganizer = new Organizer({
    firstname: fname,
    lastname: lname,
    logo: data.url,
    organizationName: org,
    description: description,
    email: email,
    number: phone,
    password: hashedPass,
    isVerified: true,
  });

  myOrganizer
    .save()
    .then((result) => {
      isArtist = "true";
    })
    .then(() => {
      res.redirect("/admin/admin-organizers");
      const msg = {
        to: req.body.email, // Change to your recipient
        from: {
          email: "wasif.shahid8@gmail.com",
          name: "Experience Pakistan",
        },
        subject: "Welcome to Experience Pakistan!",
        text: `Hey ${req.body.fname}, Welcome to our application!`,
        html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>🎉 Hurray! 🎉</h1>
        <p>Hey ${req.body.fname},</p>
        <p>Welcome to our application! You have successfully registered as an event organizer on our website.</p>
        <p>Here are your credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${req.body.email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>We are excited to have you on board and look forward to seeing the amazing events you will organize!</p>
        <p>Best regards,</p>
        <p><strong>Experience Pakistan Team</strong></p>
      </div>
    `,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });
    });
  //     res.redirect("/organizer-login");
  //
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
};

//console.log(name, description, imageURL, category);

exports.searchArtist = (req, res, next) => {
  const value = req.body.searchText[0];
  Artist.find({ name: { $regex: value, $options: "i" } })
    .then((result) => {
      res.render("admin/admin-artist", {
        Artists: result,
        path: "artist",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.searchRest = (req, res, next) => {
  const value = req.body.searchText[0];
  Restuarant.find({ name: { $regex: value, $options: "i" } })
    .then((result) => {
      res.render("admin/admin-restaurant", {
        Rests: result,
        path: "restaurant",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.searchEvent = (req, res, next) => {
  const value = req.body.searchText;
  Event.find({ name: { $regex: value, $options: "i" } })
    .populate("OrganizerId")
    .then((result) => {
      res.render("admin/admin-events", {
        Events: result,
        path: "event",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
        helper: helper,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSettings = (req, res, next) => {
  Admin.findById(req.session.Admin._id)
    .then((Admin) => {
      res.render("admin/settings", {
        path: "/Setings",
        pageTitle: "Admin Settings",
        admin: Admin,
        isArt: isArtist,
        isDel: isDeleted,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isDeleted) {
        isDeleted = false;
      }
    })
    .catch((err) => {
      console.lof(err);
    });
};

exports.updateSettings = (req, res, next) => {
  Admin.findById(req.session.Admin._id).then((Admin) => {
    Admin.firstName = req.body.fname;
    Admin.lastName = req.body.lname;
    Admin.email = req.body.email;

    return bcrypt.compare(req.body.password, Admin.password).then((match) => {
      if (match) {
        return bcrypt
          .compare(req.body.cpassword, Admin.password)
          .then((doMatch) => {
            if (!doMatch) {
              bcrypt.hash(req.body.cpassword, 12).then((hashedpass) => {
                Admin.password = hashedpass;
                return Admin.save().then((result) => {
                  console.log("UPDATED ADMIN!");
                  isArtist = "true";
                  res.redirect("/admin/settings");
                });
              });
            } else {
              return Admin.save().then((result) => {
                console.log("UPDATED ADMIN!");
                isArtist = "true";
                res.redirect("/admin/settings");
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        isDeleted = true;
        res.redirect("/admin/settings");
      }
    });
  });
};
exports.deleteOrganizer = (req, res, next) => {
  Organizer.findByIdAndDelete(req.params.organizerId)
    .then((result) => {
      isDeleted = true;
      res.redirect("/admin/admin-organizers");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.deleteRestaurant = (req, res, next) => {
  Restuarant.findByIdAndDelete(req.params.restaurantId)
    .then((result) => {
      isDeleted = true;
      res.redirect("/admin/admin-restaurants");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAdminExperiences = (req, res, next) => {
  Experience.find({})
    .then((exp) => {
      res.render("admin/admin-experiences", {
        Events: exp,
        path: "experience",
        admin: req.session.Admin,
        isArt: isArtist,
        isEdited: isEdited,
        isDel: isDeleted,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isDeleted) {
        isDeleted = false;
      }
      if (isEdited) {
        isEdited = false;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAddExperiences = (req, res, next) => {
  // const getLatestEvents = () => {
  //   return Experience.aggregate([
  //     // Sort events by date in descending order
  //     { $group: { _id: "$category", category: { $push: "$$ROOT" } } }, // Group events by category
  //     { $project: { experiences: { $slice: ["$category", 4] } } }, // Limit each category to 4 events
  //     { $unwind: "$experiences" }, // Unwind the array to get individual events
  //     { $replaceRoot: { newRoot: "$experiences" } }, // Replace the root with the events
  //     { $limit: 16 }, // Limit the total number of events to 16
  //   ]).exec(); // Use exec() to return a promise
  // };

  // let heritageAndCulture = [];
  // let shopping = [];
  // let sports = [];
  // let recreation = [];
  // const getLatestEvents = () => {
  //   return Experience.aggregate([
  //     // Group events by category
  //     {
  //       $group: {
  //         _id: "$category",
  //         category: { $push: "$$ROOT" },
  //       },
  //     },
  //     // Add your own categories
  //     {
  //       $facet: {
  //         heritageAndCulture: [
  //           { $match: { _id: "Heritage & Culture" } },
  //           { $project: { experiences: { $slice: ["$category", 4] } } },
  //           { $unwind: "$experiences" },
  //           { $replaceRoot: { newRoot: "$experiences" } },
  //         ],
  //         shopping: [
  //           { $match: { _id: "Shopping" } },
  //           { $project: { experiences: { $slice: ["$category", 4] } } },
  //           { $unwind: "$experiences" },
  //           { $replaceRoot: { newRoot: "$experiences" } },
  //         ],
  //         sports: [
  //           { $match: { _id: "Sports" } },
  //           { $project: { experiences: { $slice: ["$category", 4] } } },
  //           { $unwind: "$experiences" },
  //           { $replaceRoot: { newRoot: "$experiences" } },
  //         ],
  //         recreation: [
  //           { $match: { _id: "Recreation" } },
  //           { $project: { experiences: { $slice: ["$category", 4] } } },
  //           { $unwind: "$experiences" },
  //           { $replaceRoot: { newRoot: "$experiences" } },
  //         ],
  //       },
  //     },
  //     // Combine results from all categories
  //     {
  //       $project: {
  //         experiences: {
  //           $concatArrays: [
  //             "$heritageAndCulture",
  //             "$shopping",
  //             "$sports",
  //             "$recreation",
  //           ],
  //         },
  //       },
  //     },
  //     { $unwind: "$experiences" }, // Unwind the array to get individual events
  //     { $replaceRoot: { newRoot: "$experiences" } }, // Replace the root with the events
  //     { $limit: 16 }, // Limit the total number of events to 16
  //   ]).exec(); // Use exec() to return a promise
  // };

  // getLatestEvents()
  //   .then((results) => {
  //     for (let result of results) {
  //       if (result.category === "Sports") {
  //         sports.push(result);
  //       } else if (result.category === "Recreation") {
  //         recreation.push(result);
  //       } else if (result.category === "Shopping") {
  //         shopping.push(result);
  //       } else {
  //         heritageAndCulture.push(result);
  //       }
  //     }

  //     res.redirect("/admin/admin-dashboard");
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //   });
  res.render("admin/add-experience", {
    path: "/home",
    pageTitle: "Add an Experience",
    admin: req.session.Admin,
  });
};

exports.postAddExperience = async (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const imageURL = req.files;
  const address = req.body.address;
  let number = String(req.body.number);
  const city = req.body.city;
  const category = req.body.category;

  const uploadPromises = imageURL.map((imagePath) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(imagePath.path, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });

  const results = await Promise.all(uploadPromises);

  let imageurl = [];

  for (let result of results) {
    imageurl.push(result.url);
  }

  const Experience = new Experiences({
    name: name,
    description: description,
    imageUrl: imageurl,
    category: category,
    city: city,
    number: number,
    address: address,
  });

  Experience.save()
    .then((result) => {
      console.log("Created an Experience!");
      isArtist = "true";
      res.redirect("/admin/admin-experiences");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.searchExperience = (req, res, next) => {
  const value = req.body.searchText[0];
  Experience.find({ name: { $regex: value, $options: "i" } })
    .then((result) => {
      res.render("admin/admin-experiences", {
        Events: result,
        path: "experience",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.searchOrganizer = (req, res, next) => {
  const value = req.body.searchText;
  console.log(value);
  Organizer.find({ organizationName: { $regex: value, $options: "i" } })
    .then((result) => {
      console.log(result);
      res.render("admin/admin-organizers", {
        Organizers: result,
        path: "organizers",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSingleExperience = (req, res, next) => {
  Experience.findById(req.params.experienceId)
    .then((rest) => {
      res.render("admin/singleExperience", {
        path: "/home",
        pageTitle: "HomePage",
        admin: req.session.Admin,
        Rest: rest,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getBlogs = (req, res, next) => {
  Blogs.find({})
    .then((blogs) => {
      res.render("admin/admin-blogs", {
        Blogs: blogs,
        path: "blog",
        admin: req.session.Admin,
        isArt: isArtist,
        isDel: isDeleted,
        isEdited: isEdited,
      });
    })
    .then(() => {
      if (isArtist === "true" || isArtist === "false") {
        isArtist = "null";
      }
      if (isDeleted) {
        isDeleted = false;
      }
      if (isEdited) {
        isEdited = false;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getAddBlogs = (req, res, next) => {
  res.render("admin/add-blogs", {
    path: "blog",
    pageTitle: "Add Blogs",
    admin: req.session.Admin,
  });
};

exports.postAddBlogs = async (req, res, next) => {
  try {
    let { title, author, description, briefDescription } = req.body;

    const imageUrl = req.files;

    let data = await cloudinary.uploader.upload(
      imageUrl[0].path,
      function (err, result) {
        if (err) {
          console.log(err);
        }
      }
    );

    const Blog = new Blogs({
      Author: author,
      title: title,
      imageUrl: data.url,
      briefDescription: briefDescription,
      description: description,
    });

    const Savedblog = await Blog.save();

    console.log(Savedblog);
    isArtist = "true";

    res.redirect("/admin/blogs");
  } catch (err) {
    console.log("Error Occured!", err);
  }
};

exports.deleteBlog = (req, res, next) => {
  const blogId = req.params.blogId;
  Blogs.findByIdAndDelete(blogId)
    .then((deletedBlog) => {
      console.log("Blog Deleted!");
      isDeleted = true;
      res.redirect("/admin/blogs");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getApproveEvents = async (req, res, next) => {
  const approvedEvents = await Event.find({
    isApproved: false,
    startDate: { $gte: new Date() },
  }).populate("OrganizerId");

  const totalCount = await Event.find({
    isApproved: false,
    startDate: { $gte: new Date() },
  }).countDocuments();
  await res.render("admin/approve-events", {
    pageTitle: "Approve Events",
    admin: req.session.Admin,
    path: "event",
    Events: approvedEvents,
    total: totalCount,
    helper: helper,
    isApproved: isApproved,
    isRejected: isRejected,
  });

  if (isApproved) {
    isApproved = false;
  }
  if (isRejected) {
    isRejected = false;
  }
};

exports.postEditBlog = async (req, res, next) => {
  const imageData = req.files;
  const title = req.body.title;
  const Author = req.body.author;
  const description = req.body.briefDescription;
  const blogId = req.body.blogId;
  let data;

  // console.log(req.body.artistId);
  // res.redirect("/admin/admin-dashboard"

  if (imageData.length > 0) {
    data = await cloudinary.uploader.upload(
      imageData[0].path,
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
        }
      }
    );
  }

  Blogs.findById(blogId)
    .then((artist) => {
      artist.title = title;
      artist.briefDescription = description;
      artist.Author = Author;
      artist.imageUrl = data?.url || artist.imageUrl;
      return artist.save().then((result) => {
        isEdited = true;
        res.redirect("/admin/blogs");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditOrganizer = async (req, res, next) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const org = req.body.organization;
  const description = req.body.description;
  const imageURL = req.files;
  const email = req.body.email;
  const phone = req.body.phone;

  let data = await cloudinary.uploader.upload(
    imageURL[0].path,
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
      }
    }
  );

  const organizer = await Organizer.findByIdAndUpdate(req.body.organizerId, {
    firstname: fname,
    lastname: lname,
    logo: data.url,
    organizationName: org,
    description: description,
    email: email,
    number: phone,
  });

  // console.log(req.body.artistId);
  isEdited = true;
  res.redirect("/admin/admin-organizers");
};

exports.editBlog = (req, res, next) => {
  Blogs.findById(req.params.blogId)
    .then((artist) => {
      res.render("admin/edit-blogs", {
        Blogs: artist,
        path: "blog",
        admin: req.session.Admin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.approveEvent = async (req, res, next) => {
  const event = await Event.findById(req.params.eventId).populate(
    "OrganizerId"
  );
  event.isApproved = true;
  await event.save();
  isApproved = true;
  res.redirect("/admin/approve-event");
  const msg = {
    to: event.OrganizerId.email, // Change to your recipient
    from: {
      email: "wasif.shahid8@gmail.com",
      name: "Experience Pakistan",
    },
    subject: "Congratulations! Your event is Approved!",
    text: `Hey ${event.OrganizerId.firstname}, Welcome to our application!`,
    html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>🎉 Congratulations! 🎉</h1>
        <p>Dear ${event.OrganizerId.organizationName},</p>
        <p>We are thrilled to inform you that your event, <strong>${event.name}</strong>, has been approved and is now live on our website!</p>
        <div style="text-align: center;">
          <img src="${event.imageUrl}" alt="${event.name}" style="max-width: 100%; height: auto;" />
        </div>
        <p>We hope your event is a great success and reaches a wide audience. We are excited to see the amazing experiences you'll bring to our community.</p>
        <p>Thank you for being a part of Experience Pakistan.</p>
        <p>Best regards,</p>
        <p><strong>The Experience Pakistan Team</strong></p>
      </div>
    `,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
};

exports.rejectEvent = async (req, res, next) => {
  const result = await Event.findByIdAndDelete(req.params.eventId);
  isRejected = true;

  console.log(result);

  res.redirect("/admin/approve-event");
};

exports.getFeedbackHub = async (req, res, next) => {
  const suggestions = await Suggestions.find({ type: "Contact" });
  res.render("admin/feedback-hub", {
    path: "feedback",
    admin: req.session.Admin,
    type: "Contacts",
    Query: suggestions,
  });
};
exports.getSuggestions = async (req, res, next) => {
  const suggestions = await Suggestions.find({ type: "Suggestion" });

  res.render("admin/feedback-hub", {
    path: "feedback",
    admin: req.session.Admin,
    Query: suggestions,
    type: "Suggestions",
  });
};

exports.getComplaints = async (req, res, next) => {
  const suggestions = await Suggestions.find({ type: "Complaint" });

  res.render("admin/feedback-hub", {
    path: "feedback",
    admin: req.session.Admin,
    Query: suggestions,
    type: "Complaints",
  });
};

exports.deleteEvent = (req, res, next) => {
  Event.findByIdAndDelete(req.params.eventId)
    .then((result) => {
      console.log("Event Deleted!");
      isDeleted = true;
      res.redirect("/admin/admin-events");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.eventTicketDetails = async (req, res, next) => {
  const ev = await Event.findById(req.params.eventId).populate("OrganizerId");
  res.render("admin/admin-tickets", {
    path: "event",
    admin: req.session.Admin,
    Event: ev,
    number: "03081877779",
  });
};

exports.getOrders = async (req, res, next) => {
  try {
    const ticket = await Tickets.find().populate("eventId");
    console.log(ticket);
    const total = await Tickets.countDocuments();
    res.render("admin/ticket-orders", {
      path: "orders",
      admin: req.session.Admin,
      Orders: ticket,
      total: total,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getAddAdmin = async (req, res, next) => {
  res.render("admin/add-admin", {
    path: "/add-admin",
    admin: req.session.Admin,
    isArt: isArtist,
    isDel: isDeleted,
  });
  if (isArtist === "true" || isArtist === "false") {
    isArtist = "null";
  }
  if (isDeleted) {
    isDeleted = false;
  }
};

exports.postAddAdmin = async (req, res, next) => {
  // const suggestions = await Suggestions.find({ type: "Complaint" });

  // res.render("admin/feedback-hub", {
  //   path: "feedback",
  //   admin: req.session.Admin,
  //   Query: suggestions,
  //   type: "Complaints",
  // });

  if (req.body.password === req.body.cpassword) {
    const hashedPass = await bcrypt.hash(req.body.password, 12);
    const admin = new Admin({
      firstName: req.body.fname,
      lastName: req.body.lname,
      email: req.body.email,
      password: hashedPass,
      adminType: "Admin",
    });

    await admin.save();
    console.log("Admin Saved");
    isArtist = "true";
    res.redirect("/admin/add-admin");
  } else {
    isDeleted = true;
    res.redirect("/admin/add-admin");
  }
};

exports.deleteExperience = (req, res, next) => {
  Experience.findByIdAndDelete(req.params.experienceId)
    .then((result) => {
      isDeleted = true;
      res.redirect("/admin/admin-experiences");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postEditEvent = async (req, res, next) => {
  const startDate = req.body.sdate.length < 2 ? null : new Date(req.body.sdate);
  const endDate = req.body.edate.length < 2 ? null : new Date(req.body.edate);
  let time =
    req.body.sTime.length < 1 ? null : convertTo12HourFormat(req.body.sTime);

  //const imageurl = req.body.imageURL;
  const city = req.body.city;
  const description = req.body.description;
  const category = req.body.category;
  const name = req.body.name;
  const address = req.body.address;
  const imageData = req?.files;
  const tickited = req.body.ticketedEvent === "no" ? false : true;
  let data;
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

  const organizer = await Organizer.findOne({
    organizationName: req.body.organizer,
  });

  Event.findById(req.body.eventId)
    .then(async (event) => {
      if (imageData.length > 0) {
        data = await cloudinary.uploader.upload(
          imageData[0].path,
          function (err, result) {
            if (err) {
              console.log(err);
            } else {
            }
          }
        );
      }
      event.name = name;
      event.description = description;
      event.eventType = category;
      event.imageUrl = imageData?.length > 0 ? data.url : event.imageUrl;
      event.address = address;
      event.city = city;
      event.startDate = startDate ? startDate : event.startDate;
      event.endDate = endDate ? endDate : event.endDate;
      event.eventTime = time ? time : event.eventTime;
      event.featured = false;
      event.ticketed = tickited;
      event.tickets = Tickets;
      event.OrganizerId = organizer._id;
      event.isApproved = true;

      event.save().then((response) => {
        isEdited = true;
        res.redirect("/admin/admin-events");
      });
    })

    .catch((err) => {
      console.log(err);
    });
};

exports.viewBlog = async (req, res, next) => {
  const blog = await Blogs.findById(req.params.blogId);

  // const text = convertHtmlToPlainText(blog.description);
  // console.log(text);
  res.render("admin/view-blog", {
    admin: req.session.Admin,
    Blog: blog,
    path: "blog",
  });
};

exports.approveOrganizer = async (req, res, next) => {
  const organizer = await Organizer.find({ isVerified: false });
  const total = await Organizer.find({ isVerified: false }).countDocuments();

  // const text = convertHtmlToPlainText(blog.description);
  // console.log(text);
  res.render("admin/approve-organizers", {
    admin: req.session.Admin,
    Organizers: organizer,
    path: "organizer",
    total: total,
    isApproved: isApproved,
    isRejected: isRejected,
  });

  if (isApproved) {
    isApproved = false;
  }
  if (isRejected) {
    isRejected = false;
  }
};

exports.checkOrganizer = async (req, res, next) => {
  console.log(req.query);
  if (req.query.type === "delete") {
    const organizer = await Organizer.findByIdAndDelete(req.query.id);
    isRejected = true;
    res.redirect("/admin/approve-organizer");
  } else {
    const organizer = await Organizer.findByIdAndUpdate(req.query.id, {
      isVerified: true,
    });
    isApproved = true;
    res.redirect("/admin/approve-organizer");
    const msg = {
      to: organizer.email, // Change to your recipient
      from: {
        email: "wasif.shahid8@gmail.com",
        name: "Experience Pakistan",
      },
      subject: "Welcome to Experience Pakistan!",
      text: `Hey ${organizer.firstname}, Welcome to our application!`,
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h1>🎉 Hurray! 🎉</h1>
        <p>Hey ${req.body.fname},</p>
        <p>Welcome to our application! You have been successfully approved as an event organizer on our website.</p>
        <p>We are excited to have you on board and look forward to seeing the amazing events you will organize!</p>
        <p>Best regards,</p>
        <p><strong>Experience Pakistan Team</strong></p>
      </div>
    `,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
  }
  // const organizer = await Organizer.find({ isVerified: false });
  // const total = await Organizer.find({ isVerified: false }).countDocuments();
  // // const text = convertHtmlToPlainText(blog.description);
  // // console.log(text);
  // res.render("admin/approve-organizers", {
  //   admin: req.session.Admin,
  //   Organizers: organizer,
  //   path: "organizer",
  //   total: total,
  //   isApproved: isApproved,
  //   isRejected: isRejected,
  // });
};

exports.cancelTicket = async (req, res, next) => {
  // console.log(req.params);
  const ticket = await Tickets.findByIdAndDelete(req.params.ticketId);
  const user = await Users.find({ email: ticket.customerEmail });

  const newTickets = user[0].Tickets.filter((result) => {
    // console.log(result.Event);
    if (result.Event.toString() !== ticket.eventId.toString()) {
      return result;
    }
  });

  user[0].Tickets = newTickets;
  await user[0].save();

  res.redirect("/admin/admin-dashboard");
};

exports.addEventToFeatured = async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.eventId, {
    featured: true,
  });

  res.redirect("/admin/admin-events");

  // const text = convertHtmlToPlainText(blog.description);
  // console.log(text);
};

exports.removeEventToFeatured = async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.eventId, {
    featured: false,
  });
  res.redirect("/admin/admin-events");

  // const text = convertHtmlToPlainText(blog.description);
  // console.log(text);
};
