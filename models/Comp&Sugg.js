const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const compAndSuggSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  messageType: {
    type: "String",
    enum: [
      "ticket",
      "organizer",
      "event",
      "user profile",
      "customer service",
      "contact us",
    ],
    required: true,
  },
  type: {
    type: "String",
    required: true,
  },
});

module.exports = mongoose.model("compsAndSugg", compAndSuggSchema);
