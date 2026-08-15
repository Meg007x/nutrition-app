const express = require("express");

const router = express.Router();

const {
  createMealPlans,
  generateMealPlan,
  getPlansByPlanId,
  getPlansByUserId,
  deletePlanByPlanId,
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

// ======================================================
// DELETE Plans By Plan ID
// ======================================================

router.delete(
  "/plans/:plan_id",
  deletePlanByPlanId
);

// ======================================================
// Get Plans By User ID
// ======================================================

router.get(
  "/user/:user_id",
  getPlansByUserId
);

module.exports = router;