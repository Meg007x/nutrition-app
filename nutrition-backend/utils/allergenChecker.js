"use strict";

/**
 * allergenChecker.js — Hybrid Allergen Check Helper
 *
 * ตรวจสอบเมนูอาหารกับข้อมูลแพ้ของผู้ใช้ทั้ง 2 ระดับ:
 *   1. Group level: allergens_summary vs allergies_v2[].code
 *   2. Ingredient level: ingredients[].ingredient_id vs allergies_v2
 */

const Ingredient = require("../models/Ingredient");

function emptyResult() {
  return { has_allergen_warning: false, matched_allergens: [], matched_allergen_ingredients: [] };
}

function buildUserSets(user) {
  const allergyV2 = Array.isArray(user.allergies_v2) ? user.allergies_v2 : [];
  const userCodes = new Set();
  const userIngIds = new Set();
  const codeLabelMap = {};
  allergyV2.forEach(function(a) {
    if (a.code) { userCodes.add(a.code); codeLabelMap[a.code] = a.label || a.code; }
    if (a.ingredient_id) userIngIds.add(a.ingredient_id);
  });
  return { allergyV2, userCodes, userIngIds, codeLabelMap };
}

function matchIngredientLevel(foodIngredients, userIngIds, userCodes, codeLabelMap, allergyV2, ingDocMap) {
  const matchedIngredients = [];
  const matchedCodes = new Set();
  ingDocMap = ingDocMap || {};

  for (let i = 0; i < foodIngredients.length; i++) {
    const fi = foodIngredients[i];
    const ingId = fi.ingredient_id;
    const ingName = fi.name_snap || "";

    // Direct ingredient_id match
    if (ingId && userIngIds.has(ingId)) {
      const matchEntry = allergyV2.find(function(a) { return a.ingredient_id === ingId; });
      const code = matchEntry ? matchEntry.code : "specific";
      matchedCodes.add(code);
      matchedIngredients.push({ ingredient_id: ingId, name: ingName, allergen_code: code, allergen_label: matchEntry ? (matchEntry.label || ingName) : ingName });
      continue;
    }

    // allergens_hierarchy match
    const ingDoc = ingDocMap[ingId];
    if (ingDoc && ingDoc.allergens_hierarchy) {
      const ah = ingDoc.allergens_hierarchy;
      const checkTypes = [ah.specific_type, ah.parent_category].filter(Boolean);
      for (let j = 0; j < checkTypes.length; j++) {
        if (userCodes.has(checkTypes[j])) {
          matchedCodes.add(checkTypes[j]);
          matchedIngredients.push({ ingredient_id: ingId, name: ingName || (ingDoc.name || ""), allergen_code: checkTypes[j], allergen_label: codeLabelMap[checkTypes[j]] || checkTypes[j] });
          break;
        }
      }
    }
  }
  return { matchedCodes, matchedIngredients };
}

// Async version (with DB query for ingredient docs)
async function checkFoodAllergens(food, user, ingredientCache) {
  if (!food || !user) return emptyResult();
  const { allergyV2, userCodes, userIngIds, codeLabelMap } = buildUserSets(user);
  if (userCodes.size === 0 && userIngIds.size === 0) return emptyResult();

  const matchedCodes = new Set();
  const summary = Array.isArray(food.allergens_summary) ? food.allergens_summary : [];
  summary.forEach(function(code) { if (userCodes.has(code)) matchedCodes.add(code); });

  const foodIngredients = Array.isArray(food.ingredients) ? food.ingredients : [];
  let ingDocMap = ingredientCache || {};

  if (!ingredientCache) {
    const ingIds = foodIngredients.map(function(i) { return i.ingredient_id; }).filter(Boolean);
    if (ingIds.length > 0) {
      try {
        const docs = await Ingredient.find({ _id: { $in: ingIds } }).lean();
        docs.forEach(function(d) { ingDocMap[d._id] = d; });
      } catch (e) { /* skip */ }
    }
  }

  const ingResult = matchIngredientLevel(foodIngredients, userIngIds, userCodes, codeLabelMap, allergyV2, ingDocMap);
  ingResult.matchedCodes.forEach(function(c) { matchedCodes.add(c); });

  return {
    has_allergen_warning: matchedCodes.size > 0,
    matched_allergens: Array.from(matchedCodes),
    matched_allergen_ingredients: ingResult.matchedIngredients,
  };
}

// Sync version (uses pre-loaded ingredient cache)
function checkFoodAllergensSync(food, user, ingDocMap) {
  if (!food || !user) return emptyResult();
  const { allergyV2, userCodes, userIngIds, codeLabelMap } = buildUserSets(user);
  if (userCodes.size === 0 && userIngIds.size === 0) return emptyResult();

  const matchedCodes = new Set();
  const summary = Array.isArray(food.allergens_summary) ? food.allergens_summary : [];
  summary.forEach(function(code) { if (userCodes.has(code)) matchedCodes.add(code); });

  const foodIngredients = Array.isArray(food.ingredients) ? food.ingredients : [];
  const ingResult = matchIngredientLevel(foodIngredients, userIngIds, userCodes, codeLabelMap, allergyV2, ingDocMap || {});
  ingResult.matchedCodes.forEach(function(c) { matchedCodes.add(c); });

  return {
    has_allergen_warning: matchedCodes.size > 0,
    matched_allergens: Array.from(matchedCodes),
    matched_allergen_ingredients: ingResult.matchedIngredients,
  };
}

module.exports = {
  checkFoodAllergens: checkFoodAllergens,
  checkFoodAllergensSync: checkFoodAllergensSync,
  emptyResult: emptyResult,
};