const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); // อนุญาตให้หน้าจอแอปดึงข้อมูลได้
app.use(express.json());

// ลิงก์ที่เพื่อนให้มา (กุญแจ)
const dbURI = "mongodb+srv://nutrationproject_db_user:NS6ocxDkOw83oXiL@nutrationproject.9pjijzj.mongodb.net/?appName=NutrationProject";

console.log("⏳ กำลังพยายามเชื่อมต่อกับ MongoDB...");

mongoose.connect(dbURI)
  .then(() => console.log("✅ หลังบ้านเชื่อมต่อ MongoDB สำเร็จ!"))
  .catch(err => console.log("❌ ต่อไม่ติด:", err));

// สร้าง API สำหรับดึงข้อมูลตัวอย่างจากทุก Collection
app.get('/api/test-all', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = [
      'Users', 'NotificationSettings', 'DailyPlans', 'MealLogs', 
      'WaterLogs', 'WeeklyReports', 'MasterFood', 'ScanSessions', 
      'Knowledge', 'UnverifiedFood'
    ];

    let result = {};

    // วนลูปดึงข้อมูลอย่างละ 1 ชิ้นจากทุกแฟ้ม
    for (let colName of collections) {
      const data = await db.collection(colName).findOne({});
      result[colName] = data || "ยังไม่มีข้อมูลใน Collection นี้";
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 เซิร์ฟเวอร์ Backend พร้อมรันที่พอร์ต 3000");
});