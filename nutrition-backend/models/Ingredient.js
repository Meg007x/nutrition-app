const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    category: String,
    keywords: [String],
  },
  {
    collection: "Ingredients",
    versionKey: false,
  }
);

module.exports = mongoose.model("Ingredient", IngredientSchema);