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
// ==========================================
const getDislikedFoods = async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // ดึงข้อมูลจาก Collection Ingredients ทั้งหมด
    const allFoods = await db.collection("Ingredients").find({}).toArray();

    // กำหนดหมวดหมู่หลักสำหรับหน้า 7
    const categories = [
      { id: "nuts", name: "ถั่วเปลือกแข็ง" },
      { id: "dairy", name: "ผลิตภัณฑ์นม" },
      { id: "meat", name: "เนื้อสัตว์" },
      { id: "seafood", name: "ปลาและอาหารทะเล" },
      { id: "egg_cheese", name: "ไข่และชีส" },
      { id: "bread", name: "ขนมปัง" },
      { id: "sweet", name: "ขนมหวานและน้ำตาล" },
      { id: "veg_fruit", name: "ผลไม้และผัก" },
    ];

    // จับคู่ข้อมูลจาก DB เข้าหมวดหมู่ของหน้า 7
    const groupedData = categories.map((cat) => {
      return {
        id: cat.id,
        name: cat.name,
        foods: allFoods
          .filter((food) => food.category === cat.id)
          .map((food) => ({
            id: food._id,
            name: food.name,
          })),
      };
    });

    return res.status(200).json({
      success: true,
      message: "ดึงข้อมูลอาหารที่ไม่ชอบสำเร็จ",
      data: groupedData,
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
// 🚀 ส่งออกไปใช้งาน
// ==========================================
module.exports = {
  getIngredients,
  getDislikedFoods,
};