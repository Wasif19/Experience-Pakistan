const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },

  eventTime: {
    type: String,
    required: true,
  },

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
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

  ticketed: {
    type: Boolean,
    required: true,
  },

  tickets: [
    {
      _id: false,
      Name: { type: String },
      price: { type: Number },
    },
  ],
  OrganizerId: {
    type: Schema.Types.ObjectId,
    ref: "Organizer",
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Event", eventsSchema);
