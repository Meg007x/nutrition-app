const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const MasterFood = require("../models/MasterFood");
const Ingredient = require("../models/Ingredient");

function escapeRegex(text) {
  const str = String(text || "");
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function detectDishFromImage(ai, imagePath, mimeType) {
  const imageBase64 = Buffer.from(fs.readFileSync(imagePath)).toString("base64");

  const prompt = `
ดูรูปอาหารนี้ และตอบกลับเป็น JSON เท่านั้น
ห้ามมีคำนำ ห้ามมีคำอธิบายเพิ่ม ห้ามใส่ markdown code block

รูปแบบ JSON:
{
  "dishName": "ชื่อเมนูภาษาไทย",
  "dishNameEn": "ชื่อเมนูภาษาอังกฤษ",
  "possibleKeywords": ["คำค้น 1", "คำค้น 2", "คำค้น 3"],
  "category": "main_dish"
}

ข้อกำหนด:
- ให้ตอบชื่ออาหารที่เป็นเมนูหลักที่สุด
- possibleKeywords ให้ใส่คำค้นที่น่าจะใช้ค้นในฐานข้อมูล
- ถ้าไม่แน่ใจ ให้ตอบเมนูที่ใกล้เคียงที่สุด
`;
 
  const response = await ai.models.generateContent({
    // เปลี่ยนจากชื่อเดิม (gemini-2.5-flash)
    model: "gemini-3.5-flash-lite",
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ],
  });

  const text = response.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("AI ไม่สามารถระบุชื่ออาหารได้");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error("ไม่สามารถแปลงผลลัพธ์จาก AI เป็น JSON ได้");
  }

  return {
    dishName: parsed.dishName || "",
    dishNameEn: parsed.dishNameEn || "",
    possibleKeywords: Array.isArray(parsed.possibleKeywords)
      ? parsed.possibleKeywords.filter(Boolean)
      : [],
    category: parsed.category || "",
  };
}

function isRateLimitError(error) {
  const statusText = String(
    error?.status || error?.statusCode || error?.response?.status || ""
  );
  const status = Number(statusText);
  const code = String(error?.code || error?.error?.status || "");
  const message = String(
    error?.message ||
      error?.error?.message ||
      error?.response?.data?.error?.message ||
      error ||
      ""
  );

  return (
    status === 429 ||
    /RESOURCE_EXHAUSTED|rate.?limit|quota|\b429\b/i.test(
      `${statusText} ${code} ${message}`
    )
  );
}

async function findFoodInDatabase(aiDetection) {
  const rawKeywords = [
    aiDetection.dishName,
    aiDetection.dishNameEn,
    ...(aiDetection.possibleKeywords || []),
  ].filter(Boolean);

  // 1) exact match name
  if (aiDetection.dishName) {
    const exactThai = await MasterFood.findOne({
      name: { $regex: `^${escapeRegex(aiDetection.dishName)}$`, $options: "i" },
    }).lean();

    if (exactThai) {
      return { food: exactThai, matchedBy: "name" };
    }
  }

  // 2) exact match name_en
  if (aiDetection.dishNameEn) {
    const exactEn = await MasterFood.findOne({
      name_en: {
        $regex: `^${escapeRegex(aiDetection.dishNameEn)}$`,
        $options: "i",
      },
    }).lean();

    if (exactEn) {
      return { food: exactEn, matchedBy: "name_en" };
    }
  }

  // 3) exact search_keywords
  if (rawKeywords.length > 0) {
    const keywordMatch = await MasterFood.findOne({
      search_keywords: { $in: rawKeywords },
    }).lean();

    if (keywordMatch) {
      return { food: keywordMatch, matchedBy: "search_keywords" };
    }
  }

  // 4) partial match
  for (const keyword of rawKeywords) {
    const partialMatch = await MasterFood.findOne({
      $or: [
        { name: { $regex: escapeRegex(keyword), $options: "i" } },
        { name_en: { $regex: escapeRegex(keyword), $options: "i" } },
        {
          search_keywords: {
            $elemMatch: { $regex: escapeRegex(keyword), $options: "i" },
          },
        },
      ],
    }).lean();

    if (partialMatch) {
      return { food: partialMatch, matchedBy: "partial_match" };
    }
  }

  return { food: null, matchedBy: null };
}

async function hydrateIngredients(foodIngredients = []) {
  const ids = foodIngredients
    .map((item) => item.ingredient_id)
    .filter(Boolean);

  if (ids.length === 0) {
    return [];
  }

  const docs = await Ingredient.find({ _id: { $in: ids } }).lean();
  const map = new Map(docs.map((doc) => [doc._id, doc]));

  return foodIngredients.map((item) => {
    const info = map.get(item.ingredient_id);

    return {
      ingredient_id: item.ingredient_id,
      name: info?.name || item.name_snap || item.ingredient_id,
      category: info?.category || "other",
      qty: item.qty || 0,
      unit: item.unit || "",
      weight_g: item.weight_g || 0,
      keywords: info?.keywords || [],
      // v2: เพิ่ม nutrition_per_100g จาก Ingredient
      nutrition_per_100g: info?.nutrition_per_100g || null,
    };
  });
}

