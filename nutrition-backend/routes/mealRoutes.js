const express = require("express");
const router = express.Router();

const {
  createMealPlans,
  getPlansByPlanId,
  getPlansByUserId,
  deletePlanByPlanId,
  deletePlanDay,
  replaceMealInPlan,
  deleteMealFromPlan,
  searchFoods,
  getFoodById,
} = require("../controllers/mealController");

router.get("/search-foods", searchFoods);
router.get("/foods/:food_id", getFoodById);

router.post("/plans", createMealPlans);
router.get("/plans/:plan_id", getPlansByPlanId);
router.delete("/plans/:plan_id", deletePlanByPlanId);
router.delete("/plans/:plan_id/day/:date", deletePlanDay);

router.get("/user/:user_id", getPlansByUserId);

router.put("/plans/:planId/meal", replaceMealInPlan);
router.delete("/plans/:planId/meal/:mealId", deleteMealFromPlan);

module.exports = router;