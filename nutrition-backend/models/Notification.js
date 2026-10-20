const mongoose = require('mongoose');

// ปรับมาดึงข้อมูลจากตาราง NotificationSettings ที่มีข้อมูลคุณบุเรงนองอยู่จริง
const NotificationSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'NotificationSettings' // 🔥 เปลี่ยนชื่อคอลเลกชันตรงนี้ให้ตรงกับในมอนโก
});

// บังคับให้ใช้ตาราง NotificationSettings เสมอ
module.exports = mongoose.models.Notification 
  ? mongoose.models.Notification 
  : mongoose.model('Notification', NotificationSchema, 'NotificationSettings');