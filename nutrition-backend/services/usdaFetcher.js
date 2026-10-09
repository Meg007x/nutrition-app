"use strict";

/**
 * USDA FoodData Central — API Ingestion Layer
 * ดึงข้อมูลสารอาหารจาก USDA แล้ว Safe Upsert ลง Ingredients collection
 * API Docs: https://fdc.nal.usda.gov/api-guide
 */

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

const NUTRIENT_MAP = {
  1008: "kcal",
  1003: "protein_g",
  1004: "fat_g",
  1005: "carb_g",
  1079: "fiber_g",
  1093: "sodium_mg",
};

const ALLERGEN_CATEGORY_MAP = {
  "Dairy":           { parent_category: "dairy",     parent_label: "นมและไข่",        specific_type: "milk",      specific_label: "นมวัว" },
  "Egg":             { parent_category: "dairy",     parent_label: "นมและไข่",        specific_type: "egg",       specific_label: "ไข่" },
  "Crustacean":      { parent_category: "seafood",   parent_label: "อาหารทะเล",       specific_type: "shellfish", specific_label: "สัตว์มีเปลือก" },
  "Mollusk":         { parent_category: "seafood",   parent_label: "อาหารทะเล",       specific_type: "shellfish", specific_label: "หอย/หมึก" },
  "Finfish":         { parent_category: "seafood",   parent_label: "อาหารทะเล",       specific_type: "fish",      specific_label: "ปลา" },
  "Nut":             { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง",  specific_type: "nuts",      specific_label: "ถั่วและเมล็ด" },
  "Peanut":          { parent_category: "legumes",   parent_label: "ถั่วเมล็ดแห้ง",  specific_type: "peanut",    specific_label: "ถั่วลิสง" },
  "Soy":             { parent_category: "soy",       parent_label: "ถั่วเหลือง",      specific_type: "soy",       specific_label: "ถั่วเหลือง" },
  "Wheat":           { parent_category: "gluten",    parent_label: "กลูเตน",           specific_type: "wheat",     specific_label: "ข้าวสาลี" },
};

async function searchFoods(query, dataType, pageSize) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) throw new Error("กรุณาตั้งค่า USDA_API_KEY ใน .env");
  dataType = dataType || "SR Legacy";
  pageSize = pageSize || 10;
  const url = new URL(USDA_BASE + "/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("dataType", dataType);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("sortBy", "dataType.keyword");
  url.searchParams.set("sortOrder", "asc");
  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error("USDA Search Error (" + res.status + "): " + t);
  }
  const data = await res.json();
  return data.foods || [];
}

/**
 * ค้นหาข้ามหลาย data types (SR Legacy + Foundation) เพื่อให้ได้ macro nutrients
 */
async function searchFoodsMulti(query, pageSize) {
  pageSize = pageSize || 5;
  var results = [];
  var sr = await searchFoods(query, "SR Legacy", pageSize);
  results = results.concat(sr);
  if (results.length < pageSize) {
    var found = await searchFoods(query, "Foundation", pageSize - results.length);
    results = results.concat(found);
  }
  return results;
}

async function getFoodDetail(fdcId) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) throw new Error("กรุณาตั้งค่า USDA_API_KEY ใน .env");
  const nutrientIds = Object.keys(NUTRIENT_MAP).join(",");
  const url = USDA_BASE + "/food/" + fdcId + "?api_key=" + apiKey + "&nutrients=" + nutrientIds;
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text();
    throw new Error("USDA Detail Error (" + res.status + "): " + t);
  }
  return res.json();
}

function extractNutritionPer100g(foodNutrients) {
  var result = { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 };
  if (!Array.isArray(foodNutrients)) return result;
  for (var i = 0; i < foodNutrients.length; i++) {
    var n = foodNutrients[i];
    var nutrientId = n.nutrientId || (n.nutrient && n.nutrient.id);
    var field = NUTRIENT_MAP[nutrientId];
    if (field) result[field] = Number(n.value || n.amount || 0);
  }
  return result;
}

function inferAllergenHierarchy(category) {
  if (!category) return null;
  var lc = String(category).toLowerCase();
  if (lc.includes("dairy"))     return { parent_category: "dairy",     parent_label: "นมและไข่",       specific_type: "milk",      specific_label: "นมวัว" };
  if (lc.includes("egg"))       return { parent_category: "dairy",     parent_label: "นมและไข่",       specific_type: "egg",       specific_label: "ไข่" };
  if (lc.includes("shellfish")) return { parent_category: "seafood",   parent_label: "อาหารทะเล",     specific_type: "shellfish", specific_label: "สัตว์มีเปลือก" };
  if (lc.includes("finfish") || lc.includes("fish")) return { parent_category: "seafood", parent_label: "อาหารทะเล", specific_type: "fish", specific_label: "ปลา" };
  if (lc.includes("peanut"))    return { parent_category: "legumes",   parent_label: "ถั่วเมล็ดแห้ง", specific_type: "peanut",    specific_label: "ถั่วลิสง" };
  if (lc.includes("nut"))       return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "nuts",     specific_label: "ถั่วและเมล็ด" };
  if (lc.includes("soy"))       return { parent_category: "soy",       parent_label: "ถั่วเหลือง",     specific_type: "soy",       specific_label: "ถั่วเหลือง" };
  if (lc.includes("wheat") || lc.includes("gluten")) return { parent_category: "gluten", parent_label: "กลูเตน", specific_type: "wheat", specific_label: "ข้าวสาลี" };
  return null;
}

async function upsertIngredientFromUsda(db, usdaFood) {
  var collection = db.collection("Ingredients");
  var fdcId    = usdaFood.fdcId;
  var foodName = String(usdaFood.description || "").trim();
  var category = String(usdaFood.foodCategoryDescription || (usdaFood.foodCategory && usdaFood.foodCategory.description) || "").trim();
  var nutrition = extractNutritionPer100g(usdaFood.foodNutrients);
  var allergenH = inferAllergenHierarchy(category);
  var docId = "ing_usda_" + fdcId;

  var $set = {
    name: foodName,
    category: category.toLowerCase().replace(/\s+/g, "_") || "other",
    keywords: [],
    is_active: true,
    source: "USDA FoodData Central",
    usda_fdc_id: fdcId,
    serving_base: { qty: 100, unit: "g" },
    nutrition_per_100g: nutrition,
    updated_at: new Date(),
  };
  if (allergenH) $set.allergens_hierarchy = allergenH;

  var result = await collection.updateOne(
    { usda_fdc_id: fdcId },
    { $set: $set, $setOnInsert: { _id: docId, created_at: new Date() } },
    { upsert: true }
  );

  return {
    _id: docId,
    name: foodName,
    fdcId: fdcId,
    action: result.upsertedCount > 0 ? "upserted" : "updated",
  };
}

module.exports = {
  searchFoods: searchFoods,
  searchFoodsMulti: searchFoodsMulti,
  getFoodDetail: getFoodDetail,
  extractNutritionPer100g: extractNutritionPer100g,
  inferAllergenHierarchy: inferAllergenHierarchy,
  upsertIngredientFromUsda: upsertIngredientFromUsda,
  USDA_BASE: USDA_BASE,
  NUTRIENT_MAP: NUTRIENT_MAP,
};