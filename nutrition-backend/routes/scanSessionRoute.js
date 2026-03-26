const express = require("express");
const router = express.Router();
const {
  createScanSession,
  getScanSessionsByMeal,
  getDailySummary,
} = require("../controllers/scanSessionController");

router.post("/", createScanSession);
router.get("/", getScanSessionsByMeal);
router.get("/daily-summary/:user_id", getDailySummary);

module.exports = router;