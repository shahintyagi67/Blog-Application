const Artical = require("../models/artical");
const { default: mongoose } = require("mongoose");
const Attachment = require("../models/attachment");
const path = require("path");
const fs = require("fs");

const fetchArticals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let articals;

    if (userRole === "admin") {
      articals = await Artical.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        { $unwind: "$authorInfo" },
        {
          $lookup: {
            from: "attachments",
            localField: "_id",
            foreignField: "parentId",
            as: "attachments",
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            attachments: 1,
            "authorInfo.name": 1,
          },
        },
      ]);
    } else {
      articals = await Artical.aggregate([
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) },
        },
        {
          $lookup: {
            from: "attachments",
            let: { articalId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$parentId", "$$articalId"] },
                      { $eq: ["$parentType", "artical"] },
                    ],
                  },
                },
              },
            ],
            as: "attachments",
          },
        },
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Fetched Articles Successfully",
      data: articals,
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, author } = req.body;
    const fileUrl = req.file ? req.file.filename : null;

    const artical = await Artical.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    const attachment = await Attachment.findOne({
      parentId: artical._id,
      parentType: "artical",
    });

    if (fileUrl) {
      if (attachment && attachment.fileUrl) {
        const oldFilePath = path.join(
          __dirname,
          "../uploads",
          attachment.fileUrl
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        attachment.fileUrl = fileUrl;
        await attachment.save();
      } else {
        await Attachment.create({
          parentId: artical._id,
          parentType: "artical",
          fileUrl,
        });
      }
    }
    artical.title = title || artical.title;
    artical.content = content || artical.content;
    artical.author = author || artical.author;

    await artical.save();

    res.status(200).json({
      success: true,
      message: "Updated Successfully",
      data: artical,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server error ",
    });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const article = await Artical.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    const attachment = await Attachment.findOne({
      parentId: article._id,
      parentType: "artical",
    });

    if (attachment && attachment.fileUrl) {
      const filePath = path.join(__dirname, "../uploads", attachment.fileUrl);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        console.log("File does not exist.");
      }
      await Attachment.deleteOne({ _id: attachment._id });
    }
    await Artical.deleteOne({ _id: article._id });
    res.status(200).json({
      success: true,
      message: "Delete Succesfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const article = await Artical.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "attachments",
          let: { articalId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$parentId", "$$articalId"] },
                    { $eq: ["$parentType", "artical"] },
                  ],
                },
              },
            },
          ],
          as: "attachments",
        },
      },
      { $unwind: "$attachments" },
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched Article Successfully",
      data: article[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const createArticals = async (req, res) => {
  const userId = req.user.id;
  const { title, content } = req.body;
  const fileUrl = req.file ? req.file.filename : null;
  const status = "active";
  try {
    const articals = await Artical.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      content,
      status,
    });
    await Attachment.create({
      parentId: articals._id,
      parentType: "artical",
      fileUrl,
    });
    res.status(200).json({
      success: true,
      message: "Create Articals Successfully",
      data: articals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Invalid Server ",
    });
  }
};

module.exports = {
  createArticals,
  fetchArticals,
  fetchArticleById,
  deleteArticle,
  updateArticle,
};
