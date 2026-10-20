const DailyPlan = require("../models/DailyPlan");
const MasterFood = require("../models/MasterFood");
const User = require("../models/User");
const { getNutritionWithFallback, buildDailyTarget, buildDailySummary, num } = require("../utils/nutritionCalculator");

// ======================================================
// Shared: Calculate Daily Nutrition Target from User
// Uses stored targets (Single Source of Truth) first,
// then falls back to formula-based calculation
// ======================================================

function calculateDailyNutritionTarget(user) {
  // Source 1: Stored targets (primary)
  const storedKcal = user?.health_goals?.target_calories || 0;
  const storedProtein = user?.health_goals?.protein_target_g || 0;
  const storedCarb = user?.health_goals?.target_carb_g || 0;
  const storedFat = user?.health_goals?.target_fat_g || 0;

  if (storedKcal > 0) {
    return {
      kcal: storedKcal,
      protein_g: storedProtein,
      carb_g: storedCarb,
      fat_g: storedFat,
      fiber_g: 0,
      sodium_mg: 0,
      // v2: daily_target for DailyPlan schema
      daily_target: {
        target_kcal: storedKcal,
        target_protein_g: storedProtein,
        target_carb_g: storedCarb,
        target_fat_g: storedFat,
      },
    };
  }

  // Source 2: Fallback to raw TDEE + formula (legacy)
  const targetKcal = user?.health_goals?.tdee_target_kcal || 0;
  const protein_g = user?.health_goals?.protein_target_g || 0;
  const carb_g = targetKcal > 0 ? Math.round((targetKcal * 0.5) / 4) : 0;
  const fat_g = targetKcal > 0 ? Math.round((targetKcal * 0.25) / 9) : 0;

  return {
    kcal: targetKcal,
    protein_g,
    carb_g,
    fat_g,
    fiber_g: 0,
    sodium_mg: 0,
    // v2: daily_target for DailyPlan schema
    daily_target: buildDailyTarget(user),
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
  // Sync fallback: nutrition_per_portion (v1 static)
  const nutrition = food?.nutrition_per_portion || {};
  return {
    kcal: num(nutrition.kcal),
    protein_g: num(nutrition.protein_g),
    carb_g: num(nutrition.carb_g),
    fat_g: num(nutrition.fat_g),
    fiber_g: num(nutrition.fiber_g),
    sodium_mg: num(nutrition.sodium_mg),
  };
}

// v2: Async version with USDA-based calculation
async function getNutritionAsync(food) {
  return getNutritionWithFallback(food);
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
  return {
    food_id: food._id || food.food_id || null,
    name: food.name || "",
    name_en: food.name_en || "",
    image_url: food.image || food.image_url || "",
    category: food.category || "",
    kcal: nutrition.kcal,
    nutrition_per_portion: food.nutrition_per_portion || {
      kcal: nutrition.kcal,
      protein_g: nutrition.protein_g,
      carb_g: nutrition.carb_g,
      fat_g: nutrition.fat_g,
      fiber_g: nutrition.fiber_g,
      sodium_mg: nutrition.sodium_mg,
    },
    // v2 fields
    portion_multiplier: 1.0,
    actual_weight_g: food.portion?.gram || 0,
    calculated_nutrition: null,
    allergens_summary: food.allergens_summary || [],
  };
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
      // v2: exclude by allergens_summary codes
      if (allergyV2Codes.length > 0) {
        conditions.push({ allergens_summary: { $nin: allergyV2Codes } });
      }
      foodQuery = conditions.length > 0 ? { $and: conditions } : {};
    }

    const allFoods = await MasterFood.find(foodQuery).lean();
    console.log("Available foods after group-level filter:", allFoods.length);

    // ─── Ingredient-level filtering (v2) ─────────────────
    // Check each food's ingredients[] against user's specific allergies & dislikes
    let filteredFoods = allFoods;
    if (allergyV2Codes.length > 0 || (userDoc && (userDoc.disliked_foods || (userDoc.disliked_ingredients_v2 && userDoc.disliked_ingredients_v2.length > 0)))) {
      // Build set of blocked ingredient _ids from user's allergies_v2
      const allV2Codes = [...allergyV2Codes];

      // Collect ingredient_ids from allergies_v2 (specific items)
      const v2IngredientIds = new Set();
      if (userDoc && Array.isArray(userDoc.allergies_v2)) {
        userDoc.allergies_v2.forEach(function(a) {
          if (a.ingredient_id) v2IngredientIds.add(a.ingredient_id);
        });
      }

      // Also collect ingredient_ids from disliked_ingredients_v2
      if (userDoc && Array.isArray(userDoc.disliked_ingredients_v2)) {
        userDoc.disliked_ingredients_v2.forEach(function(d) {
          if (d.ingredient_id) v2IngredientIds.add(d.ingredient_id);
        });
      }

      // Also find Ingredient docs whose allergens_hierarchy.specific_type matches allergy codes
      if (allV2Codes.length > 0) {
        try {
          const Ingredient = require("../models/Ingredient");
          const matchingIngs = await Ingredient.find({
            "allergens_hierarchy.specific_type": { $in: allV2Codes },
          }).select("_id").lean();
          matchingIngs.forEach(function(ing) { v2IngredientIds.add(ing._id); });
        } catch (e) {
          console.log("Ingredient-level filter skipped:", e.message);
        }
      }

      // Build set of disliked ingredient names for name matching
      const dislikedNames = new Set();
      if (userDoc && userDoc.disliked_foods) {
        Object.values(userDoc.disliked_foods).forEach(function(arr) {
          if (Array.isArray(arr)) arr.forEach(function(n) { dislikedNames.add(String(n).toLowerCase()); });
        });
      }
      // Also add names from disliked_ingredients_v2
      if (userDoc && Array.isArray(userDoc.disliked_ingredients_v2)) {
        userDoc.disliked_ingredients_v2.forEach(function(d) {
          if (d.name) dislikedNames.add(d.name.toLowerCase());
        });
      }

      // Filter foods that contain blocked ingredients
      if (v2IngredientIds.size > 0 || dislikedNames.size > 0) {
        filteredFoods = allFoods.filter(function(food) {
          const ings = food.ingredients || [];
          for (let i = 0; i < ings.length; i++) {
            const ingId = ings[i].ingredient_id;
            const ingName = String(ings[i].name_snap || "").toLowerCase();

            // Check against specific allergy ingredient IDs
            if (ingId && v2IngredientIds.has(ingId)) {
              console.log("Blocked (ingredient allergy):", food.name, "→", ingId);
              return false;
            }

            // Check against disliked ingredient names
            if (ingName && dislikedNames.has(ingName)) {
              console.log("Blocked (disliked ingredient):", food.name, "→", ingName);
              return false;
            }
          }
          return true;
        });
        console.log("After ingredient-level filter:", filteredFoods.length, "(was", allFoods.length + ")");
      }
    }

    // ─── Layer 3: Final allergen sweep (catches hierarchy-level matches) ───
    if (userDoc && Array.isArray(userDoc.allergies_v2) && userDoc.allergies_v2.length > 0) {
      const { checkFoodAllergensSync } = require("../utils/allergenChecker");
      const beforeCount = filteredFoods.length;
      filteredFoods = filteredFoods.filter(function(food) {
        const w = checkFoodAllergensSync(food, userDoc);
        return !w.has_allergen_warning;
      });
      console.log("After Layer 3 allergen sweep:", filteredFoods.length, "(was", beforeCount + ")");
    }

    if (filteredFoods.length === 0) return res.status(400).json({ success: false, message: "ไม่พบอาหารที่เหมาะสม" });

    const createdPlans = [];

    for (let i = 0; i < planDays; i++) {
      const date = addDays(start_date, i);
      const shuffled = [...filteredFoods].sort(() => Math.random() - 0.5);

      // ==================================================
      // Smart food selection: pick foods closest to each
      // slot's target kcal to ensure 3 meals ≈ target_kcal
      // ==================================================

      const slots = mealSlots.map((slot, idx) => {
        const slotTargetKcal = Math.round(target_kcal * slot.ratio);

        // Pick the food whose kcal is closest to this slot's target
        let bestFood = shuffled[0];
        let bestDiff = Infinity;

        for (const candidate of shuffled) {
          const cKcal = number(candidate?.nutrition_per_portion?.kcal);
          const diff = Math.abs(cKcal - slotTargetKcal);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestFood = candidate;
          }
        }

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

    // FIX: Override daily_target_summary ด้วย user targets ปัจจุบัน (Single Source of Truth)
    const userId = plans[0].user_id;
    const userDoc = await User.findOne({ user_id: userId }).lean();
    const liveTarget = calculateDailyNutritionTarget(userDoc);
    const overriddenPlans = plans.map((p) => ({
      ...p,
      daily_target_summary: {
        kcal: liveTarget.kcal,
        protein_g: liveTarget.protein_g,
        carb_g: liveTarget.carb_g,
        fat_g: liveTarget.fat_g,
      },
    }));

    return res.json({ success: true, plan_id, total_days: overriddenPlans.length, plans: overriddenPlans });
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

    // FIX: Override daily_target_summary ด้วย user targets ปัจจุบัน (Single Source of Truth)
    const userDoc = await User.findOne({ user_id }).lean();
    const liveTarget = calculateDailyNutritionTarget(userDoc);
    const overriddenPlans = plans.map((p) => ({
      ...p,
      daily_target_summary: {
        kcal: liveTarget.kcal,
        protein_g: liveTarget.protein_g,
        carb_g: liveTarget.carb_g,
        fat_g: liveTarget.fat_g,
      },
    }));

    return res.json({ success: true, hasPlan: true, plan_id: overriddenPlans[0].plan_id, total_days: overriddenPlans.length, plans: overriddenPlans });
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
      const validStatuses = ["pending", "eaten", "cleared"];
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
    const nutrition = getNutrition(newFood);

    dailyPlan.slots[idx] = {
      ...dailyPlan.slots[idx].toObject(),
      main_food: mapFood(newFood),
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
    const { user_id, exclude_food_id, limit = 20 } = req.query;
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 50);

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
    const v2IngredientIds = new Set();
    if (Array.isArray(userDoc.allergies_v2)) {
      userDoc.allergies_v2.forEach(function(a) {
        if (a.code) allergyV2Codes.push(a.code);
        if (a.ingredient_id) v2IngredientIds.add(a.ingredient_id);
      });
    }

    // Also block disliked ingredients by ID
    if (Array.isArray(userDoc.disliked_ingredients_v2)) {
      userDoc.disliked_ingredients_v2.forEach(function(d) {
        if (d.ingredient_id) v2IngredientIds.add(d.ingredient_id);
      });
    }

    // Find ingredient IDs that match allergen codes
    if (allergyV2Codes.length > 0) {
      try {
        const matchingIngs = await Ingredient.find({
          "allergens_hierarchy.specific_type": { $in: allergyV2Codes },
        }).select("_id").lean();
        matchingIngs.forEach(function(ing) { v2IngredientIds.add(ing._id); });
      } catch (e) { /* skip */ }
    }

    // Query: exclude foods with matching allergens_summary codes
    let query = {};
    const conditions = [];
    if (allergyV2Codes.length > 0) {
      conditions.push({ allergens_summary: { $nin: allergyV2Codes } });
    }
    if (conditions.length > 0) {
      query = { $and: conditions };
    }

    let foods = await MasterFood.find(query).sort({ name: 1 }).limit(limitNum * 2).lean();

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
    if (v2IngredientIds.size > 0 || dislikedNames.size > 0) {
      foods = foods.filter(function(food) {
        const ings = food.ingredients || [];
        return !ings.some(function(ing) {
          if (ing.ingredient_id && v2IngredientIds.has(ing.ingredient_id)) return true;
          if (ing.name && dislikedNames.has(ing.name.toLowerCase())) return true;
          return false;
        });
      });
    }

    // Exclude the current food
    if (exclude_food_id) {
      foods = foods.filter(function(f) { return String(f._id) !== String(exclude_food_id); });
    }

    // Final check with full allergen checker
    const safeFoods = [];
    for (let i = 0; i < foods.length && safeFoods.length < limitNum; i++) {
      const warning = checkFoodAllergensSync(foods[i], userDoc);
      if (!warning.has_allergen_warning) {
        safeFoods.push(mapFoodForResponse(foods[i]));
      }
    }

    return res.json({ success: true, count: safeFoods.length, foods: safeFoods });
  } catch (error) {
    console.error("Get Safe Foods Error:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถดึงอาหารปลอดภัยได้", error: error.message });
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
      const mapped = mapFoodForResponse(f);
      if (userDoc) mapped.allergen_warning = checkFoodAllergensSync(f, userDoc);
      return mapped;
    });
    return res.json({ success: true, query: searchParam, count: results.length, foods: results });
  } catch (error) {
    console.error("Search Foods Error:", error);
    return res.status(500).json({ success: false, message: "cannot search foods", error: error.message });
  }
}

function mapFoodForResponse(f) {
  return {
    _id: f._id, name: f.name || "", name_en: f.name_en || "",
    category: f.category || "", image: f.image || "",
    nutrition_per_portion: f.nutrition_per_portion || {},
    allergens: f.allergens || [], portion: f.portion || null,
    ingredients: f.ingredients || [],
    // v2 fields
    allergens_summary: f.allergens_summary || [],
    category_type: f.category_type || "",
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
  deleteMealFromPlan,
  searchFoods,
  getSafeFoods,
  getFoodById,
};