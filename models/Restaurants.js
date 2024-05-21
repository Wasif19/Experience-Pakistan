const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const restaurantsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  ratingPicture:
  {
    type: String
  },
  restaurantType: {
    type: String,
    required: true,
  },
  imageUrl: [
    {
      type: String,
    },
  ],
  PhoneNumber: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  cuisine: [{ type: String, required: true }],

  address: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Restaurant", restaurantsSchema);
