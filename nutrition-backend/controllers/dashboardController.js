const mongoose = require('mongoose');

// สมองส่วนที่ 1: จัดการข้อมูลหน้า Dashboard
const getDashboardData = async (req, res) => {
    try {
        const { userId } = req.params;
        const db = mongoose.connection.db;

        // 1. ดึงข้อมูล (สมมติว่าเอาแค่ User ก่อน)
        const user = await db.collection('Users').findOne({ user_id: userId });

        // 2. Logic การคำนวณ (เตรียมตัวแปรส่งให้หน้าบ้าน)
        const targetKcal = user?.health_goals?.tdee || 1850;
        const consumedKcal = 900; // สมมติค่าที่กินไปแล้วเดี๋ยวเราค่อยมาเขียน Logic ดึงจาก MealLogs จริงๆ
        const percentage = Math.round((consumedKcal / targetKcal) * 100);

        // 3. แพ็กของส่งให้หน้าบ้าน
        res.json({
            userName: user?.username || "-",
            streakDays: 1,
            calories: {
                target: targetKcal,
                consumed: consumedKcal,
                percentage: percentage
            },
            macros: {
                protein: { current: 80, target: 100 },
                carb: { current: 90, target: 200 },
                fat: { current: 36, target: 60 }
            },
            recommendation: {
                title: "คำแนะนำมื้อเย็น",
                message: "คาร์บของคุณใกล้เต็มแล้ว มื้อเย็นแนะนำให้เลี่ยงข้าวสวย และเน้นสเต็กปลาหรืออกไก่"
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Dashboard Error", error: error.message });
    }
};

module.exports = { getDashboardData };