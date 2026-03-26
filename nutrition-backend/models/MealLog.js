const mongoose = require("mongoose");

const MealItemSchema = new mongoose.Schema(
  {
    item_id: { type: String, required: true },
    scan_session_id: { type: String, default: "" },
    source: { type: String, default: "scan" },

    food_id: { type: String, default: null },
    food_name: { type: String, required: true },
    food_name_en: { type: String, default: "" },
    category: { type: String, default: "" },
    image_uri: { type: String, default: "" },

    selected_portion: {
      display_text: { type: String, default: "" },
      gram: { type: Number, default: 0 },
      unit: { type: String, default: "" },
      multiplier: { type: Number, default: 1 },
    },

    nutrition: {
      kcal: { type: Number, default: 0 },
      protein_g: { type: Number, default: 0 },
      carb_g: { type: Number, default: 0 },
      fat_g: { type: Number, default: 0 },
      fiber_g: { type: Number, default: 0 },
      sodium_mg: { type: Number, default: 0 },
    },

    ingredients: [
      {
        ingredient_id: String,
        name: String,
        qty: Number,
        unit: String,
      },
    ],

    extra_ingredients: [
      {
        ingredient_id: String,
        name: String,
        qty: Number,
        unit: String,
      },
    ],

    logged_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MealLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },

    user_id: { type: String, required: true },
    date: { type: String, required: true },
    meal_type: { type: String, required: true },

    meal_key: { type: String, default: "" },
    meal_order: { type: Number, default: 0 },

    source_plan_id: { type: String, default: null },
    is_from_daily_plan: { type: Boolean, default: false },

    daily_targets: {
      kcal: { type: Number, default: 0 },
      protein_g: { type: Number, default: 0 },
      fat_g: { type: Number, default: 0 },
      carb_g: { type: Number, default: 0 },
    },

    meal_targets: {
      kcal: { type: Number, default: 0 },
      protein_g: { type: Number, default: 0 },
      fat_g: { type: Number, default: 0 },
      carb_g: { type: Number, default: 0 },
      fiber_g: { type: Number, default: 0 },
      sodium_mg: { type: Number, default: 0 },
    },

    totals: {
      kcal: { type: Number, default: 0 },
      protein_g: { type: Number, default: 0 },
      fat_g: { type: Number, default: 0 },
      carb_g: { type: Number, default: 0 },
      fiber_g: { type: Number, default: 0 },
      sodium_mg: { type: Number, default: 0 },
    },

    items: [MealItemSchema],

    scan_session_ids: [{ type: String }],

    status: { type: String, default: "completed" },
    note: { type: String, default: "" },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: "MealLogs",
    versionKey: false,
  }
);

module.exports = mongoose.model("MealLog", MealLogSchema);