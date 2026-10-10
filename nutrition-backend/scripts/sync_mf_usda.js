var dns=require("dns");dns.setServers(["8.8.8.8","8.8.4.4","1.1.1.1"]);
require("dotenv").config({path:require("path").join(__dirname,"..",".env")});
var mongoose=require("mongoose");

// Direct mapping: system ingredient _id → USDA ingredient _id
var ID_MAP = {
  "ing_pasta":        "ing_usda_169751",
  "ing_olive_oil":    "ing_usda_171413",
  "ing_oil":          "ing_usda_171413",
  "ing_tomato":       "ing_usda_170456",
  "ing_garlic":       "ing_usda_171697",
  "ing_chicken":      "ing_usda_171077",
  "ing_chicken_breast":"ing_usda_171077",
  "ing_rice":         "ing_usda_169711",
  "ing_soy_sauce":    "ing_usda_172473",
  "ing_mushroom":     "ing_usda_169403",
  "ing_egg":          "ing_usda_171287",
  "ing_carrot":       "ing_usda_170393",
  "ing_onion":        "ing_usda_170000",
  "ing_yogurt":       "ing_usda_170903",
  "ing_banana":       "ing_usda_173944",
  "ing_strawberry":   "ing_usda_167762",
  "ing_lettuce":      "ing_usda_169249",
  "ing_cucumber":     "ing_usda_168409",
  "ing_broccoli":     "ing_usda_170379",
  "ing_cabbage":      "ing_usda_169975",
  "ing_bell_pepper":  null, // no USDA match
  "ing_salt":         null,
  "ing_basil":        null,
  "ing_chili":        null,
  "ing_lemongrass":   null,
  "ing_lime":         null,
};

async function run() {
  console.log("=== MasterFood → USDA Ingredient Sync ===\n");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  var db = mongoose.connection.db;

  var mfs = await db.collection("MasterFood").find({}).toArray();
  var totalUpdated = 0, totalLinked = 0, totalSlots = 0;

  for (var mi = 0; mi < mfs.length; mi++) {
    var mf = mfs[mi];
    if (!mf.ingredients || mf.ingredients.length === 0) continue;

    var newIngredients = [];
    var allergensSummary = [];
    var matchCount = 0;

    for (var ii = 0; ii < mf.ingredients.length; ii++) {
      var ing = mf.ingredients[ii];
      totalSlots++;
      var usdaId = ID_MAP[ing.ingredient_id] || null;

      if (usdaId) {
        matchCount++;
        totalLinked++;
        var usdaDoc = await db.collection("Ingredients").findOne({ _id: usdaId });
        if (usdaDoc) {
          if (usdaDoc.allergens_hierarchy && usdaDoc.allergens_hierarchy.specific_type) {
            var at = usdaDoc.allergens_hierarchy.specific_type;
            if (allergensSummary.indexOf(at) === -1) allergensSummary.push(at);
          }
          newIngredients.push({
            ingredient_id: usdaId,
            name_snap: usdaDoc.name,
            weight_g: ing.weight_g || ing.qty || 0,
            qty: ing.qty || 0,
            unit: ing.unit || "g",
          });
        }
      } else {
        // Keep original but set weight_g and name_snap
        newIngredients.push({
          ingredient_id: ing.ingredient_id,
          name_snap: ing.name_snap || ing.ingredient_id,
          weight_g: ing.weight_g || ing.qty || 0,
          qty: ing.qty || 0,
          unit: ing.unit || "g",
        });
      }
    }

    await db.collection("MasterFood").updateOne(
      { _id: mf._id },
      { $set: { ingredients: newIngredients, allergens_summary: allergensSummary.length > 0 ? allergensSummary : (mf.allergens_summary || []), updated_at: new Date() } }
    );
    totalUpdated++;
    console.log("  " + mf._id + ": " + matchCount + "/" + mf.ingredients.length + " linked, allergens: " + JSON.stringify(allergensSummary));
  }

  console.log("\n=== Summary ===");
  console.log("  MasterFoods updated: " + totalUpdated);
  console.log("  Ingredient slots: " + totalSlots + ", linked to USDA: " + totalLinked);
  console.log("  Coverage: " + Math.round(totalLinked / totalSlots * 100) + "%");

  await mongoose.disconnect();
  console.log("\nDone.");
  process.exit(0);
}

run().catch(function(e) { console.error("Fatal:", e.message); process.exit(1); });