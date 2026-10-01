const MealLog = require("../models/MealLog");
const ScanSession = require("../models/ScanSession");
const { updateStreak } = require("../utils/streakUpdater");
const User = require("../models/User");

// 🟢 ฟังก์ชันช่วยจัดการข้อมูลเดิมของระบบ
function buildMealKey(mealType) {
  const map = {
    เช้า: "breakfast",
    กลางวัน: "lunch",
    เย็น: "dinner",
    คํ่า: "dinner",
    ค่ำ: "dinner",
    ดึก: "late_night",
  };
  return map[String(mealType || "").trim()] || "meal";
}

function buildMealOrder(mealType) {
  const map = {
    เช้า: 1,
    กลางวัน: 2,
    เย็น: 3,
    คํ่า: 4,
    ค่ำ: 4,
    ดึก: 5,
  };
  return map[String(mealType || "").trim()] || 0;
}

function buildDisplayText(selected_portion = {}) {
  if (selected_portion.display_text) {
    return selected_portion.display_text;
  }

  const gram = Number(selected_portion.gram || 0);
  const unit = String(selected_portion.unit || "g");
  const multiplier = Number(selected_portion.multiplier || 1);

  if (unit === "plate") return `${multiplier} จาน (${gram} กรัม)`;
  if (unit === "bowl") return `${multiplier} ชาม (${gram} กรัม)`;
  if (unit === "cup") return `${multiplier} ถ้วย (${gram} กรัม)`;
  if (unit === "piece") return `${multiplier} ชิ้น (${gram} กรัม)`;

  return `${gram} ${unit}`;
}

