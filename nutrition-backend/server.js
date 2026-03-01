const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 1. นำเข้า Routes (พนักงานรับออเดอร์ที่เราแยกไฟล์ไว้)
const dashboardRoutes = require('./routes/dashboardRoutes'); 

const app = express();
app.use(cors());
app.use(express.json());

// 2. ลิงก์ MongoDB (กุญแจเดิมของคุณ)
const dbURI = "mongodb+srv://nutrationproject_db_user:NS6ocxDkOw83oXiL@nutrationproject.9pjijzj.mongodb.net/NutritionApp?retryWrites=true&w=majority";

mongoose.connect(dbURI)
  .then(() => console.log("✅ หลังบ้านเชื่อมต่อ MongoDB สำเร็จ! (Clean Version)"))
  .catch(err => console.log("❌ ต่อไม่ติด:", err));

// 3. 🛡️ จุดสำคัญ: บอก Server ว่าถ้ามีคนเรียก /api/dashboard ให้ไปดูที่ไฟล์ Routes นะ
app.use('/api/dashboard', dashboardRoutes);

// 4. เปิดเซิร์ฟเวอร์
app.listen(3000, () => {
  console.log("🚀 Server พร้อมทำงานแบบมืออาชีพที่พอร์ต 3000");
});