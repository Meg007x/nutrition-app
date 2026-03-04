const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/authController');

// เมื่อมีคนยิง POST มาที่ /api/auth/register ให้ไปทำฟังก์ชัน registerUser
router.post('/register', registerUser);

module.exports = router;