require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// ❌ ลบ 2 บรรทัดที่ทำให้เกิด Error ออก (เพราะเราไม่ได้ใช้และไม่จำเป็นต้องใช้ในไฟล์นี้)

// 1. นำเข้า Routes
const dashboardRoutes = require("./routes/dashboardRoutes");
const { getIngredients, getDislikedFoods } = require("./controllers/foodController");
const aiRoute = require("./routes/aiRoute");
const userRoute = require("./routes/userRoute");
const mealLogRoute = require("./routes/mealLogRoute");
const waterLogRoute = require("./routes/waterLogRoute");
const scanSessionRoute = require("./routes/scanSessionRoute");
const startNotificationCron = require('./utils/cronScheduler'); // นำเข้า Cron
const notificationRoutes = require('./routes/notificationRoutes');


const app = express();

// 2. Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// เปิดให้เข้าถึงโฟลเดอร์ uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. กำหนดเส้นทาง API
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", userRoute);
app.use("/api/meal-logs", mealLogRoute);
app.use("/api/water-logs", waterLogRoute);
app.use("/api/scan-sessions", scanSessionRoute);
app.use('/api/notifications', notificationRoutes);
app.get("/api/ingredients", getIngredients);
app.get("/api/disliked-foods", getDislikedFoods);
app.use("/api/ai", aiRoute);

// 5. เริ่มเซิร์ฟเวอร์หลังเชื่อมต่อ DB สำเร็จ
async function startServer() {
  await connectDB();

  // 🟢 สั่งให้นาฬิกาปลุกเริ่มทำงานตรงนี้ (หลังจากเชื่อม DB สำเร็จแล้ว)
  startNotificationCron();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server พร้อมทำงานที่พอร์ต ${PORT}`);
    console.log(`📡 ตรวจสอบ API AI ได้ที่: http://localhost:${PORT}/api/ai/analyze`);
    console.log(`👤 ตรวจสอบ meal settings ได้ที่: http://localhost:${PORT}/api/users/:uid/meal-settings`);
    console.log(`🍽️ บันทึก Scan Session ได้ที่: http://localhost:${PORT}/api/scan-sessions`);
    console.log(`📊 ดูสรุปรายวันได้ที่: http://localhost:${PORT}/api/scan-sessions/daily-summary/:user_id`);
  });
}

startServer().catch((err) => {
  console.error("❌ ไม่สามารถเริ่มเซิร์ฟเวอร์ได้:", err);
  process.exit(1);
});