// ==========================================================
// 🟢 [ฟังก์ชันที่เพิ่มเข้ามาใหม่]: บันทึกอาหารแบบตะกร้าจากหน้าแอป
// ==========================================================
exports.saveMealCart = async (req, res) => {
  try {
    const { user_id, date, meal_type, items } = req.body;

    // 1. ตรวจสอบข้อมูลขั้นต่ำที่ต้องใช้
    if (!user_id || !date || !meal_type) {
      return res.status(400).json({
        success: false,
        error: "ข้อมูลสำคัญไม่ครบถ้วน (ต้องการ user_id, date, meal_type)",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "ตะกร้าอาหารว่างเปล่า ไม่สามารถบันทึกมื้ออาหารได้",
      });
    }

    // 2. คำนวณสารอาหารรวมทั้งหมดในมื้อ (Totals) จากตะกร้าที่ส่งมา ป้องกันการคลาดเคลื่อน
    const totals = items.reduce(
      (acc, item) => {
        acc.kcal += Number(item?.nutrition?.kcal || 0);
        acc.protein_g += Number(item?.nutrition?.protein_g || 0);
        acc.fat_g += Number(item?.nutrition?.fat_g || 0);
        acc.carb_g += Number(item?.nutrition?.carb_g || 0);
        acc.fiber_g += Number(item?.nutrition?.fiber_g || 0);
        acc.sodium_mg += Number(item?.nutrition?.sodium_mg || 0);
        return acc;
      },
      { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, sodium_mg: 0 }
    );

    // ทำการแมปโครงสร้างของ items แต่ละตัวเพื่อให้มั่นใจว่าฟอร์แมต display_text ถูกต้องตามระบบของเพื่อนคุณ
    const formattedItems = items.map((item, index) => ({
      item_id: item.item_id || `item_${String(index + 1).padStart(3, "0")}`,
      scan_session_id: item.scan_session_id || "",
      source: item.source || "manual", // ถ้ามาจากตะกร้าตรงๆ ให้ค่าเริ่มต้นเป็น manual

      food_id: item.food_id || null,
      food_name: item.food_name || "",
      food_name_en: item.food_name_en || "",
      category: item.category || "",
      image_uri: item.image_uri || "",

      selected_portion: {
        display_text: buildDisplayText(item.selected_portion),
        gram: Number(item?.selected_portion?.gram || 0),
        unit: item?.selected_portion?.unit || "",
        multiplier: Number(item?.selected_portion?.multiplier || 1),
      },

      nutrition: {
        kcal: Number(item?.nutrition?.kcal || 0),
        protein_g: Number(item?.nutrition?.protein_g || 0),
        carb_g: Number(item?.nutrition?.carb_g || 0),
        fat_g: Number(item?.nutrition?.fat_g || 0),
        fiber_g: Number(item?.nutrition?.fiber_g || 0),
        sodium_mg: Number(item?.nutrition?.sodium_mg || 0),
      },

      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      extra_ingredients: Array.isArray(item.extra_ingredients) ? item.extra_ingredients : [],
      logged_at: item.logged_at || new Date(),
    }));

    // ดึงค่า meal_key และ ID เพื่อความสอดคล้องกับฟังก์ชันสแกนเดิม
    const meal_key = buildMealKey(meal_type);
    const meal_order = buildMealOrder(meal_type);
    const mealLogId = `meal_${user_id}_${date}_${meal_key}`;

    // รวบรวม session ID ทั้งหมดที่มีในรายการไอเทม
    const scanSessionIds = formattedItems
      .map((item) => String(item.scan_session_id || ""))
      .filter((id) => id !== "");

    // จัดเตรียม Payload โครงสร้างเดียวกับที่ใช้ในระบบของคุณ
    const payload = {
      _id: mealLogId,
      user_id,
      date,
      meal_type,
      meal_key,
      meal_order,
      source_plan_id: req.body.source_plan_id || null,
      is_from_daily_plan: req.body.is_from_daily_plan || false,
      daily_targets: req.body.daily_targets || { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 },
      meal_targets: req.body.meal_targets || { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, sodium_mg: 0 },
      totals,
      items: formattedItems,
      scan_session_ids: scanSessionIds,
      status: "completed",
      note: req.body.note || "",
      updated_at: new Date(),
    };

    // 3. ใช้ findOneAndUpdate (Upsert) เหมือนฟังก์ชันเดิม เพื่อป้องกันข้อมูลมื้อเดียวกันซ้ำซ้อน
    const mealLog = await MealLog.findOneAndUpdate(
      { _id: mealLogId },
      {
        $set: payload,
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    // 🔥 เรียกใช้งานฟังก์ชันอัปเดตไฟ/Streak ของเพื่อนคุณทันทีหลังจากเซฟตะกร้าอาหารสำเร็จ
    await updateStreak(user_id);

    return res.json({
      success: true,
      message: "บันทึกตะกร้าอาหารลงมื้อประวัติสำเร็จเรียบร้อย",
      data: mealLog,
    });
  } catch (error) {
    console.error("❌ saveMealCart error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการบันทึกตะกร้าอาหาร",
    });
  }
};

// ==========================================================
// 🟢 [ฟังก์ชันเดิมของเพื่อนคุณ]: รวมประวัติจากการบันทึกผลการสแกนกล้อง
// ==========================================================
exports.finalizeMealLog = async (req, res) => {
  try {
    const { user_id, date, meal_type } = req.body;

    if (!user_id) return res.status(400).json({ success: false, error: "ไม่พบ user_id" });
    if (!date) return res.status(400).json({ success: false, error: "ไม่พบ date" });
    if (!meal_type) return res.status(400).json({ success: false, error: "ไม่พบ meal_type" });

    const scanItems = await ScanSession.find({
      user_id: String(user_id).trim(),
      date: String(date).trim(),
      meal_type: String(meal_type).trim(),
    })
      .sort({ created_at: 1, _id: 1 })
      .lean();

    if (!scanItems.length) {
      return res.status(400).json({ success: false, error: "ยังไม่มีรายการอาหารในมื้อนี้" });
    }

    const meal_key = buildMealKey(meal_type);
    const meal_order = buildMealOrder(meal_type);
    const mealLogId = `meal_${user_id}_${date}_${meal_key}`;

    const items = scanItems.map((item, index) => ({
      item_id: `item_${String(index + 1).padStart(3, "0")}`,
      scan_session_id: String(item._id),
      source: item.source || "scan",
      food_id: item.food_id || null,
      food_name: item.food_name || "",
      food_name_en: item.food_name_en || "",
      category: item.category || "",
      image_uri: item.image_uri || "",
      selected_portion: {
        display_text: buildDisplayText(item.selected_portion),
        gram: Number(item?.selected_portion?.gram || 0),
        unit: item?.selected_portion?.unit || "",
        multiplier: Number(item?.selected_portion?.multiplier || 1),
      },
      nutrition: {
        kcal: Number(item?.nutrition?.kcal || 0),
        protein_g: Number(item?.nutrition?.protein_g || 0),
        carb_g: Number(item?.nutrition?.carb_g || 0),
        fat_g: Number(item?.nutrition?.fat_g || 0),
        fiber_g: Number(item?.nutrition?.fiber_g || 0),
        sodium_mg: Number(item?.nutrition?.sodium_mg || 0),
      },
      ingredients: Array.isArray(item.ingredients_from_master)
        ? item.ingredients_from_master.map((ing) => ({
            ingredient_id: ing.ingredient_id || "",
            name: ing.name || "",
            qty: Number(ing.qty || 0),
            unit: ing.unit || "",
          }))
        : [],
      extra_ingredients: Array.isArray(item.extra_ingredients)
        ? item.extra_ingredients.map((ing) => ({
            ingredient_id: ing.ingredient_id || "",
            name: ing.name || "",
            qty: Number(ing.qty || 0),
            unit: ing.unit || "",
          }))
        : [],
      logged_at: item.created_at || new Date(),
    }));

    const totals = items.reduce(
      (acc, item) => {
        acc.kcal += Number(item?.nutrition?.kcal || 0);
        acc.protein_g += Number(item?.nutrition?.protein_g || 0);
        acc.fat_g += Number(item?.nutrition?.fat_g || 0);
        acc.carb_g += Number(item?.nutrition?.carb_g || 0);
        acc.fiber_g += Number(item?.nutrition?.fiber_g || 0);
        acc.sodium_mg += Number(item?.nutrition?.sodium_mg || 0);
        return acc;
      },
      { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, sodium_mg: 0 }
    );

    const payload = {
      _id: mealLogId,
      user_id,
      date,
      meal_type,
      meal_key,
      meal_order,
      source_plan_id: null,
      is_from_daily_plan: false,
      daily_targets: { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 },
      meal_targets: { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0, fiber_g: 0, sodium_mg: 0 },
      totals,
      items,
      scan_session_ids: scanItems.map((item) => String(item._id)),
      status: "completed",
      note: "",
      updated_at: new Date(),
    };

    const mealLog = await MealLog.findOneAndUpdate(
      { _id: mealLogId },
      {
        $set: payload,
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true, new: true }
    );

    await updateStreak(user_id);

    return res.json({
      success: true,
      message: "บันทึก MealLog สำเร็จ",
      data: mealLog,
    });
  } catch (error) {
    console.error("❌ finalizeMealLog error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการบันทึก MealLog",
    });
  }
};

