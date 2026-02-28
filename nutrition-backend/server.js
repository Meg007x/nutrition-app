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

// GET /api/dashboard/:userId
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0]; // ดึงวันที่วันนี้รูปแบบ "2026-02-27"

    const db = mongoose.connection.db;

    // 1. ดึงข้อมูลเป้าหมายผู้ใช้
    const user = await db.collection('Users').findOne({ user_id: userId });
    
    // 2. ดึงประวัติการกินของวันนี้ (เพื่อดูแคลอรี่ที่กินไปแล้ว)
    const mealLog = await db.collection('MealLogs').findOne({ user_id: userId, date: today });

    // 3. ดึงประวัติการดื่มน้ำของวันนี้
    const waterLog = await db.collection('WaterLogs').findOne({ user_id: userId, date: today });

    // 4. ดึงแผนการกินของวันนี้
    const dailyPlan = await db.collection('DailyPlans').findOne({ user_id: userId, date: today });

    // --- ส่วนการคำนวณ Logic (หลังบ้านคำนวณให้เลย เพื่อนจะได้ไม่ต้องเหนื่อย) ---
    const targetKcal = user?.health_goals?.tdee || 2000;
    const consumedKcal = mealLog?.total_summary?.kcal || 0;
    
    const dashboardData = {
      user: {
        name: user?.username,
        goal_status: user?.health_goals?.status
      },
      calories: {
        target: targetKcal,
        consumed: consumedKcal,
        remaining: targetKcal - consumedKcal,
        percent: Math.round((consumedKcal / targetKcal) * 100)
      },
      macros: {
        protein: { current: mealLog?.total_summary?.protein || 0, target: user?.health_goals?.protein_target || 0 },
        carb: { current: mealLog?.total_summary?.carb || 0, target: 250 }, // สมมติค่า Target
        fat: { current: mealLog?.total_summary?.fat || 0, target: 70 }
      },
      water: {
        current: waterLog?.total_drank_ml || 0,
        target: user?.health_goals?.water_target_ml || 2000
      },
      next_meal: dailyPlan?.slots?.find(slot => slot.status === 'pending') || null
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: "Dashboard Error: " + error.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 เซิร์ฟเวอร์ Backend พร้อมรันที่พอร์ต 3000");
});

