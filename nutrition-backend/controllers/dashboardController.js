const mongoose = require("mongoose");

// สมองส่วนที่ 1: จัดการข้อมูลหน้า Dashboard
const getDashboardData = async (req, res) => {
    console.log("🔥 DASHBOARD CONTROLLER HIT");
  try {
    const { userId } = req.params;

    // กันเคสยังไม่ได้ connect DB
    if (!mongoose.connection || !mongoose.connection.db) {
      return res.status(500).json({
        message: "Dashboard Error",
        error: "MongoDB is not connected yet",
      });
    }

    const db = mongoose.connection.db;

    // ✅ 1) LOG: ดูว่าเชื่อม DB ชื่ออะไรจริง
    console.log("👉 dashboard userId =", userId);
    console.log("👉 DB NAME =", db.databaseName);

    // ✅ 2) LOG: list collections ทั้งหมด
    const cols = await db.listCollections().toArray();
    console.log("👉 Collections =", cols.map((c) => c.name));

    // ✅ 3) LOG: sample document (เช็ค Users vs users)
    const sampleUsersUpper = await db.collection("Users").findOne({});
    const sampleUsersLower = await db.collection("users").findOne({});
    console.log("👉 Users sample =", sampleUsersUpper);
    console.log("👉 users sample =", sampleUsersLower);

    // ✅ เลือกชื่อ collection ที่มีข้อมูลจริง
    const usersColName = sampleUsersUpper ? "Users" : sampleUsersLower ? "users" : "Users";

    // ✅ ดึงข้อมูล user โดยรองรับทั้ง username และ user_id และ email
    const user = await db.collection(usersColName).findOne({
      $or: [{ username: userId }, { user_id: userId }, { email: userId }],
    });

    console.log("👉 user found =", user);

    // 2) Logic การคำนวณ (ตอนนี้ยัง mock ค่าบางอย่างไว้ก่อน)
    const targetKcal = user?.health_goals?.tdee || 1850;
    const consumedKcal = 900; // TODO: ค่อยดึงจาก MealLogs จริง
    const percentage = Math.round((consumedKcal / Math.max(1, targetKcal)) * 100);

    // 3) ส่งข้อมูลกลับ
    return res.json({
      userName: user?.username || "-", // ✅ ถ้าเจอจะขึ้น user01
      streakDays: 1,

      calories: {
        target: targetKcal,
        consumed: consumedKcal,
        percentage: percentage,
      },

      macros: {
        protein: { current: 80, target: 100 },
        carb: { current: 90, target: 200 },
        fat: { current: 36, target: 60 },
      },

      recommendation: {
        title: "คำแนะนำมื้อเย็น",
        message:
          "คาร์บของคุณใกล้เต็มแล้ว มื้อเย็นแนะนำให้เลี่ยงข้าวสวย และเน้นสเต็กปลาหรืออกไก่",
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