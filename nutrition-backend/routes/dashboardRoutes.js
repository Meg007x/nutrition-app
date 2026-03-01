const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');

// เมื่อมีคนเรียก /api/dashboard/:userId ให้ไปรันฟังก์ชัน getDashboardData
router.get('/:userId', getDashboardData);

module.exports = router;