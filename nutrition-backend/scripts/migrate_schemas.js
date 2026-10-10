"use strict";

/**
 * migrate_schemas.js — Schema v2 Migration
 *
 * Usage: cd nutrition-backend && node scripts/migrate_schemas.js
 *
 * ข้อมูลเดิมไม่สูญหาย — ใช้ $set/$setOnInsert เฉพาะฟิลด์ใหม่
 */

const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

// Force public DNS to resolve MongoDB SRV (same workaround as config/db.js)
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

/* ======================================================
   Category inference for MasterFood
====================================================== */

function inferCategoryType(food) {
  var cat = String(food.category || "").toLowerCase();
  var name = String(food.name || "").toLowerCase();
  if (cat.includes("dessert") || cat.includes("หวาน") || name.includes("เค้ก") || name.includes("ไอศกรีม")) return { type: "dessert", label: "ของหวาน" };
  if (cat.includes("drink") || cat.includes("เครื่องดื่ม") || name.includes("น้ำ") || name.includes("กาแฟ")) return { type: "drink", label: "เครื่องดื่ม" };
  if (cat.includes("side") || cat.includes("appetizer")) return { type: "side_dish", label: "เครื่องเคียง" };
  if (cat.includes("soup") || cat.includes("ต้ม") || cat.includes("แกง")) return { type: "main_dish", label: "อาหารจานหลัก" };
  return { type: "single_dish", label: "จานเดี่ยว" };
}

var ALLERGEN_CODE_MAP = { milk: "dairy", egg: "dairy", fish: "seafood", shellfish: "shellfish", nuts: "tree_nuts", peanut: "peanut", soy: "soy", wheat: "gluten" };

/* ======================================================
   M1: Ingredients Migration
====================================================== */

async function migrateIngredients() {
  console.log("\n🔍 [M1] Migrating Ingredients...");
  var db = mongoose.connection.db;
  var cols = await db.listCollections({ name: "Ingredients" }).toArray();
  if (cols.length === 0) { console.log("   ⏭️  not found"); return { total: 0, updated: 0 }; }
  var col = db.collection("Ingredients");
  var count = await col.countDocuments();
  console.log("   📦 " + count + " documents");
  if (count === 0) return { total: 0, updated: 0 };

  var docs = await col.find({ $or: [{ serving_base: { $exists: false } }, { source: { $exists: false } }, { nutrition_per_100g: { $exists: false } }] }).toArray();
  console.log("   Phase 1: " + docs.length + " need new fields");

  if (docs.length > 0) {
    var ops = docs.map(function(doc) {
      return { updateOne: { filter: { _id: doc._id }, update: { $set: {
        allergens_hierarchy: doc.allergens_hierarchy || null,
        serving_base: doc.serving_base || { qty: 100, unit: "g" },
        nutrition_per_100g: doc.nutrition_per_100g || { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 },
        source: doc.source || "System",
        is_active: doc.is_active !== undefined ? doc.is_active : true,
        usda_fdc_id: doc.usda_fdc_id || null,
        updated_at: new Date()
      }, $setOnInsert: { created_at: doc.created_at || new Date() } } } };
    });
    var r = await col.bulkWrite(ops, { ordered: false });
    console.log("   Phase 1: matched=" + r.matchedCount + " modified=" + r.modifiedCount);
  }

  // Phase 2: Fix empty allergens_hierarchy objects → null
  var fixResult = await col.updateMany(
    { "allergens_hierarchy.parent_category": "" },
    { $set: { "allergens_hierarchy": null, updated_at: new Date() } }
  );
  console.log("   Phase 2: fixed empty allergens_hierarchy=" + fixResult.modifiedCount);

  return { total: count, updated: fixResult.modifiedCount };
}

/* ======================================================
   M2: MasterFood Migration
====================================================== */

