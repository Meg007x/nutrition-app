const mongoose = require("mongoose");

/* ======================================================
   Sub-schemas
====================================================== */

const NutritionSummarySchema = new mongoose.Schema(
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

const AllergenSummarySchema = new mongoose.Schema(
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
    sugar_g: { type: Number, default: 0 },
    saturated_fat_g: { type: Number, default: 0 },
    cholesterol_mg: { type: Number, default: 0 },
    potassium_mg: { type: Number, default: 0 },
    calcium_mg: { type: Number, default: 0 },
    iron_mg: { type: Number, default: 0 },
    vitamins: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

/* ======================================================
   MasterFood Schema — v2 (USDA-derived nutrition)
====================================================== */

const MasterFoodSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, default: "" },
    name_en: { type: String, default: "" },
    category: { type: String, default: "" },

    // ── 保留เดิม ──
    cuisine: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    is_recommended: { type: Boolean, default: false },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    has_image: { type: Boolean, default: false },
    search_keywords: { type: [String], default: [] },
    image_embedding: { type: [Number], default: [] },
    embedding_model: { type: String, default: "" },

    // ── nutrition_per_portion 保留ไว้เพื่อ backward compat ──
    // ในอนาคตจะเปลี่ยนไปใช้ calculated_nutrition จาก ingredients
    nutrition_per_portion: {
      type: NutritionSummarySchema,
      default: () => ({}),
    },
    nutrition_per_100g: {
      type: NutritionPer100gSchema,
      default: undefined,
    },

    // ── 保留เดิม ──
    portion: {
      unit: { type: String, default: "" },
      gram: { type: Number, default: 0 },
    },

    // ── ฟิลด์ใหม่ v2 ──
    category_type: { type: String, default: "" },       // e.g. "single_dish", "main_dish", "side_dish", "drink", "dessert"
    category_type_label: { type: String, default: "" },  // e.g. "จานเดี่ยว", "อาหารจานหลัก", "เครื่องเคียง", "เครื่องดื่ม", "ของหวาน"

    portion_reference: {
      total_weight_g: { type: Number, default: 0 },
      unit_label: { type: String, default: "" },  // e.g. "1 จาน (350 กรัม)"
    },

    // ── ingredients ปรับเป็น name_snap + weight_g ──
    ingredients: [
      {
        ingredient_id: { type: String, default: null },
        name: { type: String, default: "" },
        name_snap: { type: String, default: "" },  // snapshot ชื่อวัตถุดิบ ณ ขณะบันทึก
        weight_g: { type: Number, default: 0 },    // น้ำหนักจริง(กรัม) ในสูตร
        qty: { type: Number, default: 0 },         // เก็บเดิม backward compat
        unit: { type: String, default: "" },       // เก็บเดิม backward compat
      },
    ],

    // ── allergens 保留 + เพิ่ม summary ──
    allergens: { type: [String], default: [] },
    allergens_summary: { type: [AllergenSummarySchema], default: [] },
    disliked_tags: { type: [String], default: [] },
    food_code: { type: String, default: "" },
    source: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    collection: "MasterFood",
    versionKey: false,
  }
);

MasterFoodSchema.index({ category_type: 1 });
MasterFoodSchema.index({ "allergens_summary.parent_category": 1 });
MasterFoodSchema.index({ "allergens_summary.specific_type": 1 });

module.exports = mongoose.model("MasterFood", MasterFoodSchema);
