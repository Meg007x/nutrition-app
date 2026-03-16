const mongoose = require("mongoose");

// ==========================================
// [ฟังก์ชันที่ 1] ดึงข้อมูลสำหรับหน้า 6-2 (แพ้อาหาร)
// ==========================================
const getIngredients = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // ดึงข้อมูลทั้งหมดจาก Collection Ingredients
    const ingredientsData = await db.collection("Ingredients").find({}).toArray();

    // จัดกลุ่ม (Group) ข้อมูลแยกตามหมวดหมู่
    const groupedData = {
      veg: ingredientsData.filter(item => item.category === "veg"),
      condiment: ingredientsData.filter(item => item.category === "condiment"),
      meat: ingredientsData.filter(item => item.category === "meat"),
      other: ingredientsData.filter(item => item.category === "other")
    };

    return res.status(200).json({
      message: "ดึงข้อมูลวัตถุดิบสำเร็จ",
      data: groupedData
    });

  } catch (error) {
    console.error("❌ Get Ingredients Error:", error);
    return res.status(500).json({ 
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลวัตถุดิบ", 
      error: error.message 
    });
  }
};

// ==========================================
// [ฟังก์ชันที่ 2] ดึงข้อมูลสำหรับหน้า 7 (อาหารที่ไม่ชอบ)
// ==========================================
const getDislikedFoods = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    // ดึงข้อมูลจาก Collection Ingredients ถังเดียวกันเลย!
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
      { id: "veg_fruit", name: "ผลไม้และผัก" }
    ];

    // จับคู่ข้อมูลจาก DB เข้าหมวดหมู่ของหน้า 7
    const groupedData = categories.map(cat => {
      return {
        id: cat.id,
        name: cat.name,
        foods: allFoods
          .filter(food => food.category === cat.id) // กรองเอาเฉพาะหมวดนั้นๆ
          .map(food => ({ id: food._id, name: food.name }))
      };
    });

    return res.status(200).json({
      message: "ดึงข้อมูลอาหารที่ไม่ชอบสำเร็จ",
      data: groupedData
    });

  } catch (error) {
    console.error("❌ Get Disliked Foods Error:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};

// ==========================================
// 🚀 สำคัญมาก: ส่งออกไปใช้งานทั้ง 2 ฟังก์ชัน
// ==========================================
module.exports = { 
  getIngredients, 
  getDislikedFoods // เพิ่มตัวนี้เข้ามา เพื่อให้ไฟล์ Route มองเห็น
};