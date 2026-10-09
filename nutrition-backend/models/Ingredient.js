const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    keywords: [String],

    // หมวดหมู่วัตถุดิบ
    category: String,
    category_group: String,
    category_group_label: String,
    sub_category: String,
    sub_category_label: String,

    // กลุ่มสารก่อภูมิแพ้
    allergens: {
      type: [String],
      default: [],
    },

    // ข้อมูลเพิ่มเติม
    default_unit: String,
    is_active: {
      type: Boolean,
      default: true,
    },
    updated_at: Date,
  },
  {
    collection: "Ingredients",
    versionKey: false,
  }
);

module.exports = mongoose.model("Ingredient", IngredientSchema);