const express = require("express");
const router = express.Router();
const {
     finalizeMealLog, 
     saveMealCart 
    } = require("../controllers/mealLogController");

router.post("/finalize", finalizeMealLog);
router.post("/cart", saveMealCart);

module.exports = router;