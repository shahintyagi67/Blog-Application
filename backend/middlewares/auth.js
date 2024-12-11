const jwt = require("jsonwebtoken");

const userVerify = async (req, res, next) => {
  const token = req.header("authorization");
  if (!token) {
    res.status(401).json({
      success: true,
      message: "Unauthorized User",
    });
  }

  try {
    const bearerToken = token.split(" ")[1];
    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has Expired , Please login again",
      });
    }
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
module.exports = { userVerify };
