const mongoose = require("mongoose");

const getDashboardData = async (req, res) => {
  console.log("🔥 DASHBOARD CONTROLLER HIT");

  try {
    const { userId } = req.params;

    if (!mongoose.connection || !mongoose.connection.db) {
      return res.status(500).json({
        message: "Dashboard Error",
        error: "MongoDB is not connected yet",
      });
    }

    const db = mongoose.connection.db;

    const sampleUsersUpper = await db.collection("Users").findOne({});
    const sampleUsersLower = await db.collection("users").findOne({});
    const usersColName = sampleUsersUpper
      ? "Users"
      : sampleUsersLower
      ? "users"
      : "Users";

    const user = await db.collection(usersColName).findOne({
      $or: [{ username: userId }, { user_id: userId }, { email: userId }],
    });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้",
      });
    }

    const targetKcal = user?.health_goals?.tdee_target_kcal || 0;
    const proteinTarget = user?.health_goals?.protein_target_g || 0;

    const consumedKcal = 0;
    const percentage =
      targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;

    const carbTarget = targetKcal > 0 ? Math.round((targetKcal * 0.5) / 4) : 0;
    const fatTarget = targetKcal > 0 ? Math.round((targetKcal * 0.25) / 9) : 0;

    const mealSchedules = user?.meal_settings?.schedules || [];
    const nextMeal =
      mealSchedules.length > 0
        ? {
            time: mealSchedules[0]?.time || "-",
            name: mealSchedules[0]?.name || "-",
            kcal: 0,
            tag: "ตั้งค่าจากผู้ใช้",
          }
        : null;

    return res.json({
      userName: user?.username || "-",
      streakDays: 1,

      calories: {
        target: targetKcal,
        consumed: consumedKcal,
        percentage,
      },

      macros: {
        protein: {
          current: 0,
          target: proteinTarget,
        },
        carb: {
          current: 0,
          target: carbTarget,
        },
        fat: {
          current: 0,
          target: fatTarget,
        },
      },

      water: {
        current: 0,
        target: 2000,
      },

      nextMeal,

      recommendation: {
        title: "คำแนะนำวันนี้",
        message:
          user?.summary?.advice ||
          "เริ่มบันทึกมื้ออาหารเพื่อให้ระบบวิเคราะห์ได้แม่นยำขึ้น",
      },
    });
  } catch (error) {
    console.log("❌ Dashboard Error:", error);
    return res.status(500).json({
      message: "Dashboard Error",
      error: error.message,
    });
  }
};

module.exports = { getDashboardData };