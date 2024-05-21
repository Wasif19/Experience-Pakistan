const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const organizersSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  organizationName: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  number: {
    type: String,
    required: true,
  },
  resetToken: { type: String },
  resetTokenExpiration: Date,
});

module.exports = mongoose.model("Organizer", organizersSchema);
