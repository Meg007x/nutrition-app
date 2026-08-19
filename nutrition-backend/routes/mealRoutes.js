const express = require("express");
const router = express.Router();

const {
  createMealPlans,
  getPlansByPlanId,
  getPlansByUserId,
  deletePlanByPlanId,
  replaceMealInPlan,
  deleteMealFromPlan,
  searchFoods,
} = require("../controllers/mealController");

// Search Foods (Fuzzy)
router.get("/search-foods", searchFoods);

// Create Meal Plans
router.post("/plans", createMealPlans);

// Get Plans By Plan ID
router.get("/plans/:plan_id", getPlansByPlanId);

// Delete Plans By Plan ID
router.delete("/plans/:plan_id", deletePlanByPlanId);

// Get Plans By User ID
router.get("/user/:user_id", getPlansByUserId);

// Replace/Edit Meal in Plan
router.put("/plans/:planId/meal", replaceMealInPlan);

// Delete Meal from Plan
router.delete("/plans/:planId/meal/:mealId", deleteMealFromPlan);

module.exports = router;