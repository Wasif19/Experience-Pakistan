const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const contactUsSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  message: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
});

module.exports = mongoose.model("Contact", contactUsSchema);
