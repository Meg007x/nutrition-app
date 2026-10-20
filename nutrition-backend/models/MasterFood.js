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
    search_keywords: { type: [String], default: [] },
    image_embedding: { type: [Number], default: [] },
    embedding_model: { type: String, default: "" },

    // ── nutrition_per_portion 保留ไว้เพื่อ backward compat ──
    // ในอนาคตจะเปลี่ยนไปใช้ calculated_nutrition จาก ingredients
    nutrition_per_portion: {
      type: NutritionSummarySchema,
      default: () => ({}),
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
        name_snap: { type: String, default: "" },  // snapshot ชื่อวัตถุดิบ ณ ขณะบันทึก
        weight_g: { type: Number, default: 0 },    // น้ำหนักจริง(กรัม) ในสูตร
        qty: { type: Number, default: 0 },         // เก็บเดิม backward compat
        unit: { type: String, default: "" },       // เก็บเดิม backward compat
      },
    ],

    // ── allergens 保留 + เพิ่ม summary ──
    allergens: { type: [String], default: [] },
    allergens_summary: { type: [String], default: [] }, // Array of allergen codes รวม
  },
  {
    collection: "MasterFood",
    versionKey: false,
  }
);

MasterFoodSchema.index({ category_type: 1 });
MasterFoodSchema.index({ "allergens_summary": 1 });

module.exports = mongoose.model("MasterFood", MasterFoodSchema);