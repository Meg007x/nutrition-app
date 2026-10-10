const mongoose = require("mongoose");

/* ======================================================
   Sub-schemas
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

const VitaminsSchema = new mongoose.Schema(
  {
    vitamin_a_mcg: { type: Number, default: 0 },
    vitamin_c_mg: { type: Number, default: 0 },
    vitamin_d_mcg: { type: Number, default: 0 },
    vitamin_e_mg: { type: Number, default: 0 },
    vitamin_k_mcg: { type: Number, default: 0 },
    thiamin_b1_mg: { type: Number, default: 0 },
    riboflavin_b2_mg: { type: Number, default: 0 },
    niacin_b3_mg: { type: Number, default: 0 },
    vitamin_b6_mg: { type: Number, default: 0 },
    folate_b9_mcg: { type: Number, default: 0 },
    vitamin_b12_mcg: { type: Number, default: 0 },
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
    sugar_g: { type: Number, default: 0 },
    saturated_fat_g: { type: Number, default: 0 },
    cholesterol_mg: { type: Number, default: 0 },
    potassium_mg: { type: Number, default: 0 },
    calcium_mg: { type: Number, default: 0 },
    iron_mg: { type: Number, default: 0 },
    vitamins: { type: VitaminsSchema, default: () => ({}) },
  },
  { _id: false }
);

/* ======================================================
   Main Schema
====================================================== */

const IngredientSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    usda_fdc_id: { type: Number, default: null },
    name: { type: String, default: "" },
    name_en: { type: String, default: "" },
    keywords: { type: [String], default: [] },

    category_group: { type: String, default: "" },
    category_group_label: { type: String, default: "" },
    sub_category: { type: String, default: "" },
    sub_category_label: { type: String, default: "" },

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

    is_active: { type: Boolean, default: true },
    source: { type: String, default: "System" },

    // legacy fields
    category: { type: String, default: "" },
    default_unit: { type: String, default: "g" },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: "Ingredients",
    versionKey: false,
  }
);

IngredientSchema.index({ usda_fdc_id: 1 }, { sparse: true });
IngredientSchema.index({ source: 1 });
IngredientSchema.index({ category_group: 1, sub_category: 1 });

module.exports = mongoose.model("Ingredient", IngredientSchema);