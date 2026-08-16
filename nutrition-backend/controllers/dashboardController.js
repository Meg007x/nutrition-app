const mongoose = require("mongoose");
const WaterLog = require("../models/WaterLog");

const getDashboardData = async (req, res) => {
  const LP = "🔍 [DASHBOARD]";
  try {
    const { userId } = req.params;

    console.log(`${LP} ====== REQUEST START ======`);
    console.log(`${LP} Input userId:`, JSON.stringify(userId), `| type: ${typeof userId} | len: ${userId?.length}`);

    if (!userId || userId === "null" || userId === "undefined" || String(userId).trim() === "") {
      console.error(`${LP} ❌ INVALID userId`);
      return res.status(400).json({ message: "Dashboard Error", error: "userId is required" });
    }

    if (!mongoose.connection || !mongoose.connection.db) {
      console.error(`${LP} ❌ MongoDB not connected`);
      return res.status(500).json({ message: "Dashboard Error", error: "MongoDB is not connected yet" });
    }

    const db = mongoose.connection.db;
    console.log(`${LP} DB name:`, db.databaseName);

    // 🔧 FIX: ไม่ใช้ $in กับ listCollections เพราะ MongoDB driver บางเวอร์ชันไม่รองรับ
    // ให้ list ทั้งหมดแล้ว filter ด้วย JavaScript แทน
    const allCollections = await db.listCollections().toArray();
    const allColNames = allCollections.map(c => c.name);
    console.log(`${LP} All collections:`, allColNames);

    const usersColName = allColNames.includes("Users") ? "Users" : (allColNames.includes("users") ? "users" : "Users");
    console.log(`${LP} Using Users col:`, usersColName);

    const userFilter = { $or: [{ username: userId }, { user_id: userId }, { email: userId }] };
    console.log(`${LP} User filter:`, JSON.stringify(userFilter));

    const user = await db.collection(usersColName).findOne(userFilter);
    console.log(`${LP} User found:`, user ? `YES (user_id=${user.user_id}, username=${user.username})` : "NO");

    if (!user) {
      console.error(`${LP} ❌ User not found for:`, userId);
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentUserId = user.user_id || user.username || userId;
    console.log(`${LP} today:`, todayStr, `| currentUserId:`, JSON.stringify(currentUserId));

    // ดึงข้อมูลน้ำดื่ม
    let consumedWater = 0;
    let targetWater = 2000;
    try {
      const waterFilter = { user_id: currentUserId, date: todayStr };
      console.log(`${LP} WaterLogs filter:`, JSON.stringify(waterFilter));
      const waterLog = await db.collection("WaterLogs").findOne(waterFilter);
      console.log(`${LP} WaterLog:`, waterLog ? `found (drank=${waterLog.total_drank_ml}, target=${waterLog.target_ml})` : "null");
      consumedWater = waterLog ? Number(waterLog.total_drank_ml || 0) : 0;
      targetWater = waterLog ? Number(waterLog.target_ml || 2000) : (user?.health_goals?.water_target_ml || 2000);
    } catch (e) {
      console.error(`${LP} ⚠️ WaterLogs error:`, e.message);
    }

    // ดึง ScanSessions
    let todayScans = [];
    try {
      const scanColName = allColNames.includes("ScanSessions") ? "ScanSessions" : (allColNames.includes("scansessions") ? "scansessions" : null);
      console.log(`${LP} Scan col:`, scanColName);
      if (scanColName) {
        todayScans = await db.collection(scanColName).find({ user_id: currentUserId, date: todayStr }).toArray();
        console.log(`${LP} Scans count:`, todayScans.length);
      }
    } catch (e) {
      console.error(`${LP} ⚠️ ScanSessions error:`, e.message);
    }

    // ดึง MealLogs
    let todayMealLogs = [];
    try {
      const mealLogColName = allColNames.includes("MealLogs") ? "MealLogs" : (allColNames.includes("meallogs") ? "meallogs" : null);
      console.log(`${LP} MealLog col:`, mealLogColName);
      if (mealLogColName) {
        todayMealLogs = await db.collection(mealLogColName).find({ user_id: currentUserId, date: todayStr }).toArray();
        console.log(`${LP} MealLogs count:`, todayMealLogs.length);
      }
    } catch (e) {
      console.error(`${LP} ⚠️ MealLogs error:`, e.message);
    }

    let consumedKcal = 0;
    let proteinCurrent = 0;
    let carbCurrent = 0;
    let fatCurrent = 0;

    // วนลูปเพื่อรวมคะแนนสารอาหารจาก ScanSessions
    todayScans.forEach((item) => {
      consumedKcal += Number(item?.nutrition?.kcal || 0);
      proteinCurrent += Number(item?.nutrition?.protein_g || 0);
      carbCurrent += Number(item?.nutrition?.carb_g || 0);
      fatCurrent += Number(item?.nutrition?.fat_g || 0);
    });

    // วนลูปเพื่อรวมคะแนนสารอาหารจาก MealLogs (ตะกร้าอาหาร)
    todayMealLogs.forEach((mealLog) => {
      // ใช้ totals เป็นหลัก (ถ้ามี) เพราะ totals คือผลรวมของ items อยู่แล้ว
      // ถ้าไม่มี totals ค่อย sum จาก items
      if (mealLog.totals) {
        consumedKcal += Number(mealLog.totals?.kcal || 0);
        proteinCurrent += Number(mealLog.totals?.protein_g || 0);
        carbCurrent += Number(mealLog.totals?.carb_g || 0);
        fatCurrent += Number(mealLog.totals?.fat_g || 0);
      } else if (mealLog.items && Array.isArray(mealLog.items)) {
        mealLog.items.forEach((item) => {
          consumedKcal += Number(item?.nutrition?.kcal || 0);
          proteinCurrent += Number(item?.nutrition?.protein_g || 0);
          carbCurrent += Number(item?.nutrition?.carb_g || 0);
          fatCurrent += Number(item?.nutrition?.fat_g || 0);
        });
      }
    });

    // คำนวณเป้าหมายสารอาหาร
    const targetKcal = user?.health_goals?.tdee_target_kcal || 0;
    const proteinTarget = user?.health_goals?.protein_target_g || 0;
    const percentage = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;

    const carbTarget = targetKcal > 0 ? Math.round((targetKcal * 0.5) / 4) : 0;
    const fatTarget = targetKcal > 0 ? Math.round((targetKcal * 0.25) / 9) : 0;

    const mealSchedules = Array.isArray(user?.meal_settings?.schedules) ? user.meal_settings.schedules : [];
    console.log(`${LP} mealSchedules:`, mealSchedules.length, `| health_goals:`, JSON.stringify(user?.health_goals));

    // หา "มื้อต่อไป" ที่ใกล้ที่สุดที่ยังไม่ถึง โดยเทียบกับเวลาปัจจุบัน
    let nextMeal = null;
    if (mealSchedules.length > 0) {
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      // หามื้อที่เวลายังไม่เกิน (time >= current time)
      const upcomingMeals = mealSchedules
        .filter((m) => m.time && m.time >= currentHHMM)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

      const pick = upcomingMeals.length > 0 ? upcomingMeals[0] : mealSchedules[0];

      nextMeal = {
        time: pick?.time || "-",
        name: pick?.name || "-",
        kcal: 0,
        tag: upcomingMeals.length > 0 ? "มื้อถัดไป" : "มื้อแรกของวัน",
      };
    }

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
    console.error(`${LP} ❌ UNCAUGHT ERROR:`, error.message);
    console.error(`${LP} ❌ STACK:`, error.stack);
    return res.status(500).json({
      message: "Dashboard Error",
      error: error.message,
    });
  }
};

module.exports = { getDashboardData };