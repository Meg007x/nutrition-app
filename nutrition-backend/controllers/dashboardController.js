const mongoose = require("mongoose");
const WaterLog = require("../models/WaterLog");

const getDashboardData = async (req, res) => {
  console.log("🔥 DASHBOARD CONTROLLER HIT - DYNAMIC UPDATED");

  try {
    const { userId } = req.params;

    if (!mongoose.connection || !mongoose.connection.db) {
      return res.status(500).json({
        message: "Dashboard Error",
        error: "MongoDB is not connected yet",
      });
    }

    const db = mongoose.connection.db;

    // 1. หาชื่อคอลเลกชันของ Users ตัวเล็กหรือตัวใหญ่
    const sampleUsersUpper = await db.collection("Users").findOne({});
    const sampleUsersLower = await db.collection("users").findOne({});
    const usersColName = sampleUsersUpper ? "Users" : sampleUsersLower ? "users" : "Users";

    const user = await db.collection(usersColName).findOne({
      $or: [{ username: userId }, { user_id: userId }, { email: userId }],
    });

    if (!user) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้",
      });
    }

    // --- หาวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD เพื่อใช้ค้นหาข้อมูลของวันนี้ ---
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    const day = `${now.getDate()}`.padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const currentUserId = user.user_id || user.username || userId;

    // 2. 💧 ดึงข้อมูลน้ำดื่มของวันนี้ (กำหนดตัวแปรดึงตรงจากคอลเลกชัน WaterLogs)
    const waterLog = await db.collection("WaterLogs").findOne({
      user_id: user.user_id,
      date: todayStr
    });
    const consumedWater = waterLog ? Number(waterLog.total_drank_ml || 0) : 0;
    const targetWater = waterLog ? Number(waterLog.target_ml || 2000) : (user?.health_goals?.water_target_ml || 2000);

    // 3. 🍳 ดึงข้อมูลอาหารที่บันทึก/สแกน ของวันนี้มาคำนวณแคลและสารอาหารหลักทั้งหมด
    const scanColName = (await db.listCollections({ name: "ScanSessions" }).hasNext()) ? "ScanSessions" : "scansessions";
    const todayScans = await db.collection(scanColName).find({
      user_id: currentUserId,
      date: todayStr
    }).toArray();

    let consumedKcal = 0;
    let proteinCurrent = 0;
    let carbCurrent = 0;
    let fatCurrent = 0;

    // วนลูปเพื่อรวมคะแนนสารอาหารของวันนี้จริง ๆ
    todayScans.forEach((item) => {
      consumedKcal += Number(item?.nutrition?.kcal || 0);
      proteinCurrent += Number(item?.nutrition?.protein_g || 0);
      carbCurrent += Number(item?.nutrition?.carb_g || 0);
      fatCurrent += Number(item?.nutrition?.fat_g || 0);
    });

    // คำนวณเป้าหมายสารอาหาร
    const targetKcal = user?.health_goals?.tdee_target_kcal || 0;
    const proteinTarget = user?.health_goals?.protein_target_g || 0;
    const percentage = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;

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

    // ส่งค่าที่คำนวณได้จริงทั้งหมดกลับไปที่หน้าบ้าน
    return res.json({
      userName: user?.username || "-",
      streakDays: user?.current_streak || 0, // 🔥 ดึงจาก current_streak จริงของ User แล้ว ไม่ล็อคเลข 1

      calories: {
        target: targetKcal,
        consumed: Math.round(consumedKcal), // 🔥 ดึงจากประวัติการกินจริงของวันนี้
        percentage,
      },

      macros: {
        protein: {
          current: Math.round(proteinCurrent), // 🔥 ดึงจริง
          target: proteinTarget,
        },
        carb: {
          current: Math.round(carbCurrent), // 🔥 ดึงจริง
          target: carbTarget,
        },
        fat: {
          current: Math.round(fatCurrent), // 🔥 ดึงจริง
          target: fatTarget,
        },
      },

      water: {
        current: consumedWater, // 🔥 ดึงจากประวัติน้ำดื่มของวันนี้จริง ๆ แล้ว
        target: targetWater,
      },

      nextMeal,
      // 🍽️ ส่งเวลาอาหารที่ผู้ใช้ตั้งค่าจริงไปให้หน้าบ้านตั้งแจ้งเตือน
      mealSchedules: user?.meal_settings?.schedules || [],

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