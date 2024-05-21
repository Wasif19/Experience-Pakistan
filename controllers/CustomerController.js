const Artist = require("../models/Artists");
const Restaurant = require("../models/Restaurants");
const organizer = require("../models/Organizers");
const fetch = require("node-fetch");

const Event = require("../models/Events");
const User = require("../models/Users");
const Blog = require("../models/Blog");

const Experience = require("../models/Experiences");
const ticket = require("../models/Tickets");
const Suggestions = require("../models/Comp&Sugg");

const helper = require("../public/scripts/scripts");
const { request } = require("express");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const fs = require("fs");
const { session } = require("passport");
const Experiences = require("../models/Experiences");
const Users = require("../models/Users");

let ARTISTS_PER_PAGE = 6;
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
function generateTicketID() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let ticketID = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    ticketID += characters[randomIndex];
  }
  return ticketID;
}
exports.HomePage = (req, res, next) => {
  res.render("shop/home", {
    path: "/home",
    pageTitle: "HomePage",
    isUserAuthenticated: req.session.UserisLoggedin,
  });
};
exports.searchCity = (req, res, next) => {
  res.render("shop/searchby-city", {
    path: "/searchCity",
    pageTitle: "HomePage",
    isUserAuthenticated: req.session.UserisLoggedin,
  });
};

