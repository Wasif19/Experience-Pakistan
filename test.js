const restaurants = require("./models/Restaurants");
const fetch = require("node-fetch");
const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://wasifshahid11:22nGPmMuQdVFl0MQ@cluster1.mkw6cpt.mongodb.net/ExperiencePakistan"
  )
  .then((result) => {
    console.log("Database Connected!");
  })
  .catch((err) => {
    console.log(err);
  });

async function addReviews() {
  try {
    const Restaurants = await restaurants.find({});
    for (let rest of Restaurants) {
      const url = `https://api.content.tripadvisor.com/api/v1/location/search?key=574C843212364CE1BA1268353F823768&searchQuery=${rest.name}&category=restaurant&address=${rest.city}&language=en`;

      const options = {
        method: "GET",
        headers: { accept: "application/json" },
      };

      const res = await fetch(url, options);
      const json = await res.json();

      if (json.data.length === 0) {
        rest.rating = Math.floor(Math.random() * 30 + 1);
        rest.ratingPicture = null;
      } else {
        let locationId = json.data[0].location_id;
        const url = `https://api.content.tripadvisor.com/api/v1/location/${locationId}/details?language=en&currency=USD&key=574C843212364CE1BA1268353F823768`;
        const options = {
          method: "GET",
          headers: { accept: "application/json" },
        };
        const resp = await fetch(url, options);

        const jsoon = await resp.json();

        rest.ratingPicture = jsoon.rating_image_url;
        rest.rating = jsoon.num_reviews;
      }

      await rest.save();
    }

    console.log(Restaurants);
  } catch (err) {
    console.log(err);
  }
}

addReviews();
