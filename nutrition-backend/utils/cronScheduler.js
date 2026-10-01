const cron = require('node-cron');
const mongoose = require('mongoose');

// 🟢 แก้ไขจุดนี้เรียบร้อย (เปลี่ยนจาก ./ เป็น ../ เพื่อถอยออกจากโฟลเดอร์ utils ไปหาโฟลเดอร์ models หลัก)
const Notification = require('../models/Notification');

// ฟังก์ชันสำหรับรันงานอัตโนมัติ (จะทำงานทุกๆ 1 นาที)
const startNotificationCron = () => {
  console.log('⏰ ระบบตั้งเวลาแจ้งเตือนอัตโนมัติ (Cron Job) เริ่มทำงานแล้ว...');

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
      console.error('❌ เกิดข้อผิดพลาดในระบบตั้งเวลาแจ้งเตือน:', error);
    }
  });
};

module.exports = startNotificationCron;