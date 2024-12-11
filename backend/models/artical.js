const mongoose = require("mongoose");

const articalSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);
const Articals = mongoose.model("Artical", articalSchema);
module.exports = Articals;
