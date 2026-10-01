const mongoose = require("mongoose");
require("dotenv").config();


function inferDefaultUnit(name = "", oldCategory = "") {
  const n = String(name).trim();

  const pieceItems = ["ไข่ไก่", "ไข่เป็ด"];
  if (pieceItems.includes(n)) return "ฟอง";

  const mlItems = [
    "ครีมซอส",
    "น้ำมันมะกอก",
    "นมข้นหวาน",
    "วิปปิ้งครีม",
    "โยเกิร์ต",
    "น้ำเชื่อมคาราเมล",
    "น้ำผึ้ง",
  ];
  if (mlItems.includes(n)) return "ml";

  if (oldCategory === "seasoning") return "g";
  if (oldCategory === "sweet") return "g";
  if (oldCategory === "bread") return "g";
  if (oldCategory === "dairy") return "g";
  if (oldCategory === "egg_cheese") return "g";
  if (oldCategory === "meat") return "g";
  if (oldCategory === "seafood") return "g";
  if (oldCategory === "nuts") return "g";
  if (oldCategory === "veg" || oldCategory === "veg_fruit") return "g";

  return "g";
}

function classifyIngredient(doc) {
  const name = String(doc.name || "").trim();
  const category = String(doc.category || "").trim().toLowerCase();

  // กลุ่มผักและผลไม้
  if (category === "veg") {
    const herbNames = ["ใบโหระพา", "พาร์สลีย์"];
    if (herbNames.includes(name)) {
      return {
        category_group: "veg_group",
        category_group_label: "ผักและผลไม้",
        sub_category: "herb",
        sub_category_label: "สมุนไพร",
      };
    }

    return {
      category_group: "veg_group",
      category_group_label: "ผักและผลไม้",
      sub_category: "vegetable",
      sub_category_label: "ผัก",
    };
  }

  if (category === "veg_fruit") {
    const fruitNames = ["กล้วยหอม", "แอปเปิล"];
    if (fruitNames.includes(name)) {
      return {
        category_group: "veg_group",
        category_group_label: "ผักและผลไม้",
        sub_category: "fruit",
        sub_category_label: "ผลไม้",
      };
    }

    return {
      category_group: "veg_group",
      category_group_label: "ผักและผลไม้",
      sub_category: "vegetable",
      sub_category_label: "ผัก",
    };
  }

  // กลุ่มเครื่องปรุง/ส่วนผสม
  if (category === "seasoning") {
    const sauceNames = ["ครีมซอส"];
    const flourNames = ["เส้นพาสต้า", "แป้งพิซซ่า"];

    if (sauceNames.includes(name)) {
      return {
        category_group: "seasoning_group",
        category_group_label: "เครื่องปรุง/ส่วนผสม",
        sub_category: "sauce",
        sub_category_label: "ซอส",
      };
    }

    if (flourNames.includes(name)) {
      return {
        category_group: "seasoning_group",
        category_group_label: "เครื่องปรุง/ส่วนผสม",
        sub_category: "bread_flour",
        sub_category_label: "ขนมปังและแป้ง",
      };
    }

    return {
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "seasoning",
      sub_category_label: "เครื่องปรุง",
    };
  }

  if (category === "dairy") {
    return {
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "dairy",
      sub_category_label: "นมและผลิตภัณฑ์นม",
    };
  }

  if (category === "egg_cheese") {
    return {
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "egg_cheese",
      sub_category_label: "ไข่และชีส",
    };
  }

  if (category === "bread") {
    return {
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "bread_flour",
      sub_category_label: "ขนมปังและแป้ง",
    };
  }

  if (category === "sweet") {
    return {
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "sweetener",
      sub_category_label: "ของหวานและน้ำตาล",
    };
  }

  if (category === "other") {
    const cheeseLike = ["ชีส"];
    if (cheeseLike.includes(name)) {
      return {
        category_group: "seasoning_group",
        category_group_label: "เครื่องปรุง/ส่วนผสม",
        sub_category: "egg_cheese",
        sub_category_label: "ไข่และชีส",
      };
    }

    return {
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "other",
      sub_category_label: "อื่น ๆ",
    };
  }

  // กลุ่มโปรตีน
  if (category === "meat") {
    return {
      category_group: "protein_group",
      category_group_label: "เนื้อสัตว์และโปรตีน",
      sub_category: "meat",
      sub_category_label: "เนื้อสัตว์",
    };
  }

  if (category === "seafood") {
    return {
      category_group: "protein_group",
      category_group_label: "เนื้อสัตว์และโปรตีน",
      sub_category: "seafood",
      sub_category_label: "อาหารทะเล",
    };
  }

  if (category === "nuts") {
    return {
      category_group: "protein_group",
      category_group_label: "เนื้อสัตว์และโปรตีน",
      sub_category: "nuts_seeds",
      sub_category_label: "ถั่วและเมล็ดพืช",
    };
  }

  // fallback
  return {
    category_group: "seasoning_group",
    category_group_label: "เครื่องปรุง/ส่วนผสม",
    sub_category: "other",
    sub_category_label: "อื่น ๆ",
  };
}

async function run() {
  await connectDB();
  console.log("✅ MongoDB connected");

  const db = mongoose.connection.db;
  const collection = db.collection("Ingredients");

  const docs = await collection.find({}).toArray();
  console.log(`📦 found ${docs.length} ingredients`);

  const operations = docs.map((doc) => {
    const groupInfo = classifyIngredient(doc);
    const default_unit = inferDefaultUnit(doc.name, doc.category);

    return {
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            category_group: groupInfo.category_group,
            category_group_label: groupInfo.category_group_label,
            sub_category: groupInfo.sub_category,
            sub_category_label: groupInfo.sub_category_label,
            default_unit,
            is_active: true,
            updated_at: new Date(),
          },
        },
      },
    };
  });

  if (operations.length > 0) {
    const result = await collection.bulkWrite(operations);
    console.log("✅ bulkWrite success");
    console.log(result);
  }

  const sample = await collection
    .find({})
    .project({
      _id: 1,
      name: 1,
      category: 1,
      category_group: 1,
      sub_category: 1,
      default_unit: 1,
    })
    .limit(10)
    .toArray();

  console.log("🔎 sample result:");
  console.table(sample);

  await disconnectDB();
  console.log("✅ done");
}

run().catch((err) => {
  console.error("❌ migration failed:", err);
  process.exit(1);
});