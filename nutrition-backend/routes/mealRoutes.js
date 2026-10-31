const express = require("express");
const router = express.Router();

const {
  createMealPlans,
  getPlansByPlanId,
  getPlansByUserId,
  deletePlanByPlanId,
  deletePlanDay,
  replaceMealInPlan,
  addMealAddon,
  deleteMealAddon,
  deleteMealFromPlan,
  searchFoods,
  getSafeFoods,
  getFoodCategories,
  getFoodById,
} = require("../controllers/mealController");

router.get("/search-foods", searchFoods);
router.get("/safe-foods", getSafeFoods);
router.get("/food-categories", getFoodCategories);
router.get("/foods/:food_id", getFoodById);

router.post("/plans", createMealPlans);
router.get("/plans/:plan_id", getPlansByPlanId);
router.delete("/plans/:plan_id", deletePlanByPlanId);
router.delete("/plans/:plan_id/day/:date", deletePlanDay);

router.get("/user/:user_id", getPlansByUserId);

router.put("/plans/:planId/meal", replaceMealInPlan);
router.post("/plans/:planId/addon", addMealAddon);
router.delete("/plans/:planId/addon", deleteMealAddon);
router.delete("/plans/:planId/meal/:mealId", deleteMealFromPlan);

module.exports = router;
