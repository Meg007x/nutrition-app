﻿const DailyPlan = require("../models/DailyPlan");
const MasterFood = require("../models/MasterFood");
const User = require("../models/User");
const { buildDailySummary, num } = require("../utils/nutritionCalculator");
const { calculateMacroTargets } = require("../utils/macroTargets");

// ======================================================
// Shared: Calculate Daily Nutrition Target from User
// Uses stored calories and protein, then derives macros with the shared formula.
// ======================================================

function calculateDailyNutritionTarget(user) {
  const healthGoals = user?.health_goals;
  if (
    healthGoals?.target_calories == null ||
    healthGoals?.protein_target_g == null
  ) {
    return null;
  }

  const targetKcal = num(healthGoals.target_calories);
  const protein_g = num(healthGoals.protein_target_g);

  if (targetKcal <= 0 || protein_g <= 0) {
    return null;
  }

  const macroTargets = calculateMacroTargets(targetKcal, protein_g);
  if (!macroTargets.valid) {
    return null;
  }

  return {
    kcal: targetKcal,
    protein_g: macroTargets.target_protein_g,
    carb_g: macroTargets.target_carb_g,
    fat_g: macroTargets.target_fat_g,
    fiber_g: 0,
    sodium_mg: 0,
    // Snapshot targets at plan creation so later profile changes do not alter this plan.
    daily_target: {
      target_kcal: targetKcal,
      target_protein_g: macroTargets.target_protein_g,
      target_carb_g: macroTargets.target_carb_g,
      target_fat_g: macroTargets.target_fat_g,
    },
  };
}

// ======================================================
// Helpers
// ======================================================

