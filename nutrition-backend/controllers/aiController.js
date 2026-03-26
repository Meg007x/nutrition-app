const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const MasterFood = require("../models/MasterFood");
const Ingredient = require("../models/Ingredient");

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    model: "gemini-2.5-flash-lite",
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
      name: info?.name || item.ingredient_id,
      category: info?.category || "other",
      qty: item.qty || 0,
      unit: item.unit || "",
      keywords: info?.keywords || [],
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("ไม่พบ GEMINI_API_KEY ในไฟล์ .env");
    }

    console.log("📸 วิเคราะห์รูป:", req.file.filename);

    const ai = new GoogleGenAI({ apiKey });

    // 1) AI ระบุชื่ออาหาร
    const aiDetection = await detectDishFromImage(
      ai,
      req.file.path,
      req.file.mimetype
    );

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

    // 5) ส่งข้อมูลกลับ
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

        calories: food.nutrition_per_portion?.kcal || 0,
        protein: food.nutrition_per_portion?.protein_g || 0,
        carb: food.nutrition_per_portion?.carb_g || 0,
        fat: food.nutrition_per_portion?.fat_g || 0,
        fiber: food.nutrition_per_portion?.fiber_g || 0,
        sodium: food.nutrition_per_portion?.sodium_mg || 0,

        portion: food.portion || { unit: "plate", gram: 100 },
        ingredients: hydratedIngredients,
        allergens: food.allergens || [],
      },
    });
  } catch (error) {
    console.error("❌ AI Error Detail:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    let errorMessage = "เกิดข้อผิดพลาดในการวิเคราะห์อาหาร";
    const rawMessage = error.message || "";

    if (
      rawMessage.includes("RESOURCE_EXHAUSTED") ||
      rawMessage.includes("429")
    ) {
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