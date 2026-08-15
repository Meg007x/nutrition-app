const express = require("express");

const router =
  express.Router();

const {
  createMealPlans,
  generateMealPlan,
  getPlansByPlanId,
} = require("../controllers/mealController");

// ======================================================
// Create Meal Plans
// ======================================================

router.post(
  "/plans",
  createMealPlans
);

// ======================================================
// Generate Meal Plan
// ======================================================

router.post(
  "/generate",
  generateMealPlan
);

// ======================================================
// Get Plans By Plan ID
// ======================================================

router.get(
  "/plans/:plan_id",
  getPlansByPlanId
);

module.exports = router;