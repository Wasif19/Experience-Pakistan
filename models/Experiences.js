const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const experiencesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  imageUrl: [
    {
      _id: false,
      type: String,
      required: true,
    },
  ],

  number: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
  },
  ratingPicture: {
    type: String,
  },
});

module.exports = mongoose.model("Experience", experiencesSchema);
