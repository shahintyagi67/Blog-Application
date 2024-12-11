const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Details = require("../models/details");
const { default: mongoose, mongo } = require("mongoose");
const Attachment = require("../models/attachment");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const sendMail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "c099a6aa534e53",
      pass: "0697ed51e288eb",
    },
  });
  const message = {
    from: '"shahin" <shahintyagi@gmail.com>',
    to: options.to,
    subject: "Sending email",
    text: "This is my new text",
    html: options.html,
  };
  await transporter.sendMail(message);
};

const forgot = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetURL = `http://localhost:3000/reset-password/${token}`;
    console.log("Reset Password URL:", resetURL);
    const message = `
        <h1>You have requested a password reset</h1>
        <p>Please go to this link to reset your password:</p>
        <a href="${resetURL}">${resetURL}</a> `;

    await sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });
    res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  const { name, email, address, gender, phone } = req.body;

  try {
    await User.findByIdAndUpdate(req.user.id, { name, email });

    await Details.findOneAndUpdate(
      { userId: req.user.id },
      { address, gender, phone },
      { new: true, upsert: true }
    );

    if (req.file) {
      const existingAttachment = await Attachment.findOne({
        parentId: req.user.id,
        parentType: "user",
      });

      if (existingAttachment) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "uploads",
          existingAttachment.fileUrl.split("/uploads/")[1]
        );
        fs.unlinkSync(oldImagePath);

        await Attachment.findByIdAndDelete(existingAttachment._id);
      }

      const newAttachment = new Attachment({
        parentId: req.user.id,
        parentType: "user",
        fileUrl: `/uploads/${req.file.filename}`,
      });
      await newAttachment.save();
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const addDetails = async (req, res) => {
  const { phone, address, gender } = req.body;
  try {
    const details = new Details({
      userId: req.user.id,
      phone,
      address,
      gender,
    });
    await details.save();
    res.status(200).json({
      success: true,
      message: "Details added successfully",
      data: details,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const fetchUsers = async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user.id) },
      },
      {
        $lookup: {
          from: "details",
          localField: "_id",
          foreignField: "userId",
          as: "details",
        },
      },
      {
        $lookup: {
          from: "attachments",
          localField: "_id",
          foreignField: "parentId",
          as: "attachments",
        },
      },
      {
        $addFields: {
          details: { $ifNull: [{ $arrayElemAt: ["$details", 0] }, {}] },
          profileImage: {
            $ifNull: [{ $arrayElemAt: ["$attachments.fileUrl", 0] }, null],
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "User fetched successfully with details",
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized User",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Password" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "60m" }
    );
    res.status(200).json({
      success: true,
      message: "Login Successfully",
      data: user,
      token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashPassword,
    });
    res.status(200).json({
      success: true,
      message: "Register User Successfully",
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  register,
  login,
  forgot,
  resetPassword,
  fetchUsers,
  addDetails,
  updateUser,
};
