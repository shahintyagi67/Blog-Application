const mongoose = require("mongoose");

const attachmentSchema = mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    parentType: {
      type: String,
      enum: ["user", "artical"],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Attachment = mongoose.model("Attachment", attachmentSchema);
module.exports = Attachment;
