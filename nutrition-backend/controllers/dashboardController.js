const mongoose = require("mongoose");
const WaterLog = require("../models/WaterLog");
const User = require("../models/User");
const DailyPlan = require("../models/DailyPlan");
const ScanSession = require("../models/ScanSession");
const MealLog = require("../models/MealLog");
const { num } = require("../utils/nutritionCalculator");
const { getWaterTargetRange } = require("../utils/waterTargets");
const { calculateTargetCalories } = require("../utils/calorieTargets");
const { calculateMacroTargets } = require("../utils/macroTargets");

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

    const user = await User.findOne({
      $or: [{ username: userId }, { user_id: userId }, { email: userId }],
    }).lean();
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
      const waterLog = await WaterLog.findOne({ user_id: currentUserId, date: todayStr }).lean();
      console.log(`${LP} WaterLog:`, waterLog ? `found (drank=${waterLog.total_drank_ml}, target=${waterLog.target_ml})` : "null");
      consumedWater = waterLog ? Number(waterLog.total_drank_ml || 0) : 0;
      const targetRange = getWaterTargetRange(user?.weight_kg);
      const storedTarget = waterLog?.target_ml ||
        user?.water_target_ml ||
        user?.health_goals?.water_target_ml ||
        targetRange.minimum;
      targetWater = Math.min(
        targetRange.maximum,
        Math.max(targetRange.minimum, Number(storedTarget))
      );
    } catch (e) {
      console.error(`${LP} ⚠️ WaterLogs error:`, e.message);
    }

    // ดึง ScanSessions
    let todayScans = [];
    try {
      todayScans = await ScanSession.find({
        user_id: currentUserId,
        date: todayStr,
      }).lean();
      console.log(`${LP} Scans count:`, todayScans.length);
    } catch (e) {
      console.error(`${LP} ⚠️ ScanSessions error:`, e.message);
    }

    // ดึง MealLogs
    let todayMealLogs = [];
    try {
      todayMealLogs = await MealLog.find({ user_id: currentUserId, date: todayStr }).lean();
      console.log(`${LP} MealLogs count:`, todayMealLogs.length);
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

    // รวมสารอาหารจาก DailyPlan slots ที่ status === "eaten"
    // v2: ใช้ calculated_nutrition ก่อน, fallback เป็น nutrition_per_portion
    try {
      const todayPlans = await DailyPlan.find({ user_id: currentUserId, date: todayStr, plan_status: "active" }).lean();
      console.log(`${LP} DailyPlans count:`, todayPlans.length);
      todayPlans.forEach((dp) => {
        (dp.slots || []).forEach((slot) => {
          if (slot.status !== "eaten") return;
          // v2: calculated_nutrition (dynamic) → fallback nutrition_per_portion (static)
          const n = slot.calculated_nutrition || slot.main_food?.nutrition_per_portion || {};
          consumedKcal += num(n.kcal);
          proteinCurrent += num(n.protein_g);
          carbCurrent += num(n.carb_g);
          fatCurrent += num(n.fat_g);
          (slot.addons || []).forEach((addon) => {
            const an = addon?.calculated_nutrition || addon?.nutrition_per_portion || {};
            consumedKcal += num(an.kcal);
            proteinCurrent += num(an.protein_g);
            carbCurrent += num(an.carb_g);
            fatCurrent += num(an.fat_g);
          });
        });
      });
    } catch (e) {
      console.error(`${LP} ⚠️ DailyPlans nutrition error:`, e.message);
    }

    // คำนวณเป้าหมายสารอาหาร — v2: Single Source of Truth
    // 1. ใช้ user.health_goals.target_calories เป็นหลัก (stored targets)
    // 2. Fallback: daily_target จาก DailyPlan
    // 3. Last resort: calculate current targets with the shared macro formula.
    let targetKcal = 0;
    let proteinTarget = 0;
    let carbTarget = 0;
    let fatTarget = 0;

    // Source 1: Rebuild macros from stored calories and protein using the shared formula.
    const storedKcal = num(user?.health_goals?.target_calories);
    const storedProtein = num(user?.health_goals?.protein_target_g);
    if (storedKcal > 0 && storedProtein > 0) {
      const macros = calculateMacroTargets(storedKcal, storedProtein);
      if (macros.valid) {
        targetKcal = macros.target_calories;
        proteinTarget = macros.target_protein_g;
        carbTarget = macros.target_carb_g;
        fatTarget = macros.target_fat_g;
      }
    }
    // Source 2: Fallback to DailyPlan daily_target (legacy)
    if (targetKcal === 0) {
      const latestPlan = await DailyPlan.findOne({ user_id: currentUserId, date: todayStr, plan_status: "active" }).lean();
      if (latestPlan && latestPlan.daily_target) {
        targetKcal = num(latestPlan.daily_target.target_kcal);
        proteinTarget = num(latestPlan.daily_target.target_protein_g);
        carbTarget = num(latestPlan.daily_target.target_carb_g);
        fatTarget = num(latestPlan.daily_target.target_fat_g);
      }
    }
    // Source 3: Last resort — calculate targets with the shared macro formula.
    if (targetKcal === 0) {
      const tdee = num(user?.health_goals?.tdee_target_kcal);
      const calculatedCalories = calculateTargetCalories(
        tdee,
        user?.health_goals?.primary_goal
      );
      const macros = calculateMacroTargets(
        calculatedCalories,
        user?.health_goals?.protein_target_g
      );
      if (macros.valid) {
        targetKcal = macros.target_calories;
        proteinTarget = macros.target_protein_g;
        carbTarget = macros.target_carb_g;
        fatTarget = macros.target_fat_g;
      }
    }
    const percentage = targetKcal > 0 ? Math.round((consumedKcal / targetKcal) * 100) : 0;

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