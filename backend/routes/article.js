const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const articleController = require("../controllers/article");
const { userVerify } = require("../middlewares/auth");

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

router.post(
  "/articals",
  userVerify,
  upload.single("fileUrl"),
  articleController.createArticals
);
router.get("/getart", userVerify, articleController.fetchArticals);
router.get("/getart/:id", userVerify, articleController.fetchArticleById);
router.delete("/delete/:id", userVerify, articleController.deleteArticle);
router.put(
  "/update/:id",
  userVerify,
  upload.single("fileUrl"),
  articleController.updateArticle
);
module.exports = router;
