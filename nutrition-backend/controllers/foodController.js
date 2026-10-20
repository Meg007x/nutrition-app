const mongoose = require("mongoose");

// ==========================================
// [ฟังก์ชันที่ 1] ดึงข้อมูลวัตถุดิบทั้งหมด
// ใช้สำหรับหน้าเพิ่มส่วนผสม / dropdown / modal
// ==========================================
const getIngredients = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // ดึงเฉพาะรายการที่ยังเปิดใช้งาน และเรียงตามหมวดหลัก > หมวดย่อย > ชื่อ
    const ingredientsData = await db
      .collection("Ingredients")
      .find({
        $or: [{ is_active: true }, { is_active: { $exists: false } }],
      })
      .sort({
        category_group: 1,
        sub_category: 1,
        name: 1,
      })
      .toArray();

    // จัดกลุ่มข้อมูลตาม category_group สำหรับหน้า 6-2
    const grouped = { veg: [], condiment: [], meat: [], other: [] };
    ingredientsData.forEach((item) => {
      const group = String(item.category_group || "").toLowerCase();
      const formatted = { _id: item._id, name: item.name, category_group: item.category_group, sub_category: item.sub_category };
      if (group.includes("ผัก") || group.includes("ผลไม") || group === "veg" || group === "vegetable") {
        grouped.veg.push(formatted);
      } else if (group.includes("เครื่อง") || group.includes("ปรุง") || group === "condiment" || group === "seasoning") {
        grouped.condiment.push(formatted);
      } else if (group.includes("เนื้อ") || group.includes("สัตว") || group === "meat" || group === "protein") {
        grouped.meat.push(formatted);
      } else {
        grouped.other.push(formatted);
      }
    });

    return res.status(200).json({
      success: true,
      message: "ดึงข้อมูลวัตถุดิบสำเร็จ",
      count: ingredientsData.length,
      data: grouped,
    });
  } catch (error) {
    console.error("❌ Get Ingredients Error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ",
      error: error.message,
    });
  }
};

// ==========================================
// [ฟังก์ชันที่ 2] ดึงข้อมูลสำหรับหน้า 7 (อาหารที่ไม่ชอบ)
// Returns a 3-tier hierarchy:
//   Level 1: category_group_label (e.g. "อาหารทะเล")
//   Level 2: sub_category_label   (e.g. "สัตว์มีเปลือก")
//   Level 3: individual items     (e.g. "กุ้ง", "ปู")
// ==========================================
const getDislikedFoods = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // ดึงข้อมูลจาก Collection Ingredients ทั้งหมด
    const allIngredients = await db
      .collection("Ingredients")
      .find({ $or: [{ is_active: true }, { is_active: { $exists: false } }] })
      .sort({ category_group_label: 1, sub_category_label: 1, name: 1 })
      .toArray();

    // จัดกลุ่ม 3 ชั้น: category_group_label → sub_category_label → items
    const l1Map = new Map(); // category_group_label -> Map(sub_category_label -> [])

    allIngredients.forEach((item) => {
      const l1 = item.category_group_label || "อื่น ๆ";
      const l2 = item.sub_category_label || "ทั่วไป";

      if (!l1Map.has(l1)) l1Map.set(l1, new Map());
      const l2Map = l1Map.get(l1);

      if (!l2Map.has(l2)) l2Map.set(l2, []);
      l2Map.get(l2).push({ id: String(item._id), name: item.name });
    });

    // แปลงเป็น Array สำหรับ Frontend
    const tree = [];
    l1Map.forEach((l2Map, l1Name) => {
      const children = [];
      l2Map.forEach((items, l2Name) => {
        children.push({
          id: l2Name,
          name: l2Name,
          items: items,
        });
      });
      tree.push({
        id: l1Name,
        name: l1Name,
        subCategories: children,
      });
    });

    return res.status(200).json({
      success: true,
      message: "ดึงข้อมูลอาหารที่ไม่ชอบสำเร็จ",
      data: tree,
    });
  } catch (error) {
    console.error("❌ Get Disliked Foods Error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาด",
      error: error.message,
    });
  }
};

// ==========================================
// [ฟังก์ชันที่ 3] 3-Tier Hierarchy สำหรับหน้า 7
// Returns structured parent-child data:
//   Tier 1: Category (e.g. "อาหารทะเล")
//   Tier 2: Sub-category (e.g. "สัตว์มีเปลือก")
//   Tier 3: Individual Ingredients (e.g. "กุ้ง", "ปู")
// ==========================================
const getIngredientHierarchy = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // ดึงข้อมูล active ingredients ทั้งหมด เรียงตาม category > sub_category > name
    const allIngredients = await db
      .collection("Ingredients")
      .find({
        $or: [{ is_active: true }, { is_active: { $exists: false } }],
      })
      .sort({ category_group_label: 1, sub_category_label: 1, name: 1 })
      .toArray();

    // จัดกลุ่ม 3 ชั้น: Tier1 -> Tier2 -> Tier3
    const tier1Map = new Map();

    allIngredients.forEach((item) => {
      const t1 = item.category_group_label || "อื่นๆ";
      const t2 = item.sub_category_label || "ทั่วไป";
      const t3 = { id: String(item._id), name: item.name };

      if (!tier1Map.has(t1)) tier1Map.set(t1, new Map());
      const tier2Map = tier1Map.get(t1);

      if (!tier2Map.has(t2)) tier2Map.set(t2, []);
      tier2Map.get(t2).push(t3);
    });

    // แปลงเป็น Array สำหรับ Frontend
    const tree = [];
    tier1Map.forEach((tier2Map, t1Name) => {
      const subCategories = [];
      tier2Map.forEach((items, t2Name) => {
        subCategories.push({
          id: t2Name,
          name: t2Name,
          items: items,
        });
      });
      tree.push({
        id: t1Name,
        name: t1Name,
        subCategories: subCategories,
      });
    });

    return res.status(200).json({
      success: true,
      message: "ดึงข้อมูล hierarchy สำเร็จ",
      data: tree,
    });
  } catch (error) {
    console.error("❌ Get Ingredient Hierarchy Error:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาด",
      error: error.message,
    });
  }
};

// ==========================================
// 🚀 ส่งออกไปใช้งาน
// ==========================================
module.exports = {
  getIngredients,
  getDislikedFoods,
  getIngredientHierarchy,
};