function generatePlanId() {
  return `PLAN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function isValidDate(dateString) {
  if (typeof dateString !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = new Date(`${dateString}T00:00:00`);
  return !Number.isNaN(date.getTime()) && formatDate(date) === dateString;
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function getNutrition(food) {
  // Support both the current schema and older/imported MasterFood field names.
  const sources = [
    food?.calculated_nutrition,
    food?.nutrition_per_portion,
    food?.nutrition_per_100g,
    food?.nutrition,
    food?.nutrients,
    food?.macros,
  ].filter((value) => value && typeof value === "object");
  const nutrition = sources.find((value) =>
    [value.kcal, value.calories, value.energy_kcal, value.protein_g, value.protein,
      value.carb_g, value.carbs_g, value.carbohydrates_g, value.fat_g, value.fat]
      .some((number) => Number(number) > 0)
  ) || sources[0] || {};
  const factor = nutrition === food?.nutrition_per_100g
    ? (num(food?.portion_reference?.total_weight_g) || 100) / 100
    : 1;
  return {
    kcal: num(nutrition.kcal ?? nutrition.calories ?? nutrition.energy_kcal ?? food?.kcal) * factor,
    protein_g: num(nutrition.protein_g ?? nutrition.protein ?? food?.protein_g) * factor,
    carb_g: num(nutrition.carb_g ?? nutrition.carbs_g ?? nutrition.carbohydrates_g ?? nutrition.carbs ?? food?.carb_g) * factor,
    fat_g: num(nutrition.fat_g ?? nutrition.fat ?? food?.fat_g) * factor,
    fiber_g: num(nutrition.fiber_g ?? nutrition.fiber ?? food?.fiber_g) * factor,
    sodium_mg: num(nutrition.sodium_mg ?? nutrition.sodium ?? food?.sodium_mg) * factor,
  };
}

// v2: Async version with USDA-based calculation
async function getNutritionAsync(food) {
  // MasterFood is the source of truth for menu nutrition. Do not recalculate
  // it from Ingredient documents, whose values may describe different foods.
  return getNutrition(food);
}

function addNutrition(current, nutrition) {
  return {
    kcal: current.kcal + nutrition.kcal,
    protein_g: current.protein_g + nutrition.protein_g,
    carb_g: current.carb_g + nutrition.carb_g,
    fat_g: current.fat_g + nutrition.fat_g,
    fiber_g: current.fiber_g + nutrition.fiber_g,
    sodium_mg: current.sodium_mg + nutrition.sodium_mg,
  };
}

function mapFood(food) {
  if (!food) return null;
  const nutrition = getNutrition(food);
  const image = food.image || food.image_url || food.photo_url || food.images?.[0] || "";
  return {
    food_id: food._id || food.food_id || null,
    name: food.name || "",
    name_en: food.name_en || "",
    image_url: image,
    category: food.category || "",
    kcal: nutrition.kcal,
    nutrition_per_portion: nutrition,
    // v2 fields
    portion_multiplier: 1.0,
    actual_weight_g: food.portion?.gram || food.portion_reference?.total_weight_g || 0,
    calculated_nutrition: null,
    allergens_summary: food.allergens_summary || [],
  };
}

function pickDiverseFood(foods, targetKcal, usedToday, usageCounts) {
  const unused = foods.filter((food) => !usedToday.has(String(food._id || food.food_id)));
  const pool = unused.length > 0 ? unused : foods;
  const ranked = pool.map((food) => ({
    food,
    id: String(food._id || food.food_id),
    distance: Math.abs(getNutrition(food).kcal - targetKcal),
  })).sort((a, b) => a.distance - b.distance);

  if (ranked.length === 0) return null;

  // Keep choices near the calorie target, then prefer foods used less often.
  // Randomizing within that band avoids a deterministic single-menu plan.
  const bestDistance = ranked[0].distance;
  const tolerance = Math.max(100, targetKcal * 0.15);
  const nearTarget = ranked.filter((item) => item.distance <= bestDistance + tolerance);
  const minimumUses = Math.min(...nearTarget.map((item) => usageCounts.get(item.id) || 0));
  const leastUsed = nearTarget.filter((item) => (usageCounts.get(item.id) || 0) === minimumUses);
  const chosen = leastUsed[Math.floor(Math.random() * leastUsed.length)];

  usedToday.add(chosen.id);
  usageCounts.set(chosen.id, (usageCounts.get(chosen.id) || 0) + 1);
  return chosen.food;
}

function flattenValues(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj.filter((i) => typeof i === "string" && i.trim()).map((i) => i.trim());
  const result = [];
  for (const key of Object.keys(obj)) {
    const values = obj[key];
    if (Array.isArray(values)) {
      for (const item of values) {
        if (typeof item === "string" && item.trim()) result.push(item.trim());
      }
    }
  }
  return result;
}

// ======================================================
// POST /api/meal/plans - Create Meal Plan
// ======================================================

async function createMealPlans(req, res) {
  try {
    const { user_id, start_date, days = 7, goal = "", allergies = [], disliked_foods = [] } = req.body;

    console.log("📋 CREATE MEAL PLAN | USER:", user_id, "DAYS:", days);

    if (!user_id) return res.status(400).json({ success: false, message: "กรุณาระบุ user_id" });
    if (!start_date || !isValidDate(start_date)) return res.status(400).json({ success: false, message: "กรุณาระบุ start_date (YYYY-MM-DD)" });

    // Fetch user to get health_goals as source of truth
    const User = require("../models/User");
    const user = await User.findOne({ $or: [{ user_id }, { username: user_id }, { email: user_id }] }).lean();
    if (!user) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });

    const dailyTarget = calculateDailyNutritionTarget(user);
    if (!dailyTarget) {
      return res.status(400).json({
        success: false,
        message:
          "ไม่พบเป้าหมายแคลอรี่หรือโปรตีนที่ถูกต้อง กรุณาตรวจสอบข้อมูลสุขภาพก่อนสร้างแผน",
      });
    }
    const { kcal: target_kcal, protein_g, carb_g, fat_g, fiber_g, sodium_mg } = dailyTarget;

    console.log("📋 DAILY TARGET from User.health_goals:", JSON.stringify(dailyTarget));

    const planDays = Math.min(Math.max(Number(days) || 7, 1), 7);
    const planId = generatePlanId();

    // ─── Build meal slots from user's meal_settings.schedules ───
    const mealSchedules = user?.meal_settings?.schedules || [];
    const mealsPerDay = user?.meal_settings?.meals_per_day || mealSchedules.length || 3;

    // Default slot definitions if user has no schedules
    const defaultSlots = [
      { slot_name: "มื้อเช้า", meal_type: "breakfast", ratio: 0.3 },
      { slot_name: "มื้อกลางวัน", meal_type: "lunch", ratio: 0.4 },
      { slot_name: "มื้อเย็น", meal_type: "dinner", ratio: 0.3 },
    ];

    // Build slots from user schedules or defaults
    let mealSlots;
    if (mealSchedules.length > 0) {
      const ratioEach = 1 / mealSchedules.length;
      mealSlots = mealSchedules.map((s, idx) => ({
        slot_name: s.name || `มื้อที่ ${idx + 1}`,
        meal_type: s.name ? s.name.toLowerCase().replace(/\s/g, "_") : `meal_${idx + 1}`,
        ratio: ratioEach,
      }));
    } else {
      mealSlots = defaultSlots.slice(0, mealsPerDay);
      // Re-normalize ratios
      const totalRatio = mealSlots.reduce((sum, s) => sum + s.ratio, 0);
      mealSlots = mealSlots.map(s => ({ ...s, ratio: s.ratio / totalRatio }));
    }

    // Build exclude filter — v1 (legacy string matching)
    const allergyList = Array.isArray(allergies) ? allergies : flattenValues(allergies);
    const dislikedList = Array.isArray(disliked_foods) ? disliked_foods : flattenValues(disliked_foods);
    const excludeList = [...new Set([...allergyList, ...dislikedList])];

    // v2: Build allergen code set from user.allergies_v2
    const userDoc = await User.findOne({ $or: [{ user_id }, { username: user_id }, { email: user_id }] }).lean();
    const allergyV2Codes = [];
    const allergyNames = new Set(
      [...allergyList, ...((userDoc?.allergies_v2 || []).map((item) => item.label).filter(Boolean))]
        .map((name) => String(name).trim().toLowerCase())
        .filter(Boolean)
    );
    if (userDoc && Array.isArray(userDoc.allergies_v2)) {
      userDoc.allergies_v2.forEach(function(a) { if (a.code) allergyV2Codes.push(a.code); });
    }

    let foodQuery = {};
    if (excludeList.length > 0 || allergyV2Codes.length > 0) {
      const conditions = [];
      if (excludeList.length > 0) {
        const excludeRegex = excludeList.map((item) => new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        conditions.push({ allergens: { $not: { $elemMatch: { $in: excludeRegex } } } });
        conditions.push({ name: { $not: { $in: excludeRegex } } });
      }
      // allergens_summary is now an array of hierarchy objects; final filtering
      // uses allergenChecker so both legacy string codes and object entries work.
      foodQuery = conditions.length > 0 ? { $and: conditions } : {};
    }

    const allFoods = await MasterFood.find(foodQuery).lean();
    console.log("Available foods after group-level filter:", allFoods.length);

    // ─── Ingredient-level filtering (v2) ─────────────────
    // Check each food's ingredients[] against user's specific allergies & dislikes
        // ─── Ingredient-level filtering (v2) ─────────────────
    // รวมการกรองจาก allergies_v2, disliked_foods
    // และ disliked_ingredients_v2 ของทั้งสองฝั่ง
    let filteredFoods = allFoods;

    const hasDislikedFoods =
      userDoc &&
      userDoc.disliked_foods &&
      Object.keys(userDoc.disliked_foods).length > 0;

    const hasDislikedIngredientsV2 =
      userDoc &&
      Array.isArray(userDoc.disliked_ingredients_v2) &&
      userDoc.disliked_ingredients_v2.length > 0;

    if (
      allergyV2Codes.length > 0 ||
      allergyNames.size > 0 ||
      excludeList.length > 0 ||
      hasDislikedFoods ||
      hasDislikedIngredientsV2
    ) {
      // เก็บรหัสสารก่อภูมิแพ้
      const allV2Codes = [...allergyV2Codes];

      // เก็บ ID ของวัตถุดิบที่ผู้ใช้แพ้หรือไม่ต้องการ
      const v2IngredientIds = new Set();

      if (userDoc && Array.isArray(userDoc.allergies_v2)) {
        userDoc.allergies_v2.forEach(function (a) {
          if (a.ingredient_id) {
            v2IngredientIds.add(String(a.ingredient_id));
          }
        });
      }

      // เพิ่ม ID จาก disliked_ingredients_v2
      if (userDoc && Array.isArray(userDoc.disliked_ingredients_v2)) {
        userDoc.disliked_ingredients_v2.forEach(function (d) {
          if (d.ingredient_id) {
            v2IngredientIds.add(String(d.ingredient_id));
          }
        });
      }

      // ค้นหา Ingredient ที่ตรงกับรหัสสารก่อภูมิแพ้
      if (allV2Codes.length > 0) {
        try {
          const Ingredient = require("../models/Ingredient");

          const matchingIngs = await Ingredient.find({
            "allergens_hierarchy.specific_type": {
              $in: allV2Codes,
            },
          })
            .select("_id")
            .lean();

          matchingIngs.forEach(function (ing) {
            v2IngredientIds.add(String(ing._id));
          });
        } catch (e) {
          console.log("Ingredient-level filter skipped:", e.message);
        }
      }

      // เก็บชื่อวัตถุดิบที่ผู้ใช้ไม่ชอบ
      const dislikedNames = new Set(
        dislikedList.map((name) => String(name).trim().toLowerCase()).filter(Boolean)
      );

      if (userDoc && userDoc.disliked_foods) {
        Object.values(userDoc.disliked_foods).forEach(function (arr) {
          if (Array.isArray(arr)) {
            arr.forEach(function (name) {
              if (typeof name === "string" && name.trim()) {
                dislikedNames.add(name.trim().toLowerCase());
              }
            });
          }
        });
      }

      // เพิ่มชื่อจาก disliked_ingredients_v2
      if (userDoc && Array.isArray(userDoc.disliked_ingredients_v2)) {
        userDoc.disliked_ingredients_v2.forEach(function (d) {
          if (d.name && typeof d.name === "string") {
            dislikedNames.add(d.name.trim().toLowerCase());
          }
        });
      }

      // กรองอาหารที่มีวัตถุดิบแพ้หรือวัตถุดิบที่ไม่ชอบ
      if (v2IngredientIds.size > 0 || dislikedNames.size > 0) {
        filteredFoods = allFoods.filter(function (food) {
          const ingredients = Array.isArray(food.ingredients)
            ? food.ingredients
            : [];

          for (const ingredient of ingredients) {
            const ingredientId = ingredient.ingredient_id
              ? String(ingredient.ingredient_id)
              : "";

            const ingredientName = String(
              ingredient.name_snap || ingredient.name || ""
            )
              .trim()
              .toLowerCase();

            // ตรวจสอบ ID ของวัตถุดิบ
            if (
              ingredientId &&
              v2IngredientIds.has(ingredientId)
            ) {
              console.log(
                "Blocked (ingredient ID):",
                food.name,
                "→",
                ingredientId
              );
              return false;
            }

            if (ingredientName && allergyNames.has(ingredientName)) {
              console.log("Blocked (allergy ingredient name):", food.name, "→", ingredientName);
              return false;
            }

            // ตรวจสอบชื่อวัตถุดิบ
            if (
              ingredientName &&
              dislikedNames.has(ingredientName)
            ) {
              console.log(
                "Blocked (disliked ingredient):",
                food.name,
                "→",
                ingredientName
              );
              return false;
            }
          }

          return true;
        });

        console.log(
          "After ingredient-level filter:",
          filteredFoods.length,
          "(was",
          allFoods.length,
          ")"
        );
      }
    }

    // ─── Layer 3: Final allergen sweep ───────────────────
    // ตรวจสอบสารก่อภูมิแพ้จากโครงสร้างข้อมูลอีกครั้ง
    if (
      userDoc &&
      Array.isArray(userDoc.allergies_v2) &&
      userDoc.allergies_v2.length > 0
    ) {
      const { checkFoodAllergensSync } = require("../utils/allergenChecker");

      const beforeCount = filteredFoods.length;

      filteredFoods = filteredFoods.filter(function (food) {
        const warning = checkFoodAllergensSync(food, userDoc);
        return !warning.has_allergen_warning;
      });

      console.log(
        "After Layer 3 allergen sweep:",
        filteredFoods.length,
        "(was",
        beforeCount,
        ")"
      );
    }

    // Hydrate alternate nutrition fields / ingredient-based nutrition before
    // ranking. Foods without usable calories cannot be sensibly recommended.
    filteredFoods = await Promise.all(filteredFoods.map(async (food) => {
      const nutrition = await getNutritionAsync(food);
      return {
        ...food,
        image: food.image || food.image_url || food.photo_url || "",
        nutrition_per_portion: nutrition,
      };
    }));
    filteredFoods = filteredFoods.filter((food) => getNutrition(food).kcal > 0);

    // หากไม่มีอาหารที่ผ่านเงื่อนไข ให้แจ้งผู้ใช้
    if (filteredFoods.length === 0) {
      return res.status(400).json({
        success: false,
        message: "ไม่พบอาหารที่เหมาะสม",
      });
    }

    const createdPlans = [];
    const foodUsageCounts = new Map();

    for (let i = 0; i < planDays; i++) {
      const date = addDays(start_date, i);
      const usedFoodsToday = new Set();

      // ==================================================
      // Smart food selection: pick foods closest to each
      // slot's target kcal to ensure 3 meals ≈ target_kcal
      // ==================================================

      const slots = mealSlots.map((slot, idx) => {
        const slotTargetKcal = Math.round(target_kcal * slot.ratio);

        const bestFood = pickDiverseFood(
          filteredFoods,
          slotTargetKcal,
          usedFoodsToday,
          foodUsageCounts
        );

        const nutrition = getNutrition(bestFood);

        // Calculate actual sum so far to adjust last slot
        const prevSlotsKcal = mealSlots
          .slice(0, idx)
          .reduce((sum, s) => {
            return sum + number(s.main_food?.nutrition_per_portion?.kcal ?? s.target_kcal ?? 0);
          }, 0);

        return {
          slot_name: slot.slot_name,
          meal_type: slot.meal_type,
          status: "pending",
          target_kcal: slotTargetKcal,
          target_nutrition: {
            protein_g: Math.round((protein_g || nutrition.protein_g * 3) * slot.ratio),
            carb_g: Math.round((carb_g || nutrition.carb_g * 3) * slot.ratio),
            fat_g: Math.round((fat_g || nutrition.fat_g * 3) * slot.ratio),
            fiber_g: Math.round((fiber_g || nutrition.fiber_g * 3) * slot.ratio),
            sodium_mg: Math.round((sodium_mg || nutrition.sodium_mg * 3) * slot.ratio),
          },
          main_food: mapFood(bestFood),
          addons: [],
          original_main_food_id: bestFood._id || null,
          current_main_food_id: bestFood._id || null,
          is_swapped: false,
          swap_history: [],
          // v2 fields
          portion_multiplier: 1.0,
          actual_weight_g: bestFood.portion?.gram || 0,
          custom_ingredients: [],
          calculated_nutrition: null,
        };
      });

      // ==================================================
      // Verify calorie fulfillment: sum of 3 meals
      // should be within ±5% of target_kcal
      // ==================================================

      const actualKcalSum = slots.reduce((sum, s) => sum + number(s.main_food?.nutrition_per_portion?.kcal ?? s.target_kcal ?? 0), 0);
      const fulfillmentPct = target_kcal > 0 ? (actualKcalSum / target_kcal) * 100 : 100;

      console.log(`📅 Day ${date}: target=${target_kcal} actual=${actualKcalSum} (${fulfillmentPct.toFixed(1)}%)`);

      // FIX: daily_target_summary ต้องใช้ค่าจาก user.health_goals (Single Source of Truth)
      // ห้ามใช้ adjustedTarget หรือ slots.reduce - ต้องตรงกับ Dashboard 100%

      const dailyPlan = await DailyPlan.create({
        plan_id: planId, plan_status: "active", user_id, date, plan_type: "daily",
        generated_by: "user", goal, meals_per_day: mealSlots.length, slots,
        daily_target_summary: {
          kcal: dailyTarget.kcal,
          protein_g: dailyTarget.protein_g,
          carb_g: dailyTarget.carb_g,
          fat_g: dailyTarget.fat_g,
        },
        // v2 fields
        daily_target: dailyTarget.daily_target,
        daily_summary: buildDailySummary(slots, dailyTarget.daily_target),
      });

      createdPlans.push(dailyPlan);
    }

    return res.json({ success: true, message: "สร้างแผนอาหารสำเร็จ", plan_id: planId, total_days: createdPlans.length, plans: createdPlans });
  } catch (error) {
    console.error("❌ Create Meal Plans Error:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถสร้างแผนอาหารได้", error: error.message });
  }
}

// ======================================================
// GET /api/meal/plans/:plan_id
// ======================================================

async function getPlansByPlanId(req, res) {
  try {
    const { plan_id } = req.params;
    if (!plan_id) return res.status(400).json({ success: false, message: "กรุณาระบุ plan_id" });
    const plans = await DailyPlan.find({ plan_id }).sort({ date: 1 }).lean();
    if (!plans.length) return res.status(404).json({ success: false, message: "ไม่พบแผนอาหาร", plan_id });

    return res.json({ success: true, plan_id, total_days: plans.length, plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: "ไม่สามารถโหลดแผนอาหารได้", error: error.message });
  }
}

// ======================================================
// GET /api/meal/user/:user_id  (Graceful: hasPlan=false)
// ======================================================

async function getPlansByUserId(req, res) {
  try {
    const { user_id } = req.params;
    if (!user_id) return res.status(400).json({ success: false, message: "กรุณาระบุ user_id" });

    const plans = await DailyPlan.find({ user_id, plan_status: "active" }).sort({ date: 1 }).lean();

    if (!plans.length) {
      return res.status(200).json({ success: true, hasPlan: false, plan: null, plans: [] });
    }

    return res.json({ success: true, hasPlan: true, plan_id: plans[0].plan_id, total_days: plans.length, plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: "ไม่สามารถโหลดแผนอาหารได้", error: error.message });
  }
}

// ======================================================
// DELETE /api/meal/plans/:plan_id
// ======================================================

async function deletePlanByPlanId(req, res) {
  try {
    const { plan_id } = req.params;
    console.log("🗑️ [BACKEND DELETE] plan_id from params:", plan_id);
    console.log("🗑️ [BACKEND DELETE] full URL:", req.originalUrl);

    if (!plan_id) {
      console.error("🗑️ [BACKEND DELETE] ERROR: no plan_id");
      return res.status(400).json({ success: false, message: "กรุณาระบุ plan_id" });
    }

    // Check if documents exist before deleting
    const existingCount = await DailyPlan.countDocuments({ plan_id });
    console.log("🗑️ [BACKEND DELETE] existing documents with plan_id:", existingCount);

    const result = await DailyPlan.deleteMany({ plan_id });
    console.log("🗑️ [BACKEND DELETE] deletedCount:", result.deletedCount);

    return res.json({ success: true, message: "ลบแผนอาหารสำเร็จ", plan_id, deleted_count: result.deletedCount });
  } catch (error) {
    console.error("🗑️ [BACKEND DELETE] ERROR:", error.message);
    return res.status(500).json({ success: false, message: "ไม่สามารถลบแผนอาหารได้", error: error.message });
  }
}

// ======================================================
// PUT /api/meal/plans/:planId/meal - Replace Meal
// ======================================================

async function replaceMealInPlan(req, res) {
  try {
    const { planId } = req.params;
    const { date, slot_index, food_id, status } = req.body;

    if (!planId) return res.status(400).json({ success: false, message: "กรุณาระบุ planId" });
    if (!date) return res.status(400).json({ success: false, message: "กรุณาระบุ date" });
    if (slot_index === undefined || slot_index === null) return res.status(400).json({ success: false, message: "กรุณาระบุ slot_index" });

    // ==================================================
    // Date validation for status-only updates
    // MUST be before DailyPlan query to reject non-today dates
    // ==================================================

    if (status && !food_id) {
      const validStatuses = ["pending", "eaten", "skipped", "cleared"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `status ต้องเป็น ${validStatuses.join(", ")}` });
      }

      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (date !== todayStr) {
        return res.status(400).json({ success: false, message: "สามารถบันทึกการกินได้เฉพาะวันที่ปัจจุบันเท่านั้น", date, today: todayStr });
      }
    }

    const dailyPlan = await DailyPlan.findOne({ plan_id: planId, date, plan_status: "active" });
    if (!dailyPlan) return res.status(404).json({ success: false, message: "ไม่พบแผนอาหารสำหรับวันที่ระบุ" });

    const idx = Number(slot_index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= dailyPlan.slots.length) {
      return res.status(400).json({ success: false, message: `slot_index ต้องอยู่ระหว่าง 0-${dailyPlan.slots.length - 1}` });
    }

    // ==================================================
    // Status-only update (eaten toggle)
    // When frontend sends { status } without food_id
    // ==================================================

    if (status && !food_id) {
      dailyPlan.slots[idx].status = status;
      await dailyPlan.save();
      return res.json({ success: true, message: "อัปเดตสถานะสำเร็จ", updated_plan: dailyPlan });
    }

    // ==================================================
    // Full meal replacement (requires food_id)
    // ==================================================

    if (!food_id) return res.status(400).json({ success: false, message: "กรุณาระบุ food_id" });

    const newFood = await MasterFood.findById(food_id).lean();
    if (!newFood) return res.status(404).json({ success: false, message: "ไม่พบอาหารที่ต้องการแทนที่" });

    const slot = dailyPlan.slots[idx];
    const nutrition = await getNutritionAsync(newFood);
    if (nutrition.kcal <= 0) {
      return res.status(400).json({
        success: false,
        message: "เมนูนี้ยังไม่มีข้อมูลแคลอรี่เพียงพอสำหรับใช้แทนมื้ออาหาร",
      });
    }
    const normalizedFood = {
      ...newFood,
      image: newFood.image || newFood.image_url || newFood.photo_url || "",
      nutrition_per_portion: nutrition,
    };

    dailyPlan.slots[idx] = {
      ...dailyPlan.slots[idx].toObject(),
      main_food: mapFood(normalizedFood),
      current_main_food_id: newFood._id,
      is_swapped: true,
      swap_history: [...(slot.swap_history || []), { from_food_id: slot.current_main_food_id, to_food_id: newFood._id, swapped_at: new Date().toISOString(), reason: "user_replace" }],
      target_nutrition: { protein_g: nutrition.protein_g, carb_g: nutrition.carb_g, fat_g: nutrition.fat_g, fiber_g: nutrition.fiber_g, sodium_mg: nutrition.sodium_mg },
    };

    await dailyPlan.save();
    return res.json({ success: true, message: "แทนที่มื้ออาหารสำเร็จ", updated_plan: dailyPlan });
  } catch (error) {
    return res.status(500).json({ success: false, message: "ไม่สามารถแทนที่มื้ออาหารได้", error: error.message });
  }
}

async function addMealAddon(req, res) {
  try {
    const { planId } = req.params;
    const { date, slot_index, food_id } = req.body;
    if (!planId || !date || slot_index === undefined || !food_id) {
      return res.status(400).json({ success: false, message: "กรุณาระบุ planId, date, slot_index และ food_id" });
    }

    const dailyPlan = await DailyPlan.findOne({ plan_id: planId, date, plan_status: "active" });
    if (!dailyPlan) return res.status(404).json({ success: false, message: "ไม่พบแผนอาหารสำหรับวันที่ระบุ" });

    const idx = Number(slot_index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= dailyPlan.slots.length) {
      return res.status(400).json({ success: false, message: "slot_index ไม่ถูกต้อง" });
    }

    const newFood = await MasterFood.findById(food_id).lean();
    if (!newFood) return res.status(404).json({ success: false, message: "ไม่พบเมนูที่ต้องการเพิ่ม" });

    const slot = dailyPlan.slots[idx];
    const foodId = String(newFood._id);
    const currentIds = [slot.main_food?.food_id, ...(slot.addons || []).map((food) => food.food_id)]
      .filter(Boolean).map(String);
    if (currentIds.includes(foodId)) {
      return res.status(409).json({ success: false, message: "เมนูนี้อยู่ในมื้อนี้แล้ว" });
    }

    const User = require("../models/User");
    const user = await User.findOne({ user_id: dailyPlan.user_id }).lean();
    if (user) {
      const { checkFoodAllergens } = require("../utils/allergenChecker");
      const warning = await checkFoodAllergens(newFood, user);
      if (warning.has_allergen_warning) {
        return res.status(400).json({ success: false, message: "เมนูนี้มีส่วนผสมที่ผู้ใช้แพ้", allergen_warning: warning });
      }
    }

    const nutrition = await getNutritionAsync(newFood);
    if (nutrition.kcal <= 0) {
      return res.status(400).json({ success: false, message: "เมนูนี้ยังไม่มีข้อมูลแคลอรี่" });
    }

    slot.addons = slot.addons || [];
    slot.addons.push(mapFood({
      ...newFood,
      image: newFood.image || newFood.image_url || newFood.images?.[0] || "",
      nutrition_per_portion: nutrition,
    }));
    await dailyPlan.save();
    return res.json({ success: true, message: "เพิ่มเมนูในมื้อสำเร็จ", updated_plan: dailyPlan });
  } catch (error) {
    console.error("Add Meal Addon Error:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถเพิ่มเมนูในมื้อได้", error: error.message });
  }
}

async function deleteMealAddon(req, res) {
  try {
    const { planId } = req.params;
    const { date, slot_index, food_id } = req.body;
    if (!planId || !date || slot_index === undefined || !food_id) {
      return res.status(400).json({ success: false, message: "กรุณาระบุ planId, date, slot_index และ food_id" });
    }

    const dailyPlan = await DailyPlan.findOne({ plan_id: planId, date, plan_status: "active" });
    if (!dailyPlan) return res.status(404).json({ success: false, message: "ไม่พบแผนอาหารสำหรับวันที่ระบุ" });

    const idx = Number(slot_index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= dailyPlan.slots.length) {
      return res.status(400).json({ success: false, message: "slot_index ไม่ถูกต้อง" });
    }

    const slot = dailyPlan.slots[idx];
    const addonIndex = (slot.addons || []).findIndex((food) => String(food.food_id) === String(food_id));
    if (addonIndex < 0) return res.status(404).json({ success: false, message: "ไม่พบเมนูเสริมในมื้อนี้" });

    slot.addons.splice(addonIndex, 1);
    await dailyPlan.save();
    return res.json({ success: true, message: "ลบเมนูเสริมแล้ว", updated_plan: dailyPlan });
  } catch (error) {
    console.error("Delete Meal Addon Error:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถลบเมนูเสริมได้", error: error.message });
  }
}

// ======================================================
// DELETE /api/meal/plans/:planId/meal/:mealId
// ======================================================

async function deleteMealFromPlan(req, res) {
  try {
    const { planId, mealId } = req.params;
    const { date } = req.query;

    if (!planId) return res.status(400).json({ success: false, message: "กรุณาระบุ planId" });
    if (!date) return res.status(400).json({ success: false, message: "กรุณาระบุ date (query)" });

    const dailyPlan = await DailyPlan.findOne({ plan_id: planId, date: String(date), plan_status: "active" });
    if (!dailyPlan) return res.status(404).json({ success: false, message: "ไม่พบแผนอาหารสำหรับวันที่ระบุ" });

    const idx = Number(mealId);
    if (!Number.isInteger(idx) || idx < 0 || idx >= dailyPlan.slots.length) {
      return res.status(400).json({ success: false, message: `mealId ต้องอยู่ระหว่าง 0-${dailyPlan.slots.length - 1}` });
    }

    dailyPlan.slots[idx] = { ...dailyPlan.slots[idx].toObject(), main_food: null, addons: [], current_main_food_id: null, status: "cleared" };
    await dailyPlan.save();

    return res.json({ success: true, message: "ลบมื้ออาหารสำเร็จ", updated_plan: dailyPlan });
  } catch (error) {
    return res.status(500).json({ success: false, message: "ไม่สามารถลบมื้ออาหารได้", error: error.message });
  }
}

// ======================================================
// GET /api/meal/safe-foods - Allergen-safe foods for swap modal
// ======================================================

async function getSafeFoods(req, res) {
  try {
    const {
      user_id,
      exclude_food_id,
      q = "",
      category = "",
      category_field = "category",
      category_label = "",
      limit = 20,
      target_kcal,
      kcal_tolerance = 50,
    } = req.query;
    const returnAll = String(limit).toLowerCase() === "all";
    const limitNum = returnAll ? null : Math.min(Math.max(Number(limit) || 20, 1), 50);
    const searchText = String(q).trim();
    const hasCalorieTarget =
      target_kcal !== undefined &&
      target_kcal !== "" &&
      Number.isFinite(Number(target_kcal)) &&
      Number(target_kcal) >= 0;
    const calorieTarget = hasCalorieTarget ? Number(target_kcal) : null;
    const calorieTolerance = Math.min(
      Math.max(Number(kcal_tolerance) || 0, 0),
      500
    );

    if (!user_id) {
      return res.status(400).json({ success: false, message: "กรุณาระบุ user_id" });
    }

    const userDoc = await User.findOne({ $or: [{ user_id }, { username: user_id }, { email: user_id }] }).lean();
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    const { checkFoodAllergensSync } = require("../utils/allergenChecker");
    const Ingredient = require("../models/Ingredient");

    // Build blacklist from allergies_v2
    const allergyV2Codes = [];
    const allergyNames = new Set();
    const v2IngredientIds = new Set();
    if (Array.isArray(userDoc.allergies_v2)) {
      userDoc.allergies_v2.forEach(function(a) {
        if (a.code) allergyV2Codes.push(String(a.code).toLowerCase());
        if (a.ingredient_id) v2IngredientIds.add(String(a.ingredient_id));
        if (a.label) allergyNames.add(String(a.label).trim().toLowerCase());
      });
    }
    // Include legacy categorized allergy data when the profile has not been migrated.
    if (userDoc.allergies && typeof userDoc.allergies === "object") {
      Object.values(userDoc.allergies).forEach((values) => {
        if (!Array.isArray(values)) return;
        values.forEach((label) => {
          const normalized = String(label || "").trim();
          if (!normalized) return;
          allergyNames.add(normalized.toLowerCase());
          allergyV2Codes.push(normalized.toLowerCase().replace(/\s+/g, "_"));
        });
      });
    }
    const hasUserAllergies =
      allergyV2Codes.length > 0 || allergyNames.size > 0 || v2IngredientIds.size > 0;

    // Also block disliked ingredients by ID
    if (Array.isArray(userDoc.disliked_ingredients_v2)) {
      userDoc.disliked_ingredients_v2.forEach(function(d) {
        if (d.ingredient_id) v2IngredientIds.add(String(d.ingredient_id));
      });
    }

    // Find ingredient IDs that match allergen codes
    if (allergyV2Codes.length > 0) {
      try {
        const matchingIngs = await Ingredient.find({
          $or: [
            { "allergens_hierarchy.specific_type": { $in: allergyV2Codes } },
            { "allergens_hierarchy.parent_category": { $in: allergyV2Codes } },
          ],
        }).select("_id").lean();
        matchingIngs.forEach(function(ing) { v2IngredientIds.add(String(ing._id)); });
      } catch (e) { /* skip */ }
    }

    // allergens_summary is an array of hierarchy objects in the current schema;
    // use the shared checker after fetching instead of comparing it to strings.
    let query = {};
    const conditions = [];
    if (searchText) {
      const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      conditions.push({
        $or: [
          { name: searchRegex },
          { name_en: searchRegex },
          { search_keywords: searchRegex },
        ],
      });
    }
    if (String(category).trim()) {
      const categoryField = ["category", "category_type", "category_type_label"].includes(String(category_field))
        ? String(category_field)
        : "category";
      const selectedCategory = String(category).trim();
      const categoryMatches = [
        { [categoryField]: selectedCategory },
        // Category data exists in several schema generations. Match the same
        // selected type across those fields so older MasterFood records remain selectable.
        { category: selectedCategory },
        { category_type: selectedCategory },
        { category_type_label: selectedCategory },
      ];
      if (String(category_label).trim()) {
        categoryMatches.push({ category_type_label: String(category_label).trim() });
      }
      conditions.push({ $or: categoryMatches });
    }
    if (conditions.length > 0) {
      query = { $and: conditions };
    }

    const foodsQuery = MasterFood.find(query).sort({ name: 1 });
    if (!returnAll) foodsQuery.limit(1000);
    let foods = await foodsQuery.lean();
    if (calorieTarget !== null) {
      foods = foods
        .map((food) => ({ food, nutrition: getNutrition(food) }))
        .filter((entry) => entry.nutrition.kcal > 0)
        .sort((a, b) =>
          Math.abs(a.nutrition.kcal - calorieTarget) - Math.abs(b.nutrition.kcal - calorieTarget) ||
          String(a.food.name || "").localeCompare(String(b.food.name || ""))
        )
        .map((entry) => entry.food);
    }

    // Build set of disliked ingredient names for name matching
    const dislikedNames = new Set();
    if (Array.isArray(userDoc.disliked_ingredients_v2)) {
      userDoc.disliked_ingredients_v2.forEach(function(d) {
        if (d.name) dislikedNames.add(d.name.toLowerCase());
      });
    }
    if (userDoc.disliked_foods) {
      Object.values(userDoc.disliked_foods).forEach(function(arr) {
        if (Array.isArray(arr)) arr.forEach(function(n) { dislikedNames.add(String(n).toLowerCase()); });
      });
    }

    // Ingredient-level filter (allergen IDs + disliked IDs + disliked names)
    if (v2IngredientIds.size > 0 || dislikedNames.size > 0 || allergyNames.size > 0) {
      foods = foods.filter(function(food) {
        const ings = food.ingredients || [];
        return !ings.some(function(ing) {
          if (ing.ingredient_id && v2IngredientIds.has(String(ing.ingredient_id))) return true;
          const name = String(ing.name_snap || ing.name || "").trim().toLowerCase();
          if (name && (dislikedNames.has(name) || allergyNames.has(name))) return true;
          return false;
        });
      });
    }

    // Exclude the current food
    if (exclude_food_id) {
      foods = foods.filter(function(f) { return String(f._id) !== String(exclude_food_id); });
    }

    // Final check with full allergen checker
    const foodIngredientIds = [...new Set(foods.flatMap((food) => (food.ingredients || []).map((ing) => ing.ingredient_id).filter(Boolean).map(String)))];
    const ingredientCache = {};
    if (foodIngredientIds.length) {
      const ingredientDocs = await Ingredient.find({ _id: { $in: foodIngredientIds } }).lean();
      ingredientDocs.forEach((doc) => { ingredientCache[String(doc._id)] = doc; });
    }
    const safeFoods = [];
    for (let i = 0; i < foods.length; i++) {
      const hasAllergenConflict = hasUserAllergies &&
        checkFoodAllergensSync(foods[i], userDoc, ingredientCache).has_allergen_warning;
      if (!hasAllergenConflict) {
        const nutrition = await getNutritionAsync(foods[i]);
        if (nutrition.kcal > 0) {
          safeFoods.push(mapFoodForResponse(foods[i], nutrition));
        }
      }
    }

    if (calorieTarget === null) {
      const limitedFoods = returnAll ? safeFoods : safeFoods.slice(0, limitNum);
      return res.json({
        success: true,
        count: limitedFoods.length,
        foods: limitedFoods,
        allergy_filters: [...new Set([...(userDoc.allergies_v2 || []).map((a) => a.label).filter(Boolean), ...[...(userDoc.allergies ? Object.values(userDoc.allergies) : [])].flat().filter(Boolean)])],
      });
    }

    const inRangeFoods = safeFoods.filter((food) => {
      const kcal = Number(food?.nutrition_per_portion?.kcal ?? food?.kcal ?? 0);
      return Math.abs(kcal - calorieTarget) <= calorieTolerance;
    });
    const hasRangeMatches = inRangeFoods.length > 0;
    const calorieFilteredFoods = hasRangeMatches ? inRangeFoods : safeFoods;
    const foodsToReturn = returnAll
      ? calorieFilteredFoods
      : calorieFilteredFoods.slice(0, limitNum);

    return res.json({
      success: true,
      count: foodsToReturn.length,
      foods: foodsToReturn,
      allergy_filters: [...new Set([...(userDoc.allergies_v2 || []).map((a) => a.label).filter(Boolean), ...[...(userDoc.allergies ? Object.values(userDoc.allergies) : [])].flat().filter(Boolean)])],
      calorie_filter: {
        target_kcal: calorieTarget,
        tolerance: calorieTolerance,
        has_matches: hasRangeMatches,
      },
    });
  } catch (error) {
    console.error("Get Safe Foods Error:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถดึงอาหารปลอดภัยได้", error: error.message });
  }
}

async function getFoodCategories(req, res) {
  try {
    const rows = await MasterFood.find({ is_active: { $ne: false } })
      .select("category category_type category_type_label")
      .lean();
    const thaiLabels = {
      single_dish: "จานเดียว", main_dish: "จานหลัก", side_dish: "เครื่องเคียง",
      drink: "เครื่องดื่ม", dessert: "ของหวาน", snack: "ของว่าง",
      fried: "ผัดทอด", stir_fried: "ผัดทอด", soup: "ต้มแกง", curry: "ต้มแกง",
    };
    const options = rows.map((row) => {
      const value = String(row.category_type || row.category || "").trim();
      if (!value) return null;
      const label = String(row.category_type_label || thaiLabels[value.toLowerCase()] || row.category || value).trim();
      return { field: row.category_type ? "category_type" : "category", value, label };
    }).filter(Boolean);
    const unique = [...new Map(options.map((item) => [`${item.field}:${item.value}`, item])).values()]
      .sort((a, b) => a.label.localeCompare(b.label, "th"));
    return res.json({ success: true, categories: unique });
  } catch (error) {
    console.error("Get Food Categories Error:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถโหลดหมวดหมู่อาหารได้", error: error.message });
  }
}

// ======================================================
// GET /api/meal/search-foods - Fuzzy Search (FIXED)
// ======================================================

async function searchFoods(req, res) {
  try {
    const { q = "", limit = 20, user_id } = req.query;
    const searchParam = q ? String(q).trim() : "";
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50);

    // Load user for allergen checking (if user_id provided)
    let userDoc = null;
    if (user_id) {
      userDoc = await User.findOne({ $or: [{ user_id }, { username: user_id }, { email: user_id }] }).lean();
    }

    const { checkFoodAllergensSync } = require("../utils/allergenChecker");

    // Build disliked ingredient names set for filtering
    const dislikedIngredientNames = new Set();
    if (userDoc) {
      if (Array.isArray(userDoc.disliked_ingredients_v2)) {
        userDoc.disliked_ingredients_v2.forEach(function(d) {
          if (d.name) dislikedIngredientNames.add(d.name.toLowerCase());
        });
      }
      if (userDoc.disliked_foods) {
        Object.values(userDoc.disliked_foods).forEach(function(arr) {
          if (Array.isArray(arr)) arr.forEach(function(n) { dislikedIngredientNames.add(String(n).toLowerCase()); });
        });
      }
    }

    // Helper: check if food contains any disliked ingredient
    function hasDislikedIngredient(food) {
      if (dislikedIngredientNames.size === 0) return false;
      const ings = food.ingredients || [];
      return ings.some(function(ing) {
        return ing.name && dislikedIngredientNames.has(ing.name.toLowerCase());
      });
    }

    // Empty query → return top foods
    if (!searchParam) {
      let allFoods = await MasterFood.find({}).sort({ _id: 1 }).limit(limitNum).lean();

      // If hide_allergen_meals, filter out allergen foods
      if (userDoc && userDoc.meal_settings && userDoc.meal_settings.hide_allergen_meals) {
        allFoods = allFoods.filter(function(f) {
          const w = checkFoodAllergensSync(f, userDoc);
          return !w.has_allergen_warning;
        });
      }

      // Filter out foods with disliked ingredients
      allFoods = allFoods.filter(function(f) { return !hasDislikedIngredient(f); });

      const results = allFoods.map(function(f) {
        const mapped = mapFoodForResponse(f);
        if (userDoc) mapped.allergen_warning = checkFoodAllergensSync(f, userDoc);
        return mapped;
      });
      return res.json({ success: true, query: "", count: results.length, foods: results });
    }

    const regexQuery = { $regex: searchParam, $options: "i" };
    let foods = await MasterFood.find({
      $or: [
        { name: regexQuery },
        { name_en: regexQuery },
        { category: regexQuery },
        { search_keywords: regexQuery },
        { tags: regexQuery },
      ],
    }).sort({ name: 1 }).limit(limitNum).lean();

    // If hide_allergen_meals, filter out allergen foods
    if (userDoc && userDoc.meal_settings && userDoc.meal_settings.hide_allergen_meals) {
      foods = foods.filter(function(f) {
        const w = checkFoodAllergensSync(f, userDoc);
        return !w.has_allergen_warning;
      });
    }

    // Filter out foods with disliked ingredients
    foods = foods.filter(function(f) { return !hasDislikedIngredient(f); });

    const results = foods.map(function(f) {
      const mapped = mapFoodForResponse(f, getNutrition(f));
      if (userDoc) mapped.allergen_warning = checkFoodAllergensSync(f, userDoc);
      return mapped;
    });
    return res.json({ success: true, query: searchParam, count: results.length, foods: results });
  } catch (error) {
    console.error("Search Foods Error:", error);
    return res.status(500).json({ success: false, message: "cannot search foods", error: error.message });
  }
}

function mapFoodForResponse(f, nutritionOverride) {
  const image = f.image || f.image_url || f.photo_url || f.thumbnail_url || f.images?.[0] || "";
  const nutrition = nutritionOverride || getNutrition(f);
  return {
    _id: f._id, name: f.name || "", name_en: f.name_en || "",
    category: f.category || "", image, image_url: image,
    nutrition_per_portion: nutrition,
    allergens: f.allergens || [], portion: f.portion || null,
    ingredients: f.ingredients || [],
    // v2 fields
    allergens_summary: f.allergens_summary || [],
    category_type: f.category_type || "",
    category_type_label: f.category_type_label || "",
    portion_reference: f.portion_reference || null,
  };
}
// Exports
// ======================================================

// ======================================================
// DELETE /api/meal/plans/:plan_id/day/:date
// ======================================================

async function deletePlanDay(req, res) {
  try {
    const { plan_id, date } = req.params;

    if (!plan_id) {
      return res.status(400).json({ success: false, message: "กรุณาระบุ plan_id" });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: "กรุณาระบุ date" });
    }

    const result = await DailyPlan.deleteMany({ plan_id, date });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลแผนอาหารสำหรับวันที่ระบุ", plan_id, date });
    }

    return res.json({ success: true, message: "ลบแผนอาหารวันนั้นสำเร็จ", plan_id, date, deleted_count: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: "ไม่สามารถลบแผนอาหารวันนั้นได้", error: error.message });
  }
}

// ======================================================
// getFoodById
// ======================================================

async function getFoodById(req, res) {
  try {
    const mongoose = require("mongoose");
    const { checkFoodAllergens } = require("../utils/allergenChecker");
    const food = await MasterFood.findById(req.params.food_id).lean();

    if (!food) {
      return res.status(404).json({ success: false, message: "ไม่พบอาหาร" });
    }

    // Populate ingredient names + build cache for allergen check
    const ingDocMap = {};
    if (food.ingredients && food.ingredients.length > 0) {
      const ingredientIds = food.ingredients.map((ing) => ing.ingredient_id).filter(Boolean);
      if (ingredientIds.length > 0) {
        const db = mongoose.connection.db;
        const ingredientDocs = await db.collection("Ingredients").find({ _id: { $in: ingredientIds } }).toArray();
        ingredientDocs.forEach((doc) => { ingDocMap[String(doc._id)] = doc; });

        food.ingredients = food.ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          name: ingDocMap[ing.ingredient_id]?.name || ing.name_snap || ing.ingredient_id || "-",
          qty: ing.qty,
          unit: ing.unit,
          weight_g: ing.weight_g,
        }));
      }
    }

    // Calculate allergen warning if user_id provided
    let allergen_warning = null;
    const { user_id } = req.query;
    if (user_id) {
      const userDoc = await User.findOne({ $or: [{ user_id }, { username: user_id }, { email: user_id }] }).lean();
      if (userDoc) {
        allergen_warning = await checkFoodAllergens(food, userDoc, ingDocMap);
      }
    }

    res.json({ success: true, food, allergen_warning });
  } catch (error) {
    res.status(500).json({ success: false, message: "ไม่สามารถโหลดรายละเอียดอาหารได้", error: error.message });
  }
}

module.exports = {
  createMealPlans,
  getPlansByPlanId,
  getPlansByUserId,
  deletePlanByPlanId,
  deletePlanDay,
  replaceMealInPlan,
  addMealAddon,
  deleteMealAddon,
  deleteMealFromPlan,
  searchFoods,
  getSafeFoods,
  getFoodCategories,
  getFoodById,
};
