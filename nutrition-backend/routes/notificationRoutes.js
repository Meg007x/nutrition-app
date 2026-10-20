const express = require('express');
const router = express.Router();

// 🟢 1. นำเข้าฟังก์ชันทั้งหมดจาก Controller ให้ครบถ้วนในปีกกา
const { 
  getMyNotifications, 
  deleteNotification, 
  createFakeNotification 
} = require('../controllers/notificationController');

// 🟢 2. ปรับเส้นทาง (Path) ให้ถูกต้องและกระชับ
// (เมื่อยิงจากหน้าบ้านหรือ Postman จะตรงกับที่ตั้งไว้ตอนแรกเป๊ะๆ ครับ)

// ดึงข้อมูลแจ้งเตือน: GET http://localhost:3000/api/notifications
router.get('/', getMyNotifications);

// สร้างแจ้งเตือนจำลอง: POST http://localhost:3000/api/notifications
router.post('/', createFakeNotification);

// ลบแจ้งเตือนตาม ID: DELETE http://localhost:3000/api/notifications/:id
router.delete('/:id', deleteNotification);

module.exports = router;