async function migrateMasterFoods() {
  console.log("\n🔍 [M2] Migrating MasterFood...");
  var db = mongoose.connection.db;
  var cols = await db.listCollections({ name: "MasterFood" }).toArray();
  if (cols.length === 0) { console.log("   ⏭️  not found"); return { total: 0, updated: 0 }; }
  var col = db.collection("MasterFood");
  var count = await col.countDocuments();
  console.log("   📦 " + count + " documents");
  if (count === 0) return { total: 0, updated: 0 };

  var docs = await col.find({ $or: [{ category_type: { $exists: false } }, { portion_reference: { $exists: false } }, { "ingredients.name_snap": { $exists: false } }] }).toArray();
  console.log("   🔧 " + docs.length + " need migration");
  if (docs.length === 0) return { total: count, updated: 0 };

  var ops = [];
  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    var catType = inferCategoryType(doc);
    var portionRef = { total_weight_g: (doc.portion && doc.portion.gram) ? Number(doc.portion.gram) : 0, unit_label: (doc.portion && doc.portion.unit && doc.portion.gram) ? "1 " + doc.portion.unit + " (" + doc.portion.gram + " กรัม)" : "" };

    var newIngredients = [];
    if (Array.isArray(doc.ingredients)) {
      for (var j = 0; j < doc.ingredients.length; j++) {
        var ing = doc.ingredients[j];
        newIngredients.push({ ingredient_id: ing.ingredient_id || null, name_snap: ing.name_snap || "", weight_g: ing.weight_g || 0, qty: ing.qty || 0, unit: ing.unit || "" });
      }
    }

    var allergensSummary = [];
    if (Array.isArray(doc.allergens)) {
      for (var k = 0; k < doc.allergens.length; k++) {
        var a = doc.allergens[k];
        var code = ALLERGEN_CODE_MAP[String(a).toLowerCase()] || String(a).toLowerCase();
        if (allergensSummary.indexOf(code) === -1) allergensSummary.push(code);
      }
    }

    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: {
      category_type: doc.category_type || catType.type,
      category_type_label: doc.category_type_label || catType.label,
      portion_reference: doc.portion_reference || portionRef,
      ingredients: newIngredients,
      allergens_summary: allergensSummary,
      updated_at: new Date()
    }, $setOnInsert: { created_at: doc.created_at || new Date() } } } });
  }

  if (ops.length > 0) { var r = await col.bulkWrite(ops, { ordered: false }); console.log("   ✅ matched=" + r.matchedCount + " modified=" + r.modifiedCount); return { total: count, updated: r.modifiedCount }; }
  return { total: count, updated: 0 };
}

/* ======================================================
   M3: Users Migration
====================================================== */

async function migrateUsers() {
  console.log("M3: Migrating Users...");
  var db = mongoose.connection.db;
  var cols = await db.listCollections({ name: "Users" }).toArray();
  if (cols.length === 0) { console.log("   Users not found, skipping"); return { total: 0, updated: 0 }; }
  var col = db.collection("Users");
  var count = await col.countDocuments();
  console.log("   Found " + count + " users");
  if (count === 0) return { total: 0, updated: 0 };

  function buildAllergyV2(old) {
    var r = [];
    if (!old || typeof old !== "object") return r;
    ["veg", "condiment", "meat", "other"].forEach(function(cat) {
      if (!Array.isArray(old[cat])) return;
      old[cat].forEach(function(item) {
        var s = String(item || "").trim();
        if (s) r.push({ type: "specific", code: s.toLowerCase().replace(/\s+/g, "_"), label: s, ingredient_id: null });
      });
    });
    return r;
  }

  var docs = await col.find({ $or: [{ allergies_v2: { $exists: false } }, { current_streak: { $exists: false } }] }).toArray();
  console.log("   " + docs.length + " need migration");
  if (docs.length === 0) return { total: count, updated: 0 };

  var ops = docs.map(function(doc) {
    var av2 = (Array.isArray(doc.allergies_v2) && doc.allergies_v2.length > 0) ? doc.allergies_v2 : buildAllergyV2(doc.allergies);
    return { updateOne: { filter: { _id: doc._id }, update: { $set: { allergies_v2: av2, current_streak: doc.current_streak || 0, last_active_date: doc.last_active_date || "", updated_at: new Date() } } } };
  });

  if (ops.length > 0) { var r = await col.bulkWrite(ops, { ordered: false }); console.log("   Done: matched=" + r.matchedCount + " modified=" + r.modifiedCount); return { total: count, updated: r.modifiedCount }; }
  return { total: count, updated: 0 };
}

/* ======================================================
   M4: DailyPlans Migration
====================================================== */

