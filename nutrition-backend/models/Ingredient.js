const mongoose = require("mongoose");

/* ======================================================
   Sub-schemas (reusable & _id-free)
====================================================== */

const AllergenHierarchySchema = new mongoose.Schema(
  {
    parent_category: { type: String, default: "" },
    parent_label: { type: String, default: "" },
    specific_type: { type: String, default: "" },
    specific_label: { type: String, default: "" },
  },
  { _id: false }
);

const NutritionPer100gSchema = new mongoose.Schema(
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

/* ======================================================
   Main Ingredient Schema — v2 (USDA-compatible)
====================================================== */

const IngredientSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    keywords: { type: [String], default: [] },

    // ── ฟิลด์จาก migration เดิม (classify + hierarchy) ──
    category_group: { type: String, default: "" },
    category_group_label: { type: String, default: "" },
    sub_category: { type: String, default: "" },
    sub_category_label: { type: String, default: "" },
    default_unit: { type: String, default: "g" },

    // ── ฟิลด์ใหม่ v2 ──
    allergens_hierarchy: {
      type: AllergenHierarchySchema,
      default: () => ({}),
    },

    serving_base: {
      qty: { type: Number, default: 100 },
      unit: { type: String, default: "g" },
    },

    nutrition_per_100g: {
      type: NutritionPer100gSchema,
      default: () => ({}),
    },

    // "USDA FoodData Central" | "System"
    source: { type: String, default: "System" },

    // 保留 is_active 从 migration เดิม
    is_active: { type: Boolean, default: true },

    // ── USDA-specific ──
    usda_fdc_id: { type: Number, default: null },
  },
  {
    collection: "Ingredients",
    versionKey: false,
    strict: true,
  }
);

IngredientSchema.index({ usda_fdc_id: 1 }, { sparse: true });
IngredientSchema.index({ source: 1 });

module.exports = mongoose.model("Ingredient", IngredientSchema);