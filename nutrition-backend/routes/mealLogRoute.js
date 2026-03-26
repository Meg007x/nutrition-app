const express = require("express");
const router = express.Router();
const { finalizeMealLog } = require("../controllers/mealLogController");

router.post("/finalize", finalizeMealLog);

module.exports = router;