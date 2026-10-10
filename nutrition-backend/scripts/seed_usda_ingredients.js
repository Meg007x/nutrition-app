"use strict";
var dns = require("dns");
dns.setServers(["8.8.8.8","8.8.4.4","1.1.1.1"]);
require("dotenv").config({ path: require("path").join(__dirname,"..",".env") });
var mongoose = require("mongoose");
var usda = require("../services/usdaFetcher");

var ITEMS = [
  // Protein (7)
  { q: "Chicken, breast, raw",   l: "อกไก่" },
  { q: "Pork, loin, raw",        l: "หมูเนื้อแดง" },
  { q: "Beef, ground, raw",      l: "เนื้อบด" },
  { q: "Shrimp, raw",            l: "กุ้ง" },
  { q: "Salmon, raw",            l: "ปลาแซลมอน" },
  { q: "Egg, whole, raw",        l: "ไข่ไก่" },
  { q: "Tofu, raw",              l: "เต้าหู้" },
  // Vegetables (8)
  { q: "Broccoli, raw",          l: "บรอกโคลี" },
  { q: "Tomato, raw",            l: "มะเขือเทศ" },
  { q: "Carrot, raw",            l: "แครอท" },
  { q: "Spinach, raw",           l: "ผักโขม" },
  { q: "Onion, raw",             l: "หอมหัวใหญ่" },
  { q: "Cabbage, raw",           l: "กะหล่ำปลี" },
  { q: "Garlic, raw",            l: "กระเทียม" },
  { q: "Pumpkin, raw",           l: "ฟักทอง" },
  // Fruits (6)
  { q: "Banana, raw",            l: "กล้วยหอม" },
  { q: "Apple, raw",             l: "แอปเปิ้ล" },
  { q: "Orange, raw",            l: "ส้ม" },
  { q: "Strawberry, raw",        l: "สตรอว์เบอร์รี" },
  { q: "Avocado, raw",           l: "อะโวคาโด" },
  { q: "Pineapple, raw",         l: "สับปะรด" },
  // Carbs/Grains (7)
  { q: "Rice, white, cooked",    l: "ข้าวสวย" },
  { q: "Rice, brown, cooked",    l: "ข้าวกล้อง" },
  { q: "Pasta, cooked",          l: "เส้นพาสต้า" },
  { q: "Bread, whole wheat",     l: "ขนมปังโฮลวีต" },
  { q: "Oat",                    l: "ข้าวโอ๊ต" },
  { q: "Potato, raw",            l: "มันฝรั่ง" },
  { q: "Sweet potato, raw",      l: "มันหวาน" },
  // Nuts/Seeds (5)
  { q: "Walnut, raw",            l: "วอลนัท" },
  { q: "Almond, raw",            l: "อัลมอนด์" },
  { q: "Cashew, raw",            l: "เม็ดมะม่วงหิมพานต์" },
  { q: "Peanut, raw",            l: "ถั่วลิสง" },
  { q: "Sunflower seed, raw",    l: "เมล็ดทานตะวัน" },
  // Dairy/Fat (5)
  { q: "Milk, whole",            l: "นมสด" },
  { q: "Yogurt, plain",          l: "โยเกิร์ต" },
  { q: "Cheese, cheddar",        l: "ชีส" },
  { q: "Butter, unsalted",       l: "เนย" },
  { q: "Olive oil",              l: "น้ำมันมะกอก" },
  // Extra Asian (12)
  { q: "Chicken, thigh, raw",    l: "สะโพกไก่" },
  { q: "Fish, tilapia, raw",     l: "ปลานิล" },
  { q: "Mushroom, raw",          l: "เห็ด" },
  { q: "Corn, raw",              l: "ข้าวโพด" },
  { q: "Cucumber, raw",          l: "แตงกวา" },
  { q: "Lettuce, raw",           l: "ผักกาดหอม" },
  { q: "Mango, raw",             l: "มะม่วง" },
  { q: "Watermelon, raw",        l: "แตงโม" },
  { q: "Coconut, raw",           l: "มะพร้าว" },
  { q: "Soy sauce",              l: "ซอสถั่วเหลือง" },
  { q: "Honey",                  l: "น้ำผึ้ง" },
  { q: "Sugar, white",           l: "น้ำตาล" },
];

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function seedItem(db, item, idx) {
  try {
    var foods = await usda.searchFoods(item.q, "SR Legacy", 3);
    var best = null, bestN = 0;
    for (var i = 0; i < foods.length; i++) {
      var n = foods[i].foodNutrients ? foods[i].foodNutrients.length : 0;
      if (n > bestN) { bestN = n; best = foods[i]; }
    }
    if (!best || bestN === 0) {
      var ff = await usda.searchFoods(item.q, "Foundation", 3);
      for (var j = 0; j < ff.length; j++) {
        var fn = ff[j].foodNutrients ? ff[j].foodNutrients.length : 0;
        if (fn > bestN) { bestN = fn; best = ff[j]; }
      }
    }
    if (!best) return { i: idx, l: item.l, s: "SKIP", d: "not found" };

    var origDesc = best.description;
    best.description = item.l;
    var r = await usda.upsertIngredientFromUsda(db, best);
    best.description = origDesc;

    var saved = await db.collection("Ingredients").findOne({ _id: r._id });
    var kcal = saved && saved.nutrition_per_100g ? saved.nutrition_per_100g.kcal : 0;
    var vit = saved && saved.nutrition_per_100g && saved.nutrition_per_100g.vitamins;
    var hasV = vit && (vit.vitamin_c_mg > 0 || vit.vitamin_a_mcg > 0);
    var cat = saved ? (saved.category_group || "") + "/" + (saved.sub_category || "") : "";
    var al = saved && saved.allergens_hierarchy ? saved.allergens_hierarchy.specific_type : "";

    return { i: idx, l: item.l, fdc: best.fdcId, usda: origDesc, s: r.action, kcal: kcal, v: hasV, cat: cat, al: al };
  } catch (e) {
    return { i: idx, l: item.l, s: "ERROR", d: e.message };
  }
}

