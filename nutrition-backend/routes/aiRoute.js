const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// สร้าง API เส้นทาง GET /api/ai/test
router.get('/test', aiController.testAI);

module.exports = router;