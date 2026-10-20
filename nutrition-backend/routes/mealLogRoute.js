const express = require("express");
const router = express.Router();
const {
     finalizeMealLog, 
     saveMealCart,
     getCartContext 
    } = require("../controllers/mealLogController");

router.post("/finalize", finalizeMealLog);
router.post("/cart", saveMealCart);
router.get("/cart", getCartContext);

module.exports = router;