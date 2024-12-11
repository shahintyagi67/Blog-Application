const express = require("express");
const router = express.Router();
const { userVerify } = require("../middlewares/auth");
const authController = require("../controllers/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

module.exports = upload;

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/fetchUser", userVerify, authController.fetchUsers);
router.post("/addDetails", userVerify, authController.addDetails);
router.put(
  "/updateUser",
  userVerify,
  upload.single("profileImage"),
  authController.updateUser
);
router.post("/forgot", authController.forgot);
router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;
