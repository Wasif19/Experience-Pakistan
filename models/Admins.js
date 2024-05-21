const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminsSchema = new Schema({
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
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  adminType: {
    type: String,
    required: true,
    enum: ["Super-Admin", "Admin"],
  },
});

module.exports = mongoose.model("Admin", adminsSchema);
