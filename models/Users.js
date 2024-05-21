const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  number: {
    type: String,
  },
  address: {
    type: String,
  },
  wishlist: [
    {
      _id: false,
      type: { type: String, enum: ["Restaurant", "Experience"] },
      item: { type: Schema.Types.ObjectId, refPath: "wishlist.type" },
    },
  ],

  imageUrl: {
    type: String,
  },

  interests: [
    {
      type: String,
    },
  ],

  Cart: {
    EventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    Event: [
      {
        quantity: { type: Number },
        ticketName: { type: String },
        price: { type: Number },
        pricePerTicket: { type: Number },
      },
    ],
  },
  Tickets: [
    {
      Event: {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
      ticketType: [
        {
          quantity: { type: Number },
          ticketName: { type: String },
          price: { type: Number },
        },
      ],
      totalPrice: { type: Number },
    },
  ],
  Reviews: [
    {
      EventId: { type: Schema.Types.ObjectId, ref: "Event" },
      description: { type: String, required: true },
      rating: { type: Number, required: true },
      _id: false,
    },
  ],

  password: {
    type: String,
  },
  resetToken: { type: String },
  resetTokenExpiration: Date,
  city: { type: String },
});

module.exports = mongoose.model("User", userSchema);