exports.getCartContext = async (req, res) => {
  try {
    const { user_id, date, current_time } = req.query; // current_time ส่งมาเป็น "12:45"

    if (!user_id || !date) {
      return res.status(400).json({ success: false, error: "Missing user_id or date" });
    }

    // 1. ไปดึงตารางเวลาอาหารจากโปรไฟล์ผู้ใช้
    const user = await User.findOne({ user_id: String(user_id) }).lean();
    if (!user || !user.meal_settings || !user.meal_settings.schedules) {
      return res.status(404).json({ success: false, error: "ไม่พบข้อมูลการตั้งค่ามื้ออาหาร" });
    }
    const schedules = user.meal_settings.schedules; // เช่น [{name: "กลางวัน", time: "12:30"}, {name: "เย็น", time: "18:30"}]

    // 2. ไปเช็คว่า "วันนี้" บันทึกมื้อไหนไปแล้วบ้าง
    const todayLogs = await MealLog.find({ user_id: String(user_id), date: String(date) }).lean();
    const loggedMealTypes = todayLogs.map(log => log.meal_type); 

    // 3. กรองเอามื้อที่ "ยังไม่ได้บันทึก" (ตัดมื้อที่กินไปแล้วทิ้ง หน้าบ้านจะได้กดไม่ได้)
    const availableMeals = schedules.filter(s => !loggedMealTypes.includes(s.name));

    // 4. คำนวณหา "มื้อตั้งต้น (Default)" โดยเทียบกับเวลาปัจจุบัน
    // ลอจิก: หามื้อที่เวลายังไม่เกิน หรือเพิ่งเลยมาสดๆ ร้อนๆ
    let defaultMealName = availableMeals.length > 0 ? availableMeals[0].name : "มื้ออาหาร";
    
    if (current_time) {
      let matchedMeal = null;
      for (let meal of availableMeals) {
        // ถ้าเวลาปัจจุบัน มากกว่าหรือเท่ากับ เวลาที่ตั้งไว้ ให้ถือว่าเป็นมื้อนั้น
        if (current_time >= meal.time) {
          matchedMeal = meal.name;
        }
      }
      if (matchedMeal) {
        defaultMealName = matchedMeal;
      }
    }

    // 5. ส่งผลลัพธ์กลับไปให้หน้าบ้านแบบสำเร็จรูป
    return res.json({
      success: true,
      data: {
        available_meals: availableMeals.map(m => m.name), // คืนค่าเป็น Array เช่น ["เช้า", "กลางวัน"]
        default_meal: defaultMealName // คืนค่ามื้อที่ควรเลือกให้เป็น Default เช่น "กลางวัน"
      }
    });

  } catch (error) {
    console.error("❌ getCartContext error:", error);
    return res.status(500).json({ success: false, error: "เกิดข้อผิดพลาดในการดึงบริบทตะกร้า" });
  }
};