exports.getArtists = (req, res, next) => {
  let TotalArtists;
  const page = +req.query.page || 1;
  Artist.find()
    .countDocuments()
    .then((numArts) => {
      TotalArtists = numArts;
      return Artist.find({})
        .skip((page - 1) * ARTISTS_PER_PAGE)
        .limit(ARTISTS_PER_PAGE);
    })

    .then((artist) => {
      res.render("shop/artists", {
        Artists: artist,
        pageTitle: "Artists",
        path: "/artists",
        currentPage: page,
        hasNextPage: ARTISTS_PER_PAGE * page < TotalArtists,
        hasPreviousPage: page > 1,
        nextPage: Number(page) + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(TotalArtists / ARTISTS_PER_PAGE),
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.ArtistDetails = async (req, res, next) => {
  try {
    let artist = await Artist.findById(req.params.artistId);
    res.render("shop/artist-details", {
      path: "/artist-details",
      pageTitle: "Artists",
      Artist: artist,
      isUserAuthenticated: req.session.UserisLoggedin,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getSpecificArtist = (req, res, next) => {
  const value = req.body.category;
  Artist.find({ category: value })
    .then((artists) => {
      if (artists.length !== 0) {
        res.render("shop/specific-artist", {
          path: "/specific-artist",
          pageTitle: `${artists[0].category}`,
          Artists: artists,
          heading: req.body.category + "s",
          isUserAuthenticated: req.session.UserisLoggedin,
        });
      } else {
        res.render("shop/specific-artist", {
          path: "/specific-artist",
          pageTitle: value,
          Artists: [],
          heading: req.body.category + "s",
          isUserAuthenticated: req.session.UserisLoggedin,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.filterRestaurants = (req, res, next) => {
  //console.log(req.body.foodType, req.body.cuisine, req.body.rating);
  const filters = {};
  if (req.body.foodType) {
    filters.cuisine = { $in: req.body.foodType };
  }

  if (req.body.cuisine) {
    filters.restaurantType = { $in: req.body.cuisine };
  }

  if (req.body.rating) {
    filters.rating = { $in: req.body.rating };
  }

  if (req.body.City) {
    filters.city = { $in: req.body.City };
  }
  //console.log(filters);
  Restaurant.find(filters)
    .then((restaurants) => {
      res.render("shop/Specifictype-restaurants", {
        path: "/Specifictype-restaurants",
        pageTitle: "Restaurants",
        Rests: restaurants,
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.specificTypeRestaurants = (req, res, next) => {
  if (req.query.type === "Desi" || req.query.type === "Dessert") {
    return Restaurant.find({ cuisine: req.query.type })
      .then((rests) => {
        res.render("shop/Specifictype-restaurants", {
          path: "/Specifictype-restaurants",
          Rests: rests,
          pageTitle: req.query.type + " Restaurants",
          isUserAuthenticated: req.session.UserisLoggedin,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  Restaurant.find({ restaurantType: req.query.type })
    .then((rests) => {
      res.render("shop/Specifictype-restaurants", {
        path: "/Specifictype-restaurants",
        Rests: rests,
        pageTitle: req.query.type + " Restaurants",
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.specificRestaurant = (req, res, next) => {
  let locationId;
  let LocationDetails = [];
  Restaurant.findById(req.params.restaurantId)
    .then((restaurant) => {
      const url = `https://api.content.tripadvisor.com/api/v1/location/search?key=${process.env.TRIP_ADVISOR_KEY}&searchQuery=${restaurant.name}&category=restaurant&address=${restaurant.city}&language=en`;

      const options = {
        method: "GET",
        headers: { accept: "application/json" },
      };

      fetch(url, options)
        .then((res) => res.json())
        .then((json) => {
          if (json.data.length === 0) {
            return res.render("shop/specific-restaurant", {
              path: "/specific-restaurant",
              pageTitle: "Restaurant",
              rest: restaurant,
              isUserAuthenticated: req.session.UserisLoggedin,
              Ld: null,
              mapboxToken: process.env.MAPBOX_TOKEN,
            });
          }
          locationId = json.data[0].location_id;
          const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=en&currency=USD&key=${process.env.TRIP_ADVISOR_KEY}`;
          const options = {
            method: "GET",
            headers: { accept: "application/json" },
          };
          fetch(url, options)
            .then((res) => res.json())
            .then((json) => {
              LocationDetails.imageUrl = json.rating_image_url;
              LocationDetails.numReviews = json.num_reviews + " Reviews";
              LocationDetails.website = json.website;
            })
            .then(() => {
              res.render("shop/specific-restaurant", {
                path: "/specific-restaurant",
                pageTitle: "Restaurant",
                rest: restaurant,
                isUserAuthenticated: req.session.UserisLoggedin,
                Ld: LocationDetails,
                mapboxToken: process.env.MAPBOX_TOKEN,
              });
            });
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getRestaurants = (req, res, next) => {
  Restaurant.find()
    .then((rests) => {
      res.render("shop/restaurants", {
        path: "/things-to-do-retaurant",
        pageTitle: "HomePage",
        Restaurants: rests,
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.check = (req, res, next) => {
  organizer
    .find()
    .then((org) => {
      res.render("shop/checker", {
        check: org,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getPartners = (req, res, next) => {
  let TotalArtists;
  const page = +req.query.page || 1;
  organizer
    .find()
    .countDocuments()
    .then((numArts) => {
      TotalArtists = numArts;
      return organizer
        .find({ $or: [{ isVerified: true }, { isVerified: null }] })
        .skip((page - 1) * ARTISTS_PER_PAGE)
        .limit(ARTISTS_PER_PAGE);
    })

    .then((artist) => {
      res.render("shop/partners", {
        partners: artist,
        pageTitle: "Partners",
        path: "/Partners",
        currentPage: page,
        hasNextPage: ARTISTS_PER_PAGE * page < TotalArtists,
        hasPreviousPage: page > 1,
        nextPage: Number(page) + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(TotalArtists / ARTISTS_PER_PAGE),
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCity = (req, res, next) => {
  const city = req.query.city;
  const today = Date.now();
  Event.find({ city: city, startDate: { $gt: today }, isApproved: true })
    .limit(9)
    .sort({ startDate: -1 })
    .then((events) => {
      res.render("shop/city", {
        path: "/City",
        pageTitle: city,
        City: city,
        Events: events,
        helper: helper,
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.addEvent = (req, res, next) => {
  res.render("organizer/add-event", {
    path: "/add-event",
  });
};

exports.postaddEvent = (req, res, next) => {
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

  const event = new Event({
    name: name,
    description: description,
    eventType: category,
    imageUrl: imageData[0].path,
    address: address,
    city: city,
    startDate: startDate,
    endDate: endDate,
    eventTime: time,
    featured: false,
    ticketed: tickited,
    tickets: Tickets,
    OrganizerId: req.session.Organizer._id,
  });

  event
    .save()
    .then((resu) => {
      console.log(resu);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });

  // Event.updateMany({}, { $unset: { Price: 1 } })
  //   .then((response) => {
  //     console.log(req.body);
  //     res.redirect("/");
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
  // res.redirect("/");

  // let price = req.body.standard;
  // price = Number(price.length === 0 ? "0" : price);
};

exports.getEvents = (req, res, next) => {
  const city = req.query.city;
  Event.find({ city: city })
    .sort({ startDate: -1 })
    .then((rests) => {
      res.render("shop/view-events", {
        path: "/view-events",
        pageTitle: "HomePage",
        Events: rests,
        isUserAuthenticated: req.session.UserisLoggedin,
        helper: helper,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.filterEvents = (req, res, next) => {
  const currentDate = new Date();
  let endDate;
  const city = req.query.city;

  const filters = {};
  filters.city = city;
  if (req.body.Interest) {
    filters.eventType = [];
    if (req.body.Interest.includes("Others")) {
      filters.eventType = [
        "Food",
        "Exhibition & Workshops",
        "Technology",
        "Seminars,Conferences & Community",
        "Fashion & LifeStyle",
      ];
    }
    if (typeof req.body.Interest === "string") {
      filters.eventType.push(req.body.Interest);
    } else {
      const result = req.body.Interest.filter((word) => word !== "Others");
      for (r of result) {
        filters.eventType.push(r);
      }
    }
  }

  if (req.body.type) {
    filters.ticketed = req.body.type === "ticket" ? true : false;
  }

  if (req.body.Date) {
    let dateRange = req.body.Date;
    //console.log(req.body.Date);
    if (dateRange === "3-days") {
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 3);
      filters.startDate = { $gte: currentDate, $lt: endDate };
    } else if (dateRange === "week") {
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 7);
      filters.startDate = { $gte: currentDate, $lt: endDate };
    } else if (dateRange === "30 days") {
      endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 30);
      filters.startDate = { $gte: currentDate, $lt: endDate };
    } else {
      endDate = null;
    }
  }

  if (req.body.Date) {
    Event.find(filters).then((result) => {
      res.render("shop/view-events", {
        path: "/home",
        pageTitle: "HomePage",
        Events: result,
        isUserAuthenticated: req.session.UserisLoggedin,
        helper: helper,
      });
    });
  } else {
    Event.find(filters).then((result) => {
      res.render("shop/view-events", {
        path: "/home",
        pageTitle: "HomePage",
        Events: result,
        isUserAuthenticated: req.session.UserisLoggedin,
        helper: helper,
      });
    });
  }
};

exports.getEventInfo = (req, res, next) => {
  const event = req.params.eventId;
  console.log(event);
  Event.findById(event)
    .populate("OrganizerId")
    .then((rests) => {
      res.render("shop/event-info", {
        path: "/home",
        pageTitle: "EventInfo",
        Event: rests,
        isUserAuthenticated: req.session.UserisLoggedin,
        helper: helper,
        number: rests.OrganizerId.number || "+923274791154",
        mapboxToken: process.env.MAPBOX_TOKEN,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.searchRestaurant = (req, res, next) => {
  const value = req.body.result;
  const city = req.body.where === "all" ? null : req.body.where;
  if (city) {
    Restaurant.find({ name: { $regex: value, $options: "i" }, city: city })
      .then((result) => {
        res.render("shop/Specifictype-restaurants", {
          isUserAuthenticated: req.session.UserisLoggedin,
          Rests: result,
          path: "/Specifictype-restaurants",
          pageTitle: "Restaurants",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Restaurant.find({ name: { $regex: value, $options: "i" } })
      .then((result) => {
        console.log(result);
        res.render("shop/Specifictype-restaurants", {
          isUserAuthenticated: req.session.UserisLoggedin,
          Rests: result,
          path: "/Specifictype-restaurants",
          pageTitle: "Restaurants",
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // res.redirect("/");
};

exports.getExperiences = (req, res, next) => {
  let heritageAndCulture = [];
  let shopping = [];
  let sports = [];
  let recreation = [];
  const getLatestEvents = () => {
    return Experience.aggregate([
      // Group events by category
      {
        $group: {
          _id: "$category",
          category: { $push: "$$ROOT" },
        },
      },
      // Add your own categories
      {
        $facet: {
          heritageAndCulture: [
            { $match: { _id: "Heritage & Culture" } },
            { $project: { experiences: { $slice: ["$category", 4] } } },
            { $unwind: "$experiences" },
            { $replaceRoot: { newRoot: "$experiences" } },
          ],
          shopping: [
            { $match: { _id: "Shopping" } },
            { $project: { experiences: { $slice: ["$category", 4] } } },
            { $unwind: "$experiences" },
            { $replaceRoot: { newRoot: "$experiences" } },
          ],
          sports: [
            { $match: { _id: "Sports" } },
            { $project: { experiences: { $slice: ["$category", 4] } } },
            { $unwind: "$experiences" },
            { $replaceRoot: { newRoot: "$experiences" } },
          ],
          recreation: [
            { $match: { _id: "Recreation" } },
            { $project: { experiences: { $slice: ["$category", 4] } } },
            { $unwind: "$experiences" },
            { $replaceRoot: { newRoot: "$experiences" } },
          ],
        },
      },
      // Combine results from all categories
      {
        $project: {
          experiences: {
            $concatArrays: [
              "$heritageAndCulture",
              "$shopping",
              "$sports",
              "$recreation",
            ],
          },
        },
      },
      { $unwind: "$experiences" }, // Unwind the array to get individual events
      { $replaceRoot: { newRoot: "$experiences" } }, // Replace the root with the events
      { $limit: 16 }, // Limit the total number of events to 16
    ]).exec(); // Use exec() to return a promise
  };

  getLatestEvents()
    .then((results) => {
      for (let result of results) {
        if (result.category === "Sports") {
          sports.push(result);
        } else if (result.category === "Recreation") {
          recreation.push(result);
        } else if (result.category === "Shopping") {
          shopping.push(result);
        } else {
          heritageAndCulture.push(result);
        }
      }

      res.render("shop/experiences", {
        isUserAuthenticated: req.session.UserisLoggedin,
        path: "/things-to-do-experience",
        pageTitle: "HomePage",
        Shopping: shopping,
        heritageAndCulture: heritageAndCulture,
        sports: sports,
        recreation: recreation,
      });
    })
    .catch((error) => {
      console.error(error);
    });
};

exports.getTicketDetails = (req, res, next) => {
  console.log(req.params.eventId);
  Event.findById(req.params.eventId)
    .populate("OrganizerId")
    .then((event) => {
      res.render("shop/ticket-detail", {
        path: "/ticket-info",
        pageTitle: "HomePage",
        Event: event,
        helper: helper,
        number: event.OrganizerId.number || "+923274791154",
        isUserAuthenticated: req.session.UserisLoggedin,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getTicketContact = (req, res, next) => {
  const ticketObject = req.body;
  const filteredTickets = [];

  for (let i = 1; i <= Object.keys(ticketObject).length / 3; i++) {
    const ticketName = ticketObject[`ticket-name-${i}`];
    const ticketPrice = parseInt(ticketObject[`ticket-price-${i}`]);
    const ticketQuantity = parseInt(ticketObject[`ticket-quantity-${i}`]);
    const PricePerTicket = parseInt(ticketObject[`actual-ticket-price-${i}`]);

    if (ticketQuantity >= 1) {
      filteredTickets.push({
        name: ticketName,
        price: ticketPrice,
        quantity: ticketQuantity,
        ap: PricePerTicket,
      });
    }
  }
  User.findById(req.session.user._id)
    .then((User) => {
      User.Cart = { Event: [] };
      for (let tickets of filteredTickets) {
        User.Cart.Event.push({
          price: tickets.price,
          ticketName: tickets.name,
          quantity: tickets.quantity,
          pricePerTicket: tickets.ap,
        });
        User.Cart.EventId = req.params.eventId;
      }
      return User.save().then(() => {
        req.session.user = User;
      });
    })
    .then((result) => {
      res.render("shop/ticket-contact", {
        path: "/ticket-info",
        pageTitle: "HomePage",
        helper: helper,
        User: req.session.user,
        EventId: req.params.eventId,
        isUserAuthenticated: req.session.user,
      });
    });

  // Event.findById(req.params.eventId)
  //   .populate("OrganizerId")
  //   .then((event) => {
  //     res.render("shop/ticket-detail", {
  //       path: "/ticket-info",
  //       pageTitle: "HomePage",
  //       Event: event,
  //       helper: helper,
  //       number: event.OrganizerId.number || "+923274791154",
  //     });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //   });
};

exports.getTicketPayment = async (req, res, next) => {
  console.log("The params are: ", req.params.eventId);
  if (!req.session.user?.number) {
    const user = await User.findByIdAndUpdate(req.session.user._id, {
      number: req.body.phone,
    });
    await user.save();
    req.session.user = user;
    await req.session.save();
  }
  let Total = 0;
  let eventName;
  for (Price of req.session.user.Cart.Event) {
    Total = Total + Price.price;
  }
  let products;
  let image;

  products = req.session.user.Cart.Event;

  Event.findById(req.params.eventId)
    .then((Event) => {
      eventName = Event.name;
      image: Event.imageUrl;
    })
    .then(() => {
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        // invoice_creation: {
        //   enabled: true,
        // },
        line_items: products.map((p) => {
          return {
            quantity: p.quantity,
            price_data: {
              currency: "pkr",
              unit_amount: p.pricePerTicket * 100,
              product_data: {
                name: p.ticketName,
                description: eventName,
              },
            },
          };
        }),
        payment_intent_data: {
          description: eventName, // Add your custom heading
        },
        customer_email: req.session.user.email,

        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/ticket-payment", {
        path: "/ticket-info",
        pageTitle: "HomePage",
        helper: helper,
        User: req.session.user,
        totalPrice: Total,
        sessionId: session.id,
        isUserAuthenticated: req.session.user,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCheckOutSuccess = async (req, res, next) => {
  // console.log(req.session.user);

  const userTicket = {
    Event: null,
    ticketType: [],
    totalPrice: 0,
  };

  const user = await User.findById(req.session.user._id);

  userTicket.Event = req.session.user.Cart.EventId;

  const cartCustomer = {
    ticketName: [],
    ticketQuantity: [],
  };
  let totalBill = 0;
  for (let total of req.session.user.Cart.Event) {
    totalBill += totalBill + total.price;
    userTicket.ticketType.push({
      quantity: total.quantity,
      price: total.price,
      ticketName: total.ticketName,
    });
  }
  for (let Ticket of req.session.user.Cart.Event) {
    cartCustomer.ticketName.push(Ticket.ticketName);
    cartCustomer.ticketQuantity.push(Ticket.quantity);
  }

  // user.console.log(userTicket);

  user.Tickets.push(userTicket);

  const ticketId = generateTicketID();
  await user.save();

  const Ticket = new ticket({
    customerEmail: req.session.user.email,
    customerName: req.session.user.name,
    customerNumber: req.session.user.number,
    customerTotalBill: totalBill,
    eventId: req.session.user.Cart.EventId,
    customerCart: cartCustomer,
    ticketNumber: ticketId,
  });

  Ticket.save()
    .then((result) => {
      console.log("Order Saved!");
      res.render("shop/checkout-success");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.launchChatbot = (req, res, next) => {
  let question = req.body.question;
  question = question.toLowerCase(); // Assuming the question is sent in the request body
  const response = helper.generateResponse(question);
  if (response.lin) {
    let website = response.lin;
    let text = response.text;
    res.json({ text, website });
  } else {
    res.json({ response });
  }
};

exports.blogs = async (req, res, next) => {
  try {
    const blogs = await Blog.find();

    res.render("shop/blogs", {
      isUserAuthenticated: req.session.UserisLoggedin,
      Blogs: blogs,
      path: "/Blogs",
      pageTitle: "Blogs",
    });
  } catch (err) {
    console.log(err);
  }
};
exports.readMoreBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    res.render("shop/blog-details", {
      isUserAuthenticated: req.session.UserisLoggedin,
      Blog: blog,
      path: "/Blogs",
      pageTitle: "Blogs",
      helper: helper,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.Suggestions = (req, res, next) => {
  res.render("shop/suggestions", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "Suggestions",
    path: "/suggestions",
  });
};

exports.postSuggestions = async (req, res, next) => {
  // console.log(req.body);
  try {
    const suggestions = new Suggestions({
      name: req.body.fname + " " + req.body.lname,
      email: req.body.email,
      phoneNumber: req.body.phone,
      message: req.body.description,
      type: "Suggestion",
      messageType: req.body.topic,
    });

    await suggestions.save();
    console.log(suggestions, "Saved!");
    res.render("shop/feedback-success", {
      path: "Suggestions",
      isUserAuthenticated: req.session.UserisLoggedin,
    });
  } catch (err) {
    console.log(err);
  }

  // res.render("shop/suggestions", {
  //   isUserAuthenticated: req.session.UserisLoggedin,
  //   pageTitle: "Suggestions",
  //   path: "/suggestions",
  // });
};

exports.complaints = (req, res, next) => {
  res.render("shop/complaints", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "Complaints",
    path: "/complaints",
  });
};
exports.postComplaint = async (req, res, next) => {
  // console.log(req.body);
  try {
    const suggestions = new Suggestions({
      name: req.body.fname + " " + req.body.lname,
      email: req.body.email,
      phoneNumber: req.body.phone,
      message: req.body.description,
      type: "Complaint",
      messageType: req.body.topic,
    });

    await suggestions.save();
    console.log(suggestions, "Saved!");
    res.render("shop/feedback-success", {
      path: "Suggestions",
      isUserAuthenticated: req.session.UserisLoggedin,
    });
  } catch (err) {
    console.log(err);
  }

  // res.render("shop/suggestions", {
  //   isUserAuthenticated: req.session.UserisLoggedin,
  //   pageTitle: "Suggestions",
  //   path: "/suggestions",
  // });
};

exports.postContact = async (req, res, next) => {
  // console.log(req.body);
  try {
    const suggestions = new Suggestions({
      name: req.body.fname + " " + req.body.lname,
      email: req.body.email,
      phoneNumber: req.body.phone,
      message: req.body.description,
      type: "Contact",
      messageType: "contact us",
    });

    await suggestions.save();
    console.log(suggestions, "Saved!");
    res.render("shop/feedback-success", {
      path: "Suggestions",
      isUserAuthenticated: req.session.UserisLoggedin,
    });
  } catch (err) {
    console.log(err);
  }

  // res.render("shop/suggestions", {
  //   isUserAuthenticated: req.session.UserisLoggedin,
  //   pageTitle: "Suggestions",
  //   path: "/suggestions",
  // });
};

exports.faqs = (req, res) => {
  res.render("shop/faqs", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "FAQs",
    path: "/faqs",
  });
};

exports.privacypolicy = (req, res) => {
  res.render("shop/privacy-policy", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "Privacy Policy",
    path: "/privacy-policy",
  });
};

exports.aboutUs = (req, res) => {
  res.render("shop/aboutUs", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "About Us",
    path: "/aboutUs",
  });
};

exports.contactUs = (req, res) => {
  res.render("shop/contactUs", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "Contact Us",
    path: "/contact-us",
  });
};

exports.cookiepolicy = (req, res) => {
  res.render("shop/cookie-policy", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "Cookie Policy",
    path: "/cookie-policy",
  });
};

exports.termcondition = (req, res) => {
  res.render("shop/term-conditions", {
    isUserAuthenticated: req.session.UserisLoggedin,
    pageTitle: "Term-Conditions",
    path: "/term-conditions",
  });
};

exports.viewAllCategoryExperiences = async (req, res) => {
  try {
    req.query.type =
      req.query.type === "Heritage " ? "Heritage & Culture" : req.query.type;
    console.log(req.query.type);
    const experiences = await Experience.find({ category: req.query.type });
    res.render("shop/category-experiences", {
      path: "/things-to-to-experience",
      isUserAuthenticated: req.session.user,
      experiences: experiences,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.viewSingleExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.experienceId);
    res.render("shop/single-experience", {
      path: "/things-to-to-experience",
      isUserAuthenticated: req.session.user,
      experience: experience,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.searchedExperiences = async (req, res) => {
  const city = req.body.where[0];
  const category = req.body.where[1];
  console.log(req.body);

  if (city === "all" && category === "all") {
    const experience = await Experiences.find({});
    res.render("shop/category-experiences", {
      path: "/things-to-to-experience",
      isUserAuthenticated: req.session.user,
      experiences: experience,
    });
  } else if (city === "all") {
    const experience = await Experiences.find({ category: category });
    res.render("shop/category-experiences", {
      path: "/things-to-to-experience",
      isUserAuthenticated: req.session.user,
      experiences: experience,
    });
  } else if (category === "all") {
    const experience = await Experiences.find({ city: city });
    res.render("shop/category-experiences", {
      path: "/things-to-to-experience",
      isUserAuthenticated: req.session.user,
      experiences: experience,
    });
  } else {
    const experience = await Experiences.find({
      city: city,
      category: category,
    });
    res.render("shop/category-experiences", {
      path: "/things-to-to-experience",
      isUserAuthenticated: req.session.user,
      experiences: experience,
    });
  }
};

exports.addToWishlist = async (req, res) => {
  console.log(req.body);
  if (!req.session.UserisLoggedin) {
    return res.json({ message: "failed", status: 500 });
  } else {
    const User = await Users.findById(req.session.user);
    const filter = User.wishlist.filter((item) => {
      if (item.item.toString() === req.body.eventId) {
        return item;
      }
    });

    if (filter.length > 0) {
      const uniqueArray = User.wishlist.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.item.toString() === item.item.toString())
      );
      User.wishlist = uniqueArray;
      await User.save();
      return res.json({ message: "delete", status: 200 });
    }
    const result = { type: req.body.type, item: req.body.eventId };
    User.wishlist.push(result);
    await User.save();
    return res.json({ message: "ok", status: 200 });
  }
};
