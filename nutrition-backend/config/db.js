require("dotenv").config();
const dns = require("dns");
const mongoose = require("mongoose");

// บังคับใช้ public DNS ก่อน connect (แก้ปัญหาเน็ตหอที่ resolve SRV ไม่ได้)
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const connectDB = async () => {
  const dbURI = process.env.MONGODB_URI;

  if (!dbURI) {
    console.error("❌ ไม่พบ MONGODB_URI ในไฟล์ .env");
    process.exit(1);
  }

  if (dbURI.includes("mongodb+srv://")) {
    console.warn(
      "⚠️  MONGODB_URI ยังเป็น mongodb+srv:// — แนะนำเปลี่ยนเป็น Standard Connection String"
    );
  }

  try {
    await mongoose.connect(dbURI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    const dbName = mongoose.connection.db?.databaseName || "unknown";
    console.log(`✅ เชื่อมต่อ MongoDB สำเร็จ! [database: ${dbName}]`);
  } catch (err) {
    console.error("❌ ต่อ Database ไม่ติด:", err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log("✅ ตัดการเชื่อมต่อ MongoDB");
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;

mongoose.connection.once('open', async () => {
  console.log("✅ เชื่อมต่อฐานข้อมูลชื่อ:", mongoose.connection.name);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("📦 คอลเลกชันที่มีในห้องนี้:", collections.map(c => c.name));
});