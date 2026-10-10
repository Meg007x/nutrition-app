"use strict";

/**
 * USDA FoodData Central — API Ingestion Layer
 * ดึงข้อมูลสารอาหารจาก USDA แล้ว Safe Upsert ลง Ingredients collection
 * API Docs: https://fdc.nal.usda.gov/api-guide
 */

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

// USDA Nutrient ID → our schema field name
// Macros + Minerals + Vitamins complete set
const NUTRIENT_MAP = {
  // Macros
  1008: "kcal",
  1003: "protein_g",
  1004: "fat_g",
  1005: "carb_g",
  1079: "fiber_g",
  2000: "sugar_g",
  1258: "saturated_fat_g",
  1253: "cholesterol_mg",
  // Minerals
  1093: "sodium_mg",
  1092: "potassium_mg",
  1087: "calcium_mg",
  1089: "iron_mg",
};

// Vitamin nutrient IDs → vitamins sub-document fields
const VITAMIN_MAP = {
  1106: "vitamin_a_mcg",
  1162: "vitamin_c_mg",
  1114: "vitamin_d_mcg",
  1109: "vitamin_e_mg",
  1185: "vitamin_k_mcg",
  1165: "thiamin_b1_mg",
  1166: "riboflavin_b2_mg",
  1167: "niacin_b3_mg",
  1175: "vitamin_b6_mg",
  1177: "folate_b9_mcg",
  1178: "vitamin_b12_mcg",
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
  // Request all nutrient IDs: macros + minerals + vitamins
  var allIds = Object.keys(NUTRIENT_MAP).concat(Object.keys(VITAMIN_MAP));
  var url = USDA_BASE + "/food/" + fdcId + "?api_key=" + apiKey + "&nutrients=" + allIds.join(",");
  var res = await fetch(url);
  if (!res.ok) {
    var t = await res.text();
    throw new Error("USDA Detail Error (" + res.status + "): " + t);
  }
  return res.json();
}

function extractNutritionPer100g(foodNutrients) {
  var result = {
    kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, fiber_g: 0,
    sodium_mg: 0, sugar_g: 0, saturated_fat_g: 0, cholesterol_mg: 0,
    potassium_mg: 0, calcium_mg: 0, iron_mg: 0,
    vitamins: {
      vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_d_mcg: 0,
      vitamin_e_mg: 0, vitamin_k_mcg: 0, thiamin_b1_mg: 0,
      riboflavin_b2_mg: 0, niacin_b3_mg: 0, vitamin_b6_mg: 0,
      folate_b9_mcg: 0, vitamin_b12_mcg: 0,
    },
  };
  if (!Array.isArray(foodNutrients)) return result;
  for (var i = 0; i < foodNutrients.length; i++) {
    var n = foodNutrients[i];
    var nutrientId = n.nutrientId || (n.nutrient && n.nutrient.id);
    var val = Number(n.value || n.amount || 0);
    // Macros + Minerals
    var field = NUTRIENT_MAP[nutrientId];
    if (field) { result[field] = val; continue; }
    // Vitamins
    var vField = VITAMIN_MAP[nutrientId];
    if (vField) result.vitamins[vField] = val;
  }
  return result;
}

