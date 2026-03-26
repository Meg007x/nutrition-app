const express = require("express");
const router = express.Router();
const { getMealSettings } = require("../controllers/userController");

router.get("/:uid/meal-settings", getMealSettings);

module.exports = router;