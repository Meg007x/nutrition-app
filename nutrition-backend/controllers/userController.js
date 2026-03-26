const User = require("../models/User");

exports.getMealSettings = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({
      $or: [{ user_id: uid }, { email: uid }],
    }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบผู้ใช้",
      });
    }

    const schedules = Array.isArray(user?.meal_settings?.schedules)
      ? user.meal_settings.schedules
      : [];

    const mealOptions = schedules
      .filter((item) => item && item.notify !== false)
      .map((item) => item.name)
      .filter(Boolean);

    return res.json({
      success: true,
      mealOptions:
        mealOptions.length > 0
          ? mealOptions
          : ["เช้า", "กลางวัน", "เย็น"],
      mealSchedules: schedules,
      mealsPerDay: user?.meal_settings?.meals_per_day || mealOptions.length || 0,
    });
  } catch (error) {
    console.error("❌ getMealSettings error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึง meal settings",
    });
  }
};