const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const dbURI = "mongodb+srv://nutrationproject_db_user:NS6ocxDkOw83oXiL@nutrationproject.9pjijzj.mongodb.net/NutritionApp?retryWrites=true&w=majority";
        await mongoose.connect(dbURI);
        console.log("✅ เชื่อมต่อ MongoDB สำเร็จ! (จากแฟ้ม config)");
    } catch (err) {
        console.log("❌ ต่อ Database ไม่ติด:", err);
        process.exit(1);
    }
};

module.exports = connectDB;