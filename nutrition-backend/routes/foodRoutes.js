// ไฟล์: routes/foodRoutes.js
const express = require('express');
const router = express.Router();

// นำเข้า Controller ฝ่ายเสบียงมาใช้งาน
const { getIngredients, getDislikedFoods } = require('../controllers/foodController');

// กำหนดป้ายบอกทาง (สังเกตว่าเราตัดคำว่า /api ออก เพราะเดี๋ยวเราไปกำหนดที่ยามหน้าตึกแทน)
router.get('/ingredients', getIngredients);      // สำหรับหน้า 6
router.get('/disliked-foods', getDislikedFoods); // สำหรับหน้า 7

module.exports = router;