async function migrateDailyPlans() {
  console.log("M4: Migrating DailyPlans...");
  var db = mongoose.connection.db;
  var cols = await db.listCollections({ name: "DailyPlans" }).toArray();
  if (cols.length === 0) { console.log("   DailyPlans not found, skipping"); return { total: 0, updated: 0 }; }
  var col = db.collection("DailyPlans");
  var count = await col.countDocuments();
  console.log("   Found " + count + " plans");
  if (count === 0) return { total: 0, updated: 0 };

  var docs = await col.find({ daily_target: { $exists: false } }).toArray();
  console.log("   " + docs.length + " need migration");
  if (docs.length === 0) return { total: count, updated: 0 };

  var BATCH = 200;
  var ops = [];
  var totalUpdated = 0;

  for (var i = 0; i < docs.length; i++) {
    var doc = docs[i];
    var ot = doc.daily_target_summary || {};
    var dt = { target_kcal: Number(ot.kcal || 0), target_protein_g: Number(ot.protein_g || 0), target_carb_g: Number(ot.carb_g || 0), target_fat_g: Number(ot.fat_g || 0) };

    var newSlots = [];
    if (Array.isArray(doc.slots)) {
      for (var j = 0; j < doc.slots.length; j++) {
        var s = doc.slots[j];
        newSlots.push(Object.assign({}, s, {
          portion_multiplier: s.portion_multiplier || 1.0,
          actual_weight_g: s.actual_weight_g || 0,
          custom_ingredients: s.custom_ingredients || [],
          calculated_nutrition: s.calculated_nutrition || null,
        }));
      }
    }

    var tk = 0, tp = 0, tc = 0, tf = 0, tfi = 0, ts = 0, ml = 0, mt = 0;
    for (var k = 0; k < doc.slots.length; k++) {
      var sl = doc.slots[k];
      mt++;
      if (sl.status === "eaten") {
        ml++;
        var n = sl.calculated_nutrition || (sl.main_food && sl.main_food.nutrition_per_portion) || {};
        tk += Number(n.kcal || 0); tp += Number(n.protein_g || 0); tc += Number(n.carb_g || 0);
        tf += Number(n.fat_g || 0); tfi += Number(n.fiber_g || 0); ts += Number(n.sodium_mg || 0);
      }
    }

    var ds = {
      total_kcal: Math.round(tk), total_protein_g: Math.round(tp), total_carb_g: Math.round(tc),
      total_fat_g: Math.round(tf), total_fiber_g: Math.round(tfi), total_sodium_mg: Math.round(ts),
      meals_logged: ml, meals_total: mt,
      adherence_pct: (dt.target_kcal > 0 && ml > 0) ? Math.round((tk / dt.target_kcal) * 100) : 0,
    };

    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { daily_target: dt, slots: newSlots, daily_summary: ds, updatedAt: new Date() } } } });

    if (ops.length >= BATCH) {
      var r = await col.bulkWrite(ops, { ordered: false });
      console.log("   Batch " + Math.ceil(i / BATCH) + ": matched=" + r.matchedCount);
      totalUpdated += r.modifiedCount;
      ops = [];
    }
  }

  if (ops.length > 0) {
    var r = await col.bulkWrite(ops, { ordered: false });
    console.log("   Final batch: matched=" + r.matchedCount + " modified=" + r.modifiedCount);
    totalUpdated += r.modifiedCount;
  }
  return { total: count, updated: totalUpdated || docs.length };
}

/* ======================================================
   Main Runner
====================================================== */

async function run() {
  console.log("=== Schema v2 Migration Script ===");

  var MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) { console.error("MONGODB_URI not set in .env"); process.exit(1); }
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000, socketTimeoutMS: 45000 });
  console.log("MongoDB connected");

  var results = {};
  try {
    results.ingredients = await migrateIngredients();
    results.masterFoods = await migrateMasterFoods();
    results.users = await migrateUsers();
    results.dailyPlans = await migrateDailyPlans();
  } catch (err) {
    console.error("Migration error: " + err.message);
    console.error(err.stack);
  }

  console.log("\n=== Migration Summary ===");
  Object.keys(results).forEach(function(key) {
    var r = results[key];
    console.log("   " + key + ": total=" + r.total + " updated=" + r.updated);
  });

  await mongoose.disconnect();
  console.log("Migration complete. Disconnected.");
  process.exit(0);
}

run().catch(function(err) { console.error("Fatal: " + err); process.exit(1); });