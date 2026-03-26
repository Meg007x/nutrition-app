const mongoose = require("mongoose");

const MasterFoodSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    name_en: String,
    category: String,
    cuisine: [String],
    tags: [String],
    is_recommended: Boolean,
    image: String,
    nutrition_per_portion: {
      kcal: Number,
      protein_g: Number,
      carb_g: Number,
      fat_g: Number,
      fiber_g: Number,
      sodium_mg: Number,
    },
    portion: {
      unit: String,
      gram: Number,
    },
    ingredients: [
      {
        ingredient_id: String,
        qty: Number,
        unit: String,
      },
    ],
    allergens: [String],
    search_keywords: [String],
    image_embedding: [Number],
    embedding_model: String,
  },
  {
    collection: "MasterFood",
    versionKey: false,
  }
);

module.exports = mongoose.model("MasterFood", MasterFoodSchema);