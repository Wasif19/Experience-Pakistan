const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const customerRoutes = require("./routes/customers");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const errorController = require("./controllers/errors");
const organizerRoutes = require("./routes/organizer");
const MongoDBstore = require("connect-mongodb-session")(session);
const passport = require("passport");
const compression = require("compression");
require("dotenv").config();

const flash = require("connect-flash");

const fileStorage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp" ||
    file.mimetype === "image/enc"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster1.mkw6cpt.mongodb.net/ExperiencePakistan`;

const app = express();

// app.use(compression());

const store = new MongoDBstore({
  uri: MONGODB_URI,
  collection: "sessions",
  expires: 1.5 * 60 * 60 * 1000,
});

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyparser.urlencoded({ extended: "pause" }));
app.use(bodyparser.json());

// app.use(
//   multer({ storage: fileStorage, fileFilter: filefilter }).single("logo")
// );
app.use(
  multer({ storage: fileStorage, fileFilter: filefilter }).array("imageURL[]")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());
//app.use(flash());

app.use(customerRoutes);
app.use(authRoutes);
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);
app.use("/organizer", organizerRoutes);
app.use(errorController.get404);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster1.mkw6cpt.mongodb.net/${process.env.MONGO_DATABASE}`
  )
  .then((result) => {
    console.log("Database Connected!");
    app.listen(process.env.PORT || 3001);
  })
  .catch((err) => {
    console.log(err);
  });
