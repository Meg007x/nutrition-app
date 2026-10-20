"use strict";
var dns = require("dns");
dns.setServers(["8.8.8.8","8.8.4.4","1.1.1.1"]);
require("dotenv").config({ path: require("path").join(__dirname,"..",".env") });
var mongoose = require("mongoose");
var R = [];
function p(t,d){R.push({t:t,s:"P"});console.log("  PASS: "+t+(d?" - "+d:""));}
function f(t,d){R.push({t:t,s:"F"});console.log("  FAIL: "+t+(d?" - "+d:""));}
async function run(){
  console.log("\n=== Dashboard Integration Test ===\n");
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000});
  console.log("Connected\n");
  var db = mongoose.connection.db;
  var ui;

  // T1
  console.log("--- T1: nutritionCalculator ---");
  try{
    var NC=require("../utils/nutritionCalculator");
    var z=NC.zeroNutrition();z.kcal===0?p("1a"):f("1a",JSON.stringify(z));
    ui=await db.collection("Ingredients").findOne({usda_fdc_id:{$ne:null},"nutrition_per_100g.kcal":{$gt:0}});
    if(ui){var r=await NC.calculateFromIngredients([{ingredient_id:ui._id,weight_g:150}]);
      r.kcal>0?p("1b: USDA",ui.name+"->"+r.kcal):f("1b","0");}
    var fb=await NC.getNutritionWithFallback({nutrition_per_portion:{kcal:350,protein_g:20}});
    fb.kcal===350?p("1c: fallback"):f("1c");
    var dt=NC.buildDailyTarget({health_goals:{tdee_target_kcal:2000,protein_target_g:120}});
    dt.target_kcal===2000?p("1d: target"):f("1d");
    var sl=[{status:"eaten",main_food:{nutrition_per_portion:{kcal:400,protein_g:25}},addons:[]},{status:"eaten",main_food:{nutrition_per_portion:{kcal:350}},addons:[]},{status:"pending",main_food:{nutrition_per_portion:{kcal:500}},addons:[]}];
    var ds=NC.buildDailySummary(sl,dt);
    ds.total_kcal===750?p("1e: summary kcal="+ds.total_kcal):f("1e");
  }catch(e){f("1",e.message);}

  // T2
  console.log("\n--- T2: v2 fields ---");
  var ti=await db.collection("Ingredients").countDocuments();
  var in_=await db.collection("Ingredients").countDocuments({"nutrition_per_100g.kcal":{$gt:0}});
  in_>0?p("2a: n100g",in_+"/"+ti):f("2a");
  var is=await db.collection("Ingredients").countDocuments({serving_base:{$exists:true}});
  is>0?p("2b: serving"):f("2b");
  var tm=await db.collection("MasterFood").countDocuments();
  var ma=await db.collection("MasterFood").countDocuments({allergens_summary:{$exists:true}});
  ma>0?p("2c: allergenSummary"):f("2c");
  var mc=await db.collection("MasterFood").countDocuments({category_type:{$exists:true,$ne:""}});
  mc>0?p("2d: catType"):f("2d");
  var tu=await db.collection("Users").countDocuments();
  var uv=await db.collection("Users").countDocuments({allergies_v2:{$exists:true}});
  uv>0?p("2e: allergiesV2",uv+"/"+tu):f("2e");
  var td=await db.collection("DailyPlans").countDocuments();
  var dtt=await db.collection("DailyPlans").countDocuments({daily_target:{$exists:true}});
  dtt>0?p("2f: dailyTarget",dtt+"/"+td):f("2f");
  var dss=await db.collection("DailyPlans").countDocuments({daily_summary:{$exists:true}});
  dss>0?p("2g: dailySummary"):f("2g");
  var pm=await db.collection("DailyPlans").countDocuments({"slots.portion_multiplier":{$exists:true}});
  pm>0?p("2h: portMult"):f("2h");

  // T3
  console.log("\n--- T3: Sample inspection ---");
  if(ui&&ui.nutrition_per_100g&&ui.nutrition_per_100g.kcal>0){
    console.log("  USDA: "+ui.name+" kcal="+ui.nutrition_per_100g.kcal);
    ui.nutrition_per_100g.kcal>0?p("3a: USDA real"):f("3a");}
  var sp=await db.collection("DailyPlans").findOne({daily_target:{$exists:true}});
  if(sp){
    console.log("  Plan: "+sp.plan_id+" daily_target="+JSON.stringify(sp.daily_target));
    p("3b: planTarget");
    if(sp.slots&&sp.slots[0]){
      console.log("  Slot0: mult="+sp.slots[0].portion_multiplier+" calcNut="+JSON.stringify(sp.slots[0].calculated_nutrition));
      sp.slots[0].portion_multiplier!==undefined?p("3c: slotV2"):f("3c");}}
  else{f("3b");}
  var su=await db.collection("Users").findOne({allergies_v2:{$exists:true}});
  if(su){console.log("  User: "+su.user_id+" v2="+JSON.stringify(su.allergies_v2));p("3d: userV2");}
  else{f("3d");}

  // T4
  console.log("\n--- T4: Dynamic vs Static ---");
  try{
    var calc=require("../utils/nutritionCalculator").calculateFromIngredients;
    var MF=require("../models/MasterFood");
    var fds=await MF.find({"ingredients.0":{$exists:true}}).lean();
    var found=false;
    for(var i=0;i<fds.length&&!found;i++){
      var fo=fds[i];var ids=fo.ingredients.map(function(x){return x.ingredient_id;}).filter(Boolean);
      if(!ids.length)continue;
      var ud=await db.collection("Ingredients").find({_id:{$in:ids},"nutrition_per_100g.kcal":{$gt:0}}).toArray();
      if(!ud.length)continue;
      var fa=fo.ingredients.map(function(x){return{ingredient_id:x.ingredient_id,weight_g:x.weight_g||x.qty||100};});
      var dyn=await calc(fa);
      console.log("  "+fo.name+": static="+(fo.nutrition_per_portion?fo.nutrition_per_portion.kcal:0)+" dynamic="+dyn.kcal);
      dyn.kcal>0?p("4: "+fo.name,dyn.kcal+"kcal"):f("4","zero");found=true;}
    if(!found)p("4: skipped","no USDA match");
  }catch(e){f("4",e.message);}

  // T5
  console.log("\n--- T5: Response structure ---");
  try{
    var User=require("../models/User");var u=await User.findOne({}).lean();
    if(u){var uf=["user_id","allergies","allergies_v2","health_goals","meal_settings","current_streak"];
      var um=uf.filter(function(k){return u[k]===undefined;});
      um.length===0?p("5a: User"):f("5a","miss:"+um.join(","));}
    var DP=require("../models/DailyPlan");var dpp=await DP.findOne({plan_id:{$exists:true}}).lean();
    if(dpp){var pf=["plan_id","slots","daily_target","daily_summary"];
      var pp=pf.filter(function(k){return dpp[k]===undefined;});
      pp.length===0?p("5b: DP"):f("5b","miss:"+pp.join(","));
      if(dpp.slots&&dpp.slots[0]){var sf=["portion_multiplier","actual_weight_g","custom_ingredients","calculated_nutrition"];
        var sm=sf.filter(function(k){return dpp.slots[0][k]===undefined;});
        sm.length===0?p("5c: Slot"):f("5c","miss:"+sm.join(","));}}
    var MFD=require("../models/MasterFood");var mf=await MFD.findOne({}).lean();
    if(mf){var ml=["category_type","allergens_summary","portion_reference"];
      var mm=ml.filter(function(k){return mf[k]===undefined;});
      mm.length===0?p("5d: MF"):f("5d","miss:"+mm.join(","));}
  }catch(e){f("5",e.message);}

  await mongoose.disconnect();
  console.log("\n=== Summary ===");
  var ps=R.filter(function(r){return r.s==="P";}).length;
  var fl=R.filter(function(r){return r.s==="F";}).length;
  console.log("  Total:"+R.length+" PASS:"+ps+" FAIL:"+fl);
  if(fl>0)R.filter(function(r){return r.s==="F";}).forEach(function(r){console.log("  FAIL "+r.t);});
  console.log("\nDone.");process.exit(fl>0?1:0);
}
run().catch(function(e){console.error("Fatal:",e);process.exit(1);});