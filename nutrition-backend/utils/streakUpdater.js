const User = require("../models/User"); // เปลี่ยนมาเรียกใช้ Model โดยตรง

exports.updateStreak = async (userId) => {
  try {
    if (!userId) return;

    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); 
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

    // ค้นหาผู้ใช้ผ่าน Model
    const user = await User.findOne({ user_id: String(userId).trim() }).lean();
    
    if (!user) {
      console.log(`⚠️ ไม่พบผู้ใช้ไอดี ${userId} ในระบบ`);
      return;
    }

    const currentStreak = user.current_streak || 0;
    const lastActiveDate = user.last_active_date || null;
    let newStreak = currentStreak;

    // คำนวณไฟ
    if (lastActiveDate === todayStr) {
      console.log(`🟡 วันนี้ไฟถูกคิดไปแล้ว ข้ามการทำงาน...`);
      return; 
    } else if (lastActiveDate === yesterdayStr) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }

    // อัปเดตข้อมูล
    await User.collection.updateOne(
      { user_id: String(userId).trim() },
      {
        $set: {
          current_streak: newStreak,
          last_active_date: todayStr,
          updated_at: new Date()
        }
      }
    );

    console.log(`🔥 อัปเดตไฟของ ${userId} เป็น: ${newStreak} วัน สำเร็จ!`);

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในระบบคำนวณ Streak:", error);
  }
};