function inferAllergenHierarchy(category) {
  if (!category) return null;
  var lc = String(category).toLowerCase();
  // Specific nuts
  if (lc.includes("walnut"))   return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "walnut",  specific_label: "วอลนัท" };
  if (lc.includes("almond"))   return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "almond",  specific_label: "อัลมอนด์" };
  if (lc.includes("cashew"))   return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "cashew",  specific_label: "เม็ดมะม่วงหิมพานต์" };
  if (lc.includes("pecan"))    return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "pecan",   specific_label: "พีแคน" };
  if (lc.includes("pistachio")) return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "pistachio", specific_label: "พิสตาชิโอ" };
  if (lc.includes("macadamia")) return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "macadamia", specific_label: "แมคาเดเมีย" };
  if (lc.includes("hazelnut"))  return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง", specific_type: "hazelnut", specific_label: "เฮเซลนัท" };
  // General categories
  if (lc.includes("dairy"))     return { parent_category: "dairy",     parent_label: "นมและไข่",       specific_type: "milk",      specific_label: "นมวัว" };
  if (lc.includes("egg"))       return { parent_category: "dairy",     parent_label: "นมและไข่",       specific_type: "egg",       specific_label: "ไข่" };
  if (lc.includes("shellfish")) return { parent_category: "seafood",   parent_label: "อาหารทะเล",       specific_type: "shellfish", specific_label: "สัตว์มีเปลือก" };
  if (lc.includes("crustacean")) return { parent_category: "seafood",  parent_label: "อาหารทะเล",       specific_type: "shellfish", specific_label: "สัตว์มีเปลือก" };
  if (lc.includes("mollusk"))   return { parent_category: "seafood",   parent_label: "อาหารทะเล",       specific_type: "shellfish", specific_label: "หอย/หมึก" };
  if (lc.includes("finfish") || lc.includes("fish")) return { parent_category: "seafood", parent_label: "อาหารทะเล", specific_type: "fish", specific_label: "ปลา" };
  if (lc.includes("peanut"))    return { parent_category: "legumes",   parent_label: "ถั่วเมล็ดแห้ง",   specific_type: "peanut",    specific_label: "ถั่วลิสง" };
  if (lc.includes("soy"))       return { parent_category: "soy",       parent_label: "ถั่วเหลือง",       specific_type: "soy",       specific_label: "ถั่วเหลือง" };
  if (lc.includes("wheat") || lc.includes("gluten")) return { parent_category: "gluten", parent_label: "กลูเตน", specific_type: "wheat", specific_label: "ข้าวสาลี" };
  if (lc.includes("nut"))       return { parent_category: "tree_nuts", parent_label: "ถั่วเปลือกแข็ง",  specific_type: "nuts",      specific_label: "ถั่วและเมล็ด" };
  return null;
}

// Infer category_group + label from USDA food category
function inferCategoryGroup(usdaCategory) {
  var lc = String(usdaCategory || "").toLowerCase();
  if (lc.includes("vegetable") || lc.includes("fruit"))
    return { category_group: "veg_group", category_group_label: "ผักและผลไม้", sub_category: lc.includes("fruit") ? "fruit" : "vegetable", sub_category_label: lc.includes("fruit") ? "ผลไม้" : "ผัก" };
  if (lc.includes("nut") || lc.includes("seed") || lc.includes("legume"))
    return { category_group: "protein_group", category_group_label: "เนื้อสัตว์และโปรตีน", sub_category: "nuts_seeds", sub_category_label: "ถั่วและเมล็ดพืช" };
  if (lc.includes("poultry"))
    return { category_group: "protein_group", category_group_label: "เนื้อสัตว์และโปรตีน", sub_category: "meat", sub_category_label: "เนื้อสัตว์" };
  if (lc.includes("beef") || lc.includes("pork") || lc.includes("lamb") || lc.includes("veal"))
    return { category_group: "protein_group", category_group_label: "เนื้อสัตว์และโปรตีน", sub_category: "meat", sub_category_label: "เนื้อสัตว์" };
  if (lc.includes("finfish") || lc.includes("fish"))
    return { category_group: "protein_group", category_group_label: "เนื้อสัตว์และโปรตีน", sub_category: "seafood", sub_category_label: "อาหารทะเล" };
  if (lc.includes("crustacean") || lc.includes("mollusk") || lc.includes("seafood"))
    return { category_group: "protein_group", category_group_label: "เนื้อสัตว์และโปรตีน", sub_category: "seafood", sub_category_label: "อาหารทะเล" };
  if (lc.includes("dairy") || lc.includes("egg"))
    return { category_group: "seasoning_group", category_group_label: "เครื่องปรุง/ส่วนผสม", sub_category: "dairy", sub_category_label: "นมและผลิตภัณฑ์นม" };
  if (lc.includes("cereal") || lc.includes("grain") || lc.includes("pasta") || lc.includes("bread"))
    return { category_group: "seasoning_group", category_group_label: "เครื่องปรุง/ส่วนผสม", sub_category: "bread_flour", sub_category_label: "ขนมปังและแป้ง" };
  if (lc.includes("fat") || lc.includes("oil"))
    return { category_group: "seasoning_group", category_group_label: "เครื่องปรุง/ส่วนผสม", sub_category: "seasoning", sub_category_label: "เครื่องปรุง" };
  if (lc.includes("sugar") || lc.includes("sweet"))
    return { category_group: "seasoning_group", category_group_label: "เครื่องปรุง/ส่วนผสม", sub_category: "sweetener", sub_category_label: "ของหวานและน้ำตาล" };
  if (lc.includes("spice") || lc.includes("herb") || lc.includes("sauce") || lc.includes("condiment"))
    return { category_group: "seasoning_group", category_group_label: "เครื่องปรุง/ส่วนผสม", sub_category: "seasoning", sub_category_label: "เครื่องปรุง" };
  return { category_group: "seasoning_group", category_group_label: "เครื่องปรุง/ส่วนผสม", sub_category: "other", sub_category_label: "อื่นๆ" };
}

