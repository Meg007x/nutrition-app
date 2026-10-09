const mongoose = require("mongoose");

/* ======================================================
   DailyPlan Schema — v2 (gram-based, dynamic nutrition)
====================================================== */

// Nutrition per portion (retained for backward compat)
const NutritionSchema = new mongoose.Schema(
  {
    kcal: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carb_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
  },
  { _id: false }
);

// Food Schema (embedded in slot)
const FoodSchema = new mongoose.Schema(
  {
    food_id: { type: String, default: null },
    name: { type: String, default: "" },
    name_en: { type: String, default: "" },
    image_url: { type: String, default: "" },
    category: { type: String, default: "" },
    kcal: { type: Number, default: 0 },
    nutrition_per_portion: {
      type: NutritionSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

// Target Nutrition for a slot
const TargetNutritionSchema = new mongoose.Schema(
  {
    protein_g: { type: Number, default: 0 },
    carb_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── v2: Custom ingredient override ──
const CustomIngredientSchema = new mongoose.Schema(
  {
    ingredient_id: { type: String, default: "" },
    weight_g: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { _id: false }
);

// Meal Slot
const SlotSchema = new mongoose.Schema(
  {
    slot_name: { type: String, default: "" },
    meal_type: { type: String, default: "" },
    status: { type: String, default: "pending" },
    target_kcal: { type: Number, default: 0 },
    target_nutrition: {
      type: TargetNutritionSchema,
      default: () => ({}),
    },
    main_food: {
      type: FoodSchema,
      default: null,
    },
    addons: { type: [FoodSchema], default: [] },
    original_main_food_id: { type: String, default: null },
    current_main_food_id: { type: String, default: null },
    is_swapped: { type: Boolean, default: false },
    swap_history: { type: Array, default: [] },

    // ── ฟิลด์ใหม่ v2 ──
    portion_multiplier: { type: Number, default: 1.0 },   // e.g. 1.5x the base portion
    actual_weight_g: { type: Number, default: 0 },        // real gram weight served
    custom_ingredients: { type: [CustomIngredientSchema], default: [] },  // per-meal ingredient overrides

    // nutrition ที่คำนวณสดจาก ingredients (ณ วันที่ save)
    calculated_nutrition: {
      type: NutritionSchema,
      default: null,
    },
  },
  { _id: false }
);

// Daily target (original)
const DailyTargetSchema = new mongoose.Schema(
  {
    kcal: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carb_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── v2: daily_target (simplified) ──
const PlanDailyTargetSchema = new mongoose.Schema(
  {
    target_kcal: { type: Number, default: 0 },
    target_protein_g: { type: Number, default: 0 },
    target_carb_g: { type: Number, default: 0 },
    target_fat_g: { type: Number, default: 0 },
  },
  { _id: false }
);

// ── v2: daily summary (computed after all meals logged) ──
const DailySummarySchema = new mongoose.Schema(
  {
    total_kcal: { type: Number, default: 0 },
    total_protein_g: { type: Number, default: 0 },
    total_carb_g: { type: Number, default: 0 },
    total_fat_g: { type: Number, default: 0 },
    total_fiber_g: { type: Number, default: 0 },
    total_sodium_mg: { type: Number, default: 0 },
    meals_logged: { type: Number, default: 0 },
    meals_total: { type: Number, default: 0 },
    adherence_pct: { type: Number, default: 0 }, // kcal adherence %
  },
  { _id: false }
);

// Daily Plan — main document
const DailyPlanSchema = new mongoose.Schema(
  {
    plan_id: { type: String, required: true, index: true },
    plan_status: { type: String, default: "active" },
    user_id: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    plan_type: { type: String, default: "daily" },
    generated_by: { type: String, default: "ai" },
    goal: { type: String, default: "" },
    meals_per_day: { type: Number, default: 3 },
    slots: { type: [SlotSchema], default: [] },
    daily_target_summary: {
      type: DailyTargetSchema,
      default: () => ({}),
    },

    // ── ฟิลด์ใหม่ v2 ──
    daily_target: {
      type: PlanDailyTargetSchema,
      default: null,
    },
    daily_summary: {
      type: DailySummarySchema,
      default: null,
    },
  },
  { timestamps: true, collection: "DailyPlans" }
);

DailyPlanSchema.index({ plan_id: 1, date: 1 });
DailyPlanSchema.index({ user_id: 1, date: 1 });

module.exports = mongoose.model("DailyPlan", DailyPlanSchema);