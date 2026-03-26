require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// 1. นำเข้า Routes
const dashboardRoutes = require("./routes/dashboardRoutes");
const { getIngredients, getDislikedFoods } = require("./controllers/foodController");
const aiRoute = require("./routes/aiRoute");
const userRoute = require("./routes/userRoute");
const mealLogRoute = require("./routes/mealLogRoute");
const waterLogRoute = require("./routes/waterLogRoute");
const scanSessionRoute = require("./routes/scanSessionRoute");


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

// 3. เชื่อมต่อ MongoDB จาก .env
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error("❌ ไม่พบ MONGODB_URI ในไฟล์ .env");
  process.exit(1);
}

mongoose
  .connect(dbURI)
  .then(() => console.log("✅ หลังบ้านเชื่อมต่อ MongoDB สำเร็จ!"))
  .catch((err) => {
    console.log("❌ ต่อ MongoDB ไม่ติด:", err);
    process.exit(1);
  });

// 4. กำหนดเส้นทาง API
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", userRoute);
app.use("/api/meal-logs", mealLogRoute);
app.use("/api/water-logs", waterLogRoute);
app.use("/api/scan-sessions", scanSessionRoute);

// เส้นทางสำหรับดึงข้อมูลวัตถุดิบและอาหารที่ไม่ชอบ
app.get("/api/ingredients", getIngredients);
app.get("/api/disliked-foods", getDislikedFoods);

// เส้นทางสำหรับ AI วิเคราะห์อาหาร
app.use("/api/ai", aiRoute);

// 5. เปิดเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server พร้อมทำงานที่พอร์ต ${PORT}`);
  console.log(`📡 ตรวจสอบ API AI ได้ที่: http://localhost:${PORT}/api/ai/analyze`);
  console.log(`👤 ตรวจสอบ meal settings ได้ที่: http://localhost:${PORT}/api/users/:uid/meal-settings`);
  console.log(`🍽️ บันทึก Scan Session ได้ที่: http://localhost:${PORT}/api/scan-sessions`);
  console.log(`📊 ดูสรุปรายวันได้ที่: http://localhost:${PORT}/api/scan-sessions/daily-summary/:user_id`);
});