const mongoose = require("mongoose");

const ScanSessionSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    meal_type: { type: String, required: true },

    food_id: { type: String, required: true },
    food_name: { type: String, required: true },
    food_name_en: { type: String, default: "" },
    source: { type: String, default: "database" },

    selected_portion: {
      mode: {
        type: String,
        enum: ["portion", "custom_gram"],
        required: true,
      },
      multiplier: { type: Number, default: 1 },
      gram: { type: Number, required: true },
      unit: { type: String, default: "plate" },
      base_gram: { type: Number, required: true },
      display_text: { type: String, default: "" },
    },

    nutrition: {
      kcal: { type: Number, default: 0 },
      protein_g: { type: Number, default: 0 },
      carb_g: { type: Number, default: 0 },
      fat_g: { type: Number, default: 0 },
      fiber_g: { type: Number, default: 0 },
      sodium_mg: { type: Number, default: 0 },
    },

    ingredients_from_master: [
      {
        ingredient_id: String,
        name: String,
        category: String,
        category_group: String,
        category_group_label: String,
        sub_category: String,
        sub_category_label: String,
        qty: Number,
        unit: String,
      },
    ],

    extra_ingredients: [
      {
        ingredient_id: String,
        name: String,
        category: String,
        category_group: String,
        category_group_label: String,
        sub_category: String,
        sub_category_label: String,
        qty: Number,
        unit: String,
      },
    ],

    image_uri: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: "ScanSessions",
    versionKey: false,
  }
);

module.exports = mongoose.model("ScanSession", ScanSessionSchema);