async function run() {
  console.log("=== USDA Ingredient Seed ===");
  console.log("Items:", ITEMS.length + "\n");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected\n");
  var db = mongoose.connection.db;

  var results = [], ok = 0, err = 0;
  var BS = 5;
  for (var b = 0; b < ITEMS.length; b += BS) {
    var batch = ITEMS.slice(b, b + BS);
    var bn = Math.floor(b / BS) + 1;
    var bt = Math.ceil(ITEMS.length / BS);
    console.log("Batch " + bn + "/" + bt + " (" + (b + 1) + "-" + Math.min(b + BS, ITEMS.length) + ")");

    var promises = batch.map(function(item, i) { return seedItem(db, item, b + i); });
    var br = await Promise.all(promises);

    for (var r = 0; r < br.length; r++) {
      var res = br[r];
      results.push(res);
      if (res.s === "ERROR") { err++; console.log("  [" + (res.i + 1) + "] ERR " + res.l + ": " + res.d); }
      else if (res.s === "SKIP") { console.log("  [" + (res.i + 1) + "] SKIP " + res.l); }
      else {
        ok++;
        console.log("  [" + (res.i + 1) + "] " + res.s.toUpperCase() + " " + res.l + " fdc:" + res.fdc + " kcal=" + res.kcal + " vit=" + res.v + " " + res.cat + (res.al ? " allergen:" + res.al : ""));
      }
    }
    if (b + BS < ITEMS.length) await sleep(500);
  }

  console.log("\n=== Summary ===");
  console.log("  Total:" + ITEMS.length + " OK:" + ok + " ERR:" + err);

  var totalDB = await db.collection("Ingredients").countDocuments({ source: "USDA FoodData Central" });
  var withNut = await db.collection("Ingredients").countDocuments({ source: "USDA FoodData Central", "nutrition_per_100g.kcal": { $gt: 0 } });
  var withVit = await db.collection("Ingredients").countDocuments({ source: "USDA FoodData Central", "nutrition_per_100g.vitamins.vitamin_c_mg": { $gt: 0 } });
  console.log("  DB USDA items:" + totalDB + " withNutrition:" + withNut + " withVitamins:" + withVit);

  var cats = await db.collection("Ingredients").aggregate([
    { $match: { source: "USDA FoodData Central" } },
    { $group: { _id: "$category_group", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  console.log("  Categories:");
  cats.forEach(function(c) { console.log("    " + (c._id || "?") + ": " + c.count); });

  await mongoose.disconnect();
  console.log("\nDone.");
  process.exit(err > 0 ? 1 : 0);
}

run().catch(function(e) { console.error("Fatal:", e.message); process.exit(1); });