async function upsertIngredientFromUsda(db, usdaFood) {
  var collection = db.collection("Ingredients");
  var fdcId    = usdaFood.fdcId;
  var foodName = String(usdaFood.description || "").trim();
  var nameEn   = String(usdaFood.description || "").trim();
  // SR Legacy: foodCategory is a plain string; Foundation: foodCategory.description
  var category = String(
    usdaFood.foodCategoryDescription ||
    (typeof usdaFood.foodCategory === "string" ? usdaFood.foodCategory : "") ||
    (usdaFood.foodCategory && usdaFood.foodCategory.description) ||
    ""
  ).trim();

  // Infer allergen from both category AND food name (for items like "Nuts, walnuts")
  // Prefer the more specific result (from food name) when category gives generic "nuts"
  var aFromCat = inferAllergenHierarchy(category);
  var aFromName = inferAllergenHierarchy(foodName);
  var allergenH = aFromCat;
  if (aFromName && (!aFromCat || aFromName.specific_type !== "nuts")) allergenH = aFromName;
  var catGroup  = inferCategoryGroup(category);
  var nutrition = extractNutritionPer100g(usdaFood.foodNutrients);
  var docId = "ing_usda_" + fdcId;

  // Build keywords from description
  var keywords = [foodName.toLowerCase()];
  if (nameEn.toLowerCase() !== foodName.toLowerCase()) keywords.push(nameEn.toLowerCase());

  var $set = {
    name: foodName,
    name_en: nameEn,
    category: category.toLowerCase().replace(/\s+/g, "_") || "other",
    keywords: keywords,
    is_active: true,
    source: "USDA FoodData Central",
    usda_fdc_id: fdcId,
    serving_base: { qty: 100, unit: "g" },
    nutrition_per_100g: nutrition,
    category_group: catGroup.category_group,
    category_group_label: catGroup.category_group_label,
    sub_category: catGroup.sub_category,
    sub_category_label: catGroup.sub_category_label,
    updated_at: new Date(),
  };
  // Set allergens_hierarchy explicitly (null for non-allergen ingredients)
  $set.allergens_hierarchy = allergenH || null;

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
  inferCategoryGroup: inferCategoryGroup,
  upsertIngredientFromUsda: upsertIngredientFromUsda,
  USDA_BASE: USDA_BASE,
  NUTRIENT_MAP: NUTRIENT_MAP,
  VITAMIN_MAP: VITAMIN_MAP,
};