exports.analyzeFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "กรุณาอัปโหลดรูปภาพ",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("ไม่พบ GEMINI_API_KEY ในไฟล์ .env");
    }
    const apiKeys = [
      apiKey,
      process.env.GEMINI_API_KEY_BACKUP?.trim(),
      process.env.GEMINI_API_KEY_BACKUP_2?.trim(),
    ].filter((key, index, keys) => key && keys.indexOf(key) === index);

    console.log("📸 วิเคราะห์รูป:", req.file.filename);

    // 1) AI ระบุชื่ออาหาร
    let aiDetection;
    for (let index = 0; index < apiKeys.length; index += 1) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeys[index] });
        aiDetection = await detectDishFromImage(
          ai,
          req.file.path,
          req.file.mimetype
        );
        break;
      } catch (error) {
        if (index === apiKeys.length - 1 || !isRateLimitError(error)) {
          throw error;
        }

        const providerLabel =
          index === 0 ? "Gemini API หลัก" : `Gemini API สำรองลำดับ ${index}`;
        console.warn(
          `⚠️ ${providerLabel} ติด rate limit; กำลังลองใช้ API key ถัดไป`
        );
      }
    }

    console.log("🤖 AI Detection:", aiDetection);

    // 2) ค้นในฐานข้อมูล MasterFood
    const { food, matchedBy } = await findFoodInDatabase(aiDetection);

    // ลบไฟล์ชั่วคราวหลังใช้งาน
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // 3) ถ้าไม่พบในฐานข้อมูล
    if (!food) {
      return res.status(404).json({
        success: false,
        source: "not_found",
        aiDetection,
        error: "AI ระบุชื่ออาหารได้ แต่ไม่พบเมนูนี้ในฐานข้อมูล",
      });
    }

    // 4) ดึงรายละเอียด ingredient จากคอลเลกชัน Ingredients
    const hydratedIngredients = await hydrateIngredients(food.ingredients || []);

    // Use the matched MasterFood document as the nutrition source of truth.
    const portionNutrition = food.nutrition_per_portion || {};
    const hasPortionNutrition = Number(portionNutrition.kcal) > 0;
    const menuNutrition = hasPortionNutrition ? portionNutrition : (food.nutrition_per_100g || portionNutrition);
    const nutritionFactor = hasPortionNutrition
      ? 1
      : (Number(food.portion_reference?.total_weight_g) || 100) / 100;
    const finalNutrition = {
      kcal: (Number(menuNutrition.kcal) || 0) * nutritionFactor,
      protein_g: (Number(menuNutrition.protein_g) || 0) * nutritionFactor,
      carb_g: (Number(menuNutrition.carb_g) || 0) * nutritionFactor,
      fat_g: (Number(menuNutrition.fat_g) || 0) * nutritionFactor,
      fiber_g: (Number(menuNutrition.fiber_g) || 0) * nutritionFactor,
      sodium_mg: (Number(menuNutrition.sodium_mg) || 0) * nutritionFactor,
    };

    // 6) Allergen warning check
    let allergen_warning = null;
    const { user_id } = req.query;
    if (user_id) {
      const { checkFoodAllergens } = require("../utils/allergenChecker");
      const User = require("../models/User");
      const userDoc = await User.findOne({ $or: [{ user_id }, { username: user_id }, { email: user_id }] }).lean();
      if (userDoc) {
        // Build ingredient cache from hydrated ingredients
        const ingDocMap = {};
        hydratedIngredients.forEach(function(ing) { if (ing.ingredient_id) ingDocMap[ing.ingredient_id] = ing; });
        allergen_warning = await checkFoodAllergens(food, userDoc, ingDocMap);
      }
    }

    // 7) ส่งข้อมูลกลับ
    return res.json({
      success: true,
      source: "database",
      matchedBy,
      aiDetection,
      data: {
        id: food._id,
        dishName: food.name || "",
        dishNameEn: food.name_en || "",
        category: food.category || "",
        cuisine: food.cuisine || [],
        tags: food.tags || [],
        image: food.image || null,

        calories: finalNutrition.kcal,
        protein: finalNutrition.protein_g,
        carb: finalNutrition.carb_g,
        fat: finalNutrition.fat_g,
        fiber: finalNutrition.fiber_g,
        sodium: finalNutrition.sodium_mg,

        portion: food.portion || { unit: "plate", gram: 100 },
        ingredients: hydratedIngredients,
        allergens: food.allergens || [],
        allergens_summary: food.allergens_summary || [],
        allergen_warning: allergen_warning,
      },
    });
  } catch (error) {
    console.error("❌ AI Error Detail:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    let errorMessage = "เกิดข้อผิดพลาดในการวิเคราะห์อาหาร";
    const rawMessage = error.message || "";

    if (isRateLimitError(error)) {
      errorMessage = "โควตา Gemini API เต็ม กรุณาลองใหม่อีกครั้งภายหลัง";
    } else if (rawMessage.includes("API key not valid")) {
      errorMessage = "API Key ไม่ถูกต้อง กรุณาตรวจสอบ GEMINI_API_KEY";
    } else if (rawMessage) {
      errorMessage = rawMessage;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};
