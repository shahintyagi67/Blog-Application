const mongoose = require("mongoose");

const detailSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
});
const Details = mongoose.model("Details", detailSchema);
module.exports = Details;
