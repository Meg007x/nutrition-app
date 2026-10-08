"use strict";

/**
 * nutritionCalculator.js — Dynamic Nutrition Calculation Utility
 *
 * คำนวณสารอาหารสดจากวัตถุดิบจริง: (weight_g / 100) × nutrition_per_100g
 * พร้อม Fallback เป็น nutrition_per_portion (Static) ถ้าข้อมูล USDA ยังไม่มี
 */

const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");

// ======================================================
// Helper: safe number
// ======================================================
function num(v) {
  var n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function zeroNutrition() {
  return { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 };
}

// ======================================================
// Core: คำนวณสารอาหารจาก ingredients array
//
// ingredients: [{ ingredient_id, weight_g }] หรือ [{ ingredient_id, qty, unit }]
// db: mongoose connection db (optional — จะใช้ Mongoose Model ถ้าไม่ส่ง)
//
// Returns: { kcal, protein_g, carb_g, fat_g, fiber_g, sodium_mg }
// ======================================================
async function calculateFromIngredients(ingredients) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return zeroNutrition();
  }

  var ids = ingredients.map(function(i) { return i.ingredient_id; }).filter(Boolean);
  if (ids.length === 0) return zeroNutrition();

  // Batch query ทีเดียว
  var docs = await Ingredient.find({ _id: { $in: ids } }).lean();
  var docMap = {};
  docs.forEach(function(doc) { docMap[String(doc._id)] = doc; });

  var totals = zeroNutrition();

  for (var i = 0; i < ingredients.length; i++) {
    var ing = ingredients[i];
    var doc = docMap[String(ing.ingredient_id)];
    if (!doc) continue;

    var n100 = doc.nutrition_per_100g;
    if (!n100 || (n100.kcal === 0 && n100.protein_g === 0)) continue;

    // ใช้ weight_g ถ้ามี, fallback เป็น qty (กรัม)
    var weightG = num(ing.weight_g) || num(ing.qty) || 0;
    if (weightG <= 0) continue;

    var factor = weightG / 100;
    totals.kcal       += num(n100.kcal)       * factor;
    totals.protein_g   += num(n100.protein_g)  * factor;
    totals.carb_g      += num(n100.carb_g)     * factor;
    totals.fat_g       += num(n100.fat_g)      * factor;
    totals.fiber_g     += num(n100.fiber_g)    * factor;
    totals.sodium_mg   += num(n100.sodium_mg)  * factor;
  }

  // Round
  totals.kcal      = Math.round(totals.kcal);
  totals.protein_g  = Math.round(totals.protein_g * 10) / 10;
  totals.carb_g     = Math.round(totals.carb_g * 10) / 10;
  totals.fat_g      = Math.round(totals.fat_g * 10) / 10;
  totals.fiber_g    = Math.round(totals.fiber_g * 10) / 10;
  totals.sodium_mg  = Math.round(totals.sodium_mg);

  return totals;
}

// ======================================================
// Get Nutrition with Fallback
//
// 1. ถ้า food มี ingredients[].weight_g + Ingredient.nutrition_per_100g → คำนวณสด
// 2. Fallback: nutrition_per_portion จาก MasterFood (Static)
// ======================================================
async function getNutritionWithFallback(food) {
  if (!food) return zeroNutrition();

  // ลองคำนวณจาก ingredients ก่อน
  if (Array.isArray(food.ingredients) && food.ingredients.length > 0) {
    var hasWeight = food.ingredients.some(function(ing) {
      return ing.weight_g > 0 || ing.qty > 0;
    });

    if (hasWeight) {
      var calculated = await calculateFromIngredients(food.ingredients);
      // ถ้าได้ค่ามากกว่า 0 ถือว่าสำเร็จ
      if (calculated.kcal > 0) return calculated;
    }
  }

  // Fallback: nutrition_per_portion (Static)
  var np = food.nutrition_per_portion || {};
  return {
    kcal:       num(np.kcal),
    protein_g:  num(np.protein_g),
    carb_g:     num(np.carb_g),
    fat_g:      num(np.fat_g),
    fiber_g:    num(np.fiber_g),
    sodium_mg:  num(np.sodium_mg),
  };
}

// ======================================================
// Build Daily Target (v2 schema format)
// ======================================================
function buildDailyTarget(user) {
  var tdee = num(user?.health_goals?.tdee_target_kcal);
  var protein = num(user?.health_goals?.protein_target_g);
  var carb = tdee > 0 ? Math.round((tdee * 0.5) / 4) : 0;
  var fat  = tdee > 0 ? Math.round((tdee * 0.25) / 9) : 0;

  return {
    target_kcal: tdee,
    target_protein_g: protein,
    target_carb_g: carb,
    target_fat_g: fat,
  };
}

// ======================================================
// Build Daily Summary from slots
// ======================================================
function buildDailySummary(slots, dailyTarget) {
  var tk = 0, tp = 0, tc = 0, tf = 0, tfi = 0, ts = 0;
  var ml = 0, mt = Array.isArray(slots) ? slots.length : 0;

  if (Array.isArray(slots)) {
    slots.forEach(function(s) {
      if (s.status === "eaten") {
        ml++;
        var n = s.calculated_nutrition || (s.main_food && s.main_food.nutrition_per_portion) || {};
        tk += num(n.kcal);  tp += num(n.protein_g);  tc += num(n.carb_g);
        tf += num(n.fat_g); tfi += num(n.fiber_g);   ts += num(n.sodium_mg);
      }
    });
  }

  var targetKcal = dailyTarget ? num(dailyTarget.target_kcal) : 0;

  return {
    total_kcal: Math.round(tk),
    total_protein_g: Math.round(tp * 10) / 10,
    total_carb_g: Math.round(tc * 10) / 10,
    total_fat_g: Math.round(tf * 10) / 10,
    total_fiber_g: Math.round(tfi * 10) / 10,
    total_sodium_mg: Math.round(ts),
    meals_logged: ml,
    meals_total: mt,
    adherence_pct: (targetKcal > 0 && ml > 0) ? Math.round((tk / targetKcal) * 100) : 0,
  };
}

module.exports = {
  calculateFromIngredients: calculateFromIngredients,
  getNutritionWithFallback: getNutritionWithFallback,
  buildDailyTarget: buildDailyTarget,
  buildDailySummary: buildDailySummary,
  zeroNutrition: zeroNutrition,
  num: num,
};