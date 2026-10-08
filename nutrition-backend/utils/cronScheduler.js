const cron = require('node-cron');
const mongoose = require('mongoose');

// 🟢 แก้ไขจุดนี้เรียบร้อย (เปลี่ยนจาก ./ เป็น ../ เพื่อถอยออกจากโฟลเดอร์ utils ไปหาโฟลเดอร์ models หลัก)
const Notification = require('../models/Notification');

// ฟังก์ชันสำหรับรันงานอัตโนมัติ (จะทำงานทุกๆ 1 นาที)
const startNotificationCron = () => {
  console.log('⏰ ระบบตั้งเวลาแจ้งเตือนอัตโนมัติ (Cron Job) เริ่มทำงานแล้ว...');

  // ============================================================
  // 🍽️ Meal Reminder Cron (ทุก 1 นาที ตรวจจับเวลาอาหาร)
  // ============================================================
  cron.schedule('* * * * *', async () => {
    try {
      // 1. ดึงเวลาปัจจุบันออกมาในฟอร์แมต "HH:MM"
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;

      // ดึงโมเดล User มาใช้งานอย่างปลอดภัย
      let User;
      try {
        User = mongoose.model('User');
      } catch (e) {
        User = require('../models/User'); // 🟢 ปรับพาร์ทเป็น ../ เช่นกันครับ
      }

      // 2. ค้นหาผู้ใช้ทุกคนในระบบที่มีการตั้งเวลาอาหารตรงกับเวลาปัจจุบันนี้
      const usersToNotify = await User.find({
        'meal_settings.schedules': {
          $elemMatch: {
            time: currentTimeString,
            notify: true
          }
        }
      });

      if (usersToNotify.length === 0) return; // ถ้าไม่มีใครตรงกับเวลานี้เลย ให้จบการทำงานของนาทีนี้

      console.log(`🎯 พบผู้ใช้ ${usersToNotify.length} คนที่มีรอบกินข้าวเวลา: ${currentTimeString}`);

      // 3. วนลูปสร้างแจ้งเตือนยัดลงฐานข้อมูล
      for (const user of usersToNotify) {
        const activeMeal = user.meal_settings.schedules.find(
          schedule => schedule.time === currentTimeString && schedule.notify === true
        );

        if (!activeMeal) continue;

        // เช็กซ้ำซ้อนในนาทีเดียวกัน
        const startOfMinute = new Date();
        startOfMinute.setSeconds(0, 0);
        
        const alreadyExists = await Notification.findOne({
          user_id: user.user_id,
          type: 'meal',
          title: `🍽️ ได้เวลามื้อ${activeMeal.name}แล้ว!`,
          createdAt: { $gte: startOfMinute }
        });

        if (alreadyExists) continue;

        // 4. สั่งบันทึกลง MongoDB คอลเลกชัน notifications
        const autoNotification = new Notification({
          user_id: user.user_id,
          type: 'meal',
          title: `🍽️ ได้เวลามื้อ${activeMeal.name}แล้ว!`,
          message: `ขณะนี้เวลา ${currentTimeString} น. ได้เวลาอร่อยกับมื้อ${activeMeal.name}เพื่อสุขภาพของคุณแล้ว มาบันทึกกันเถอะ!`,
          isRead: false
        });

        await autoNotification.save();
        console.log(`✅ บันทึกแจ้งเตือนมื้อ [${activeMeal.name}] ให้คุณ [${user.username || user.user_id}] เรียบร้อยแล้ว`);
      }

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในระบบตั้งเวลาแจ้งเตือนมื้ออาหาร:', error);
    }
  });

  // ============================================================
  // 💧 Water Intake Reminder Cron (ทุก 30 นาที ระหว่าง 8:00-22:00)
  // ============================================================
  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date();
      const hour = now.getHours();

      // แจ้งเตือนเฉพาะช่วง 8:00 - 22:00 เท่านั้น
      if (hour < 8 || hour >= 22) return;

      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${String(hour).padStart(2, '0')}:${currentMinutes}`;

      let User;
      try {
        User = mongoose.model('User');
      } catch (e) {
        User = require('../models/User');
      }

      // หาผู้ใช้ที่มีเป้าหมายน้ำดื่ม (water_target_ml > 0)
      const usersWithWaterTarget = await User.find({
        $or: [
          { water_target_ml: { $gt: 0 } },
          { 'health_goals.water_target_ml': { $gt: 0 } }
        ]
      });

      if (usersWithWaterTarget.length === 0) return;

      console.log(`💧 ตรวจจับ Water Reminder สำหรับ ${usersWithWaterTarget.length} คน เวลา ${currentTimeString}`);

      for (const user of usersWithWaterTarget) {
        // เช็กซ้ำ: ส่งแค่ 1 ครั้งต่อช่วง 30 นาที
        const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

        const alreadyExists = await Notification.findOne({
          user_id: user.user_id,
          type: 'water',
          createdAt: { $gte: thirtyMinAgo }
        });

        if (alreadyExists) continue;

        const waterTarget = user.water_target_ml || (user.health_goals && user.health_goals.water_target_ml) || 2000;

        const waterNotification = new Notification({
          user_id: user.user_id,
          type: 'water',
          title: `💧 ดื่มน้ำสักแก้วไหม?`,
          message: `อย่าลืมดื่มน้ำให้ได้ ${waterTarget} มล. ต่อวันนะคะ จิบน้ำตอนนี้เลย!`,
          isRead: false
        });

        await waterNotification.save();
        console.log(`✅ แจ้งเตือนดื่มน้ำให้ [${user.username || user.user_id}] เวลา ${currentTimeString}`);
      }

    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในระบบตั้งเวลาแจ้งเตือนดื่มน้ำ:', error);
    }
  });
};

module.exports = startNotificationCron;