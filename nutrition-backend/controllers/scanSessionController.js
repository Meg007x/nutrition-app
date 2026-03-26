const ScanSession = require("../models/ScanSession");

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

exports.createScanSession = async (req, res) => {
  try {
    const {
      user_id,
      date,
      meal_type,
      food_id,
      food_name,
      food_name_en,
      source,
      selected_portion,
      nutrition,
      ingredients_from_master,
      extra_ingredients,
      image_uri,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "ไม่พบ user_id",
      });
    }

    if (!meal_type) {
      return res.status(400).json({
        success: false,
        error: "กรุณาเลือกมื้ออาหาร",
      });
    }

    if (!food_id || !food_name) {
      return res.status(400).json({
        success: false,
        error: "ข้อมูลอาหารไม่ครบ",
      });
    }

    if (
      !selected_portion ||
      !selected_portion.gram ||
      !selected_portion.base_gram
    ) {
      return res.status(400).json({
        success: false,
        error: "ข้อมูลปริมาณอาหารไม่ครบ",
      });
    }

    const logDate = date || getTodayString();

    const duplicateWindow = new Date(Date.now() - 30 * 1000);

    const existingRecentLog = await ScanSession.findOne({
      user_id,
      date: logDate,
      meal_type,
      food_id,
      "selected_portion.gram": Number(selected_portion.gram),
      created_at: { $gte: duplicateWindow },
    }).lean();

    if (existingRecentLog) {
      return res.status(409).json({
        success: false,
        error: "รายการนี้ถูกบันทึกไปแล้ว กรุณาอย่ากดบันทึกซ้ำ",
      });
    }

    const scanSession = await ScanSession.create({
      user_id,
      date: logDate,
      meal_type,
      food_id,
      food_name,
      food_name_en: food_name_en || "",
      source: source || "database",
      selected_portion: {
        mode: selected_portion.mode || "portion",
        multiplier: Number(selected_portion.multiplier || 1),
        gram: Number(selected_portion.gram),
        unit: selected_portion.unit || "plate",
        base_gram: Number(selected_portion.base_gram),
        display_text: selected_portion.display_text || "",
      },
      nutrition: {
        kcal: Number(nutrition?.kcal || 0),
        protein_g: Number(nutrition?.protein_g || 0),
        carb_g: Number(nutrition?.carb_g || 0),
        fat_g: Number(nutrition?.fat_g || 0),
        fiber_g: Number(nutrition?.fiber_g || 0),
        sodium_mg: Number(nutrition?.sodium_mg || 0),
      },
      ingredients_from_master: Array.isArray(ingredients_from_master)
        ? ingredients_from_master
        : [],
      extra_ingredients: Array.isArray(extra_ingredients)
        ? extra_ingredients
        : [],
      image_uri: image_uri || "",
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "บันทึก Scan Session สำเร็จ",
      data: scanSession,
    });
  } catch (error) {
    console.error("❌ createScanSession error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการบันทึก Scan Session",
    });
  }
};

exports.getScanSessionsByMeal = async (req, res) => {
  try {
    const { user_id, date, meal_type } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "ไม่พบ user_id",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "ไม่พบ date",
      });
    }

    if (!meal_type) {
      return res.status(400).json({
        success: false,
        error: "ไม่พบ meal_type",
      });
    }

    const items = await ScanSession.find({
      user_id: String(user_id).trim(),
      date: String(date).trim(),
      meal_type: String(meal_type).trim(),
    })
      .sort({ created_at: -1, _id: -1 })
      .lean();

    return res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("❌ getScanSessionsByMeal error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงรายการอาหารของมื้อนี้",
    });
  }
};

exports.getDailySummary = async (req, res) => {
  try {
    const { user_id } = req.params;
    const date = req.query.date || getTodayString();

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "ไม่พบ user_id",
      });
    }

    const logs = await ScanSession.find({ user_id, date }).lean();

    const summary = logs.reduce(
      (acc, item) => {
        acc.calories += Number(item?.nutrition?.kcal || 0);
        acc.protein += Number(item?.nutrition?.protein_g || 0);
        acc.carb += Number(item?.nutrition?.carb_g || 0);
        acc.fat += Number(item?.nutrition?.fat_g || 0);
        acc.fiber += Number(item?.nutrition?.fiber_g || 0);
        acc.sodium += Number(item?.nutrition?.sodium_mg || 0);
        return acc;
      },
      {
        calories: 0,
        protein: 0,
        carb: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
      }
    );

    return res.json({
      success: true,
      date,
      count: logs.length,
      summary,
      logs,
    });
  } catch (error) {
    console.error("❌ getDailySummary error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึงสรุปรายวัน",
    });
  }
};