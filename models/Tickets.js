const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ticketSchema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerNumber: {
    type: String,
    required: true,
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
  },
  customerCart: {
    ticketName: [{ type: String }],
    ticketQuantity: [{ type: Number }],
  },
  customerTotalBill: { type: Number, required: true },
});

module.exports = mongoose.model("Ticket", ticketSchema);
