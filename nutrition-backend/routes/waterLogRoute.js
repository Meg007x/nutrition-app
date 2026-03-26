const express = require("express");
const router = express.Router();
const waterLogController = require("../controllers/waterLogController");

router.get("/daily/:userId", waterLogController.getDailyWaterLog);
router.post("/", waterLogController.addWaterRecord);
router.delete("/:userId/:date/:index", waterLogController.deleteWaterRecord);
router.put("/:userId/:date/target", waterLogController.updateTargetWater);

module.exports = router;