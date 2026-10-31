"use strict";

/**
 * allergenChecker.js — Hybrid Allergen Check Helper
 *
 * ตรวจสอบเมนูอาหารกับข้อมูลแพ้ของผู้ใช้ทั้ง 2 ระดับ:
 *   1. Group level: allergens_summary vs allergies_v2[].code
 *   2. Ingredient level: ingredients[].ingredient_id vs allergies_v2
 */

const Ingredient = require("../models/Ingredient");

function normalizeName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function emptyResult() {
  return { has_allergen_warning: false, matched_allergens: [], matched_allergen_ingredients: [] };
}

function buildUserSets(user) {
  const allergyV2 = Array.isArray(user.allergies_v2) ? user.allergies_v2.slice() : [];
  // Older profiles may only have the categorized `allergies` object.
  // Treat each stored allergy name as a specific allergy as well.
  if (user.allergies && typeof user.allergies === "object") {
    Object.values(user.allergies).forEach(function(values) {
      if (!Array.isArray(values)) return;
      values.forEach(function(label) {
        if (!label || allergyV2.some(function(a) { return normalizeName(a.label) === normalizeName(label); })) return;
        allergyV2.push({ code: String(label).trim().toLowerCase().replace(/\s+/g, "_"), label: String(label).trim() });
      });
    });
  }
  const userCodes = new Set();
  const userIngIds = new Set();
  const userIngredientNames = new Set();
  const codeLabelMap = {};
  allergyV2.forEach(function(a) {
    if (a.code) { userCodes.add(String(a.code).toLowerCase()); codeLabelMap[String(a.code).toLowerCase()] = a.label || a.code; }
    if (a.ingredient_id) userIngIds.add(String(a.ingredient_id));
    if (a.label) userIngredientNames.add(normalizeName(a.label));
  });
  return { allergyV2, userCodes, userIngIds, userIngredientNames, codeLabelMap };
}

function matchIngredientLevel(foodIngredients, userIngIds, userIngredientNames, userCodes, codeLabelMap, allergyV2, ingDocMap) {
  const matchedIngredients = [];
  const matchedCodes = new Set();
  ingDocMap = ingDocMap || {};

  for (let i = 0; i < foodIngredients.length; i++) {
    const fi = foodIngredients[i];
    const ingId = fi.ingredient_id;
    const ingName = fi.name_snap || fi.name || "";

    // Direct ingredient_id match
    if (ingId && userIngIds.has(String(ingId))) {
      const matchEntry = allergyV2.find(function(a) { return String(a.ingredient_id) === String(ingId); });
      const code = matchEntry ? matchEntry.code : "specific";
      matchedCodes.add(code);
      matchedIngredients.push({ ingredient_id: ingId, name: ingName, allergen_code: code, allergen_label: matchEntry ? (matchEntry.label || ingName) : ingName });
      continue;
    }

    // Imported MasterFood rows may have ingredient names but no canonical IDs.
    // Match the user's specific allergy label against that ingredient name.
    if (userIngredientNames.has(normalizeName(ingName))) {
      const matchEntry = allergyV2.find(function(a) {
        return normalizeName(a.label) === normalizeName(ingName);
      });
      const code = matchEntry ? matchEntry.code : "specific";
      matchedCodes.add(code);
      matchedIngredients.push({
        ingredient_id: ingId || null,
        name: ingName,
        allergen_code: code,
        allergen_label: matchEntry ? (matchEntry.label || ingName) : ingName,
      });
      continue;
    }

    // allergens_hierarchy match
    const ingDoc = ingDocMap[ingId];
    if (ingDoc && ingDoc.allergens_hierarchy) {
      const ah = ingDoc.allergens_hierarchy;
      const checkTypes = [ah.specific_type, ah.parent_category].filter(Boolean).map(function(code) { return String(code).toLowerCase(); });
      const checkLabels = [ah.specific_label, ah.parent_label].map(normalizeName).filter(Boolean);
      const matchingLabel = allergyV2.find(function(allergy) {
        return allergy.label && checkLabels.includes(normalizeName(allergy.label));
      });
      if (matchingLabel) {
        const code = matchingLabel.code || matchingLabel.label;
        matchedCodes.add(code);
        matchedIngredients.push({ ingredient_id: ingId, name: ingName || (ingDoc.name || ""), allergen_code: code, allergen_label: matchingLabel.label });
        continue;
      }
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
  const { allergyV2, userCodes, userIngIds, userIngredientNames, codeLabelMap } = buildUserSets(user);
  if (userCodes.size === 0 && userIngIds.size === 0 && userIngredientNames.size === 0) return emptyResult();

  const matchedCodes = new Set();
  const summary = Array.isArray(food.allergens_summary) ? food.allergens_summary : [];
  summary.forEach(function(item) {
    if (typeof item === "string") {
      if (userCodes.has(String(item).toLowerCase())) matchedCodes.add(String(item).toLowerCase());
      return;
    }
    if (!item || typeof item !== "object") return;
    [item.parent_category, item.specific_type].filter(Boolean).forEach(function(code) {
      if (userCodes.has(String(code).toLowerCase())) matchedCodes.add(String(code).toLowerCase());
    });
    const labels = [item.parent_label, item.specific_label].map(normalizeName).filter(Boolean);
    allergyV2.forEach(function(allergy) {
      if (allergy.label && labels.includes(normalizeName(allergy.label))) {
        matchedCodes.add(allergy.code || allergy.label);
      }
    });
  });

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

  const ingResult = matchIngredientLevel(foodIngredients, userIngIds, userIngredientNames, userCodes, codeLabelMap, allergyV2, ingDocMap);
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
  const { allergyV2, userCodes, userIngIds, userIngredientNames, codeLabelMap } = buildUserSets(user);
  if (userCodes.size === 0 && userIngIds.size === 0 && userIngredientNames.size === 0) return emptyResult();

  const matchedCodes = new Set();
  const summary = Array.isArray(food.allergens_summary) ? food.allergens_summary : [];
  summary.forEach(function(item) {
    if (typeof item === "string") {
      if (userCodes.has(String(item).toLowerCase())) matchedCodes.add(String(item).toLowerCase());
      return;
    }
    if (!item || typeof item !== "object") return;
    [item.parent_category, item.specific_type].filter(Boolean).forEach(function(code) {
      if (userCodes.has(String(code).toLowerCase())) matchedCodes.add(String(code).toLowerCase());
    });
    const labels = [item.parent_label, item.specific_label].map(normalizeName).filter(Boolean);
    allergyV2.forEach(function(allergy) {
      if (allergy.label && labels.includes(normalizeName(allergy.label))) {
        matchedCodes.add(allergy.code || allergy.label);
      }
    });
  });

  const foodIngredients = Array.isArray(food.ingredients) ? food.ingredients : [];
  const ingResult = matchIngredientLevel(foodIngredients, userIngIds, userIngredientNames, userCodes, codeLabelMap, allergyV2, ingDocMap || {});
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
