const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// 🟢 ฟังก์ชันดึงแจ้งเตือนทั้งหมดของผู้ใช้ (กู้คืนระบบดึงข้อมูลแบบเดิม ดึงขึ้นแน่นอน)
const getMyNotifications = async (req, res) => {
  try {
    const { userId } = req.query; 

    // 1. เช็คว่าส่งไอดีมาไหม
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ 
        success: false, 
        message: "หน้าบ้านไม่ได้ส่ง userId มา หรือค่าเป็น undefined" 
      });
    }

    // 🟢 2. ถอยกลับมาใช้คำสั่งเดิมที่เคยทำได้ชัวร์ๆ (ถอดการกรองเวลา $lte ที่ทำให้ข้อมูลหายออกไปแล้ว)
    const list = await Notification.find({ user_id: userId }).sort({ createdAt: -1 });

    // เปิด Log ไว้ดูที่ Terminal หลังบ้านเพื่อความมั่นใจ
    console.log("🔥 [กู้ข้อมูลสำเร็จ] ข้อมูลในฐานข้อมูลคือ:", list);
    console.log("📌 ดึงข้อมูลดิบจาก MongoDB ได้ทั้งหมด ->", list.length, "แถว");

    // เตรียมถังแยกกลุ่มข้อมูล
    const responseData = {
      today: [],
      yesterday: [],
      older: []
    };

    // 🟢 แก้บั๊กเรื่องเวลา: สร้างเวลาปัจจุบันที่บวกเผื่อบั๊ก Timezone (7 ชั่วโมง)
    const nowThailand = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    

    // วนลูปข้อมูลเพื่อคัดแยกลงถังตามวันที่
    list.forEach(item => {
      // 🟢 กรองตรงนี้: ถ้าเวลาของแจ้งเตือนยังมาไม่ถึงเวลาปัจจุบัน ให้ข้ามไป (ไม่เอาลงถัง)
      if (new Date(item.createdAt) > nowThailand) return;

      const itemDateStr = new Date(item.createdAt).toDateString();

      if (itemDateStr === todayStr) {
        responseData.today.push(item);
      } else if (itemDateStr === yesterdayStr) {
        responseData.yesterday.push(item);
      } else {
        responseData.older.push(item);
      }
    });

    // ส่งข้อมูลกลับไปให้หน้าบ้านในรูปแบบ JSON
    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("❌ Notification Controller Error:", error); 
    res.status(500).json({ success: false, message: error.message });
  }
};

// ฟังก์ชันลบแจ้งเตือนทีละอันตาม ID
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "ลบแจ้งเตือนสำเร็จ" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ฟังก์ชันสร้างแจ้งเตือนจำลอง
const createFakeNotification = async (req, res) => {
  try {
    const { user_id, type, title, message } = req.body;

    if (!user_id || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "กรุณาส่งข้อมูลให้ครบถ้วน (user_id, type, title, message)"
      });
    }

    const newNotification = new Notification({
      user_id,
      type,
      title,
      message,
      isRead: false
    });

    await newNotification.save();

    return res.status(201).json({
      success: true,
      message: "สร้างแจ้งเตือนจำลองสำเร็จแล้ว!",
      data: newNotification
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getMyNotifications, 
  deleteNotification,
  createFakeNotification
};