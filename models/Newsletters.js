const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newsLettersSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Newsletter", newsLettersSchema);
