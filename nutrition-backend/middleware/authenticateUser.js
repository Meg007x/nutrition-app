const User = require("../models/User");
const { hashSessionToken } = require("../utils/authSession");

const authenticateUser = async (req, res, next) => {
  const authorization = req.get("Authorization") || "";
  const match = authorization.match(/^Bearer ([a-f0-9]{64})$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
    });
  }

  try {
    const user = await User.findOne({
      auth_token_hash: hashSessionToken(match[1]),
      auth_token_expires_at: { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถยืนยันตัวตนได้ในขณะนี้",
    });
  }
};

module.exports = authenticateUser;
