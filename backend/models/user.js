const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
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
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});
const User = mongoose.model("User", userSchema);
module.exports = User;
