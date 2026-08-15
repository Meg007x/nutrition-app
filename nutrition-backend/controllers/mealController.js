const DailyPlan = require("../models/DailyPlan");
const MasterFood = require("../models/MasterFood");

// ======================================================
// Generate Plan ID
// ======================================================

function generatePlanId() {
  return `PLAN_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
}

// ======================================================
// Date
// ======================================================

function formatDate(date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(
  dateString,
  days
) {
  const date = new Date(
    `${dateString}T00:00:00`
  );

  date.setDate(
    date.getDate() + days
  );

  return formatDate(date);
}

function isValidDate(
  dateString
) {
  if (
    typeof dateString !==
    "string"
  ) {
    return false;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString
    )
  ) {
    return false;
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return (
    !Number.isNaN(
      date.getTime()
    ) &&
    formatDate(date) ===
      dateString
  );
}

// ======================================================
// Number
// ======================================================

function number(value) {
  const result =
    Number(value);

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}

// ======================================================
// Nutrition
// ======================================================

function getNutrition(food) {
  const nutrition =
    food?.nutrition_per_portion ||
    {};

  return {
    kcal: number(
      nutrition.kcal
    ),

    protein_g: number(
      nutrition.protein_g
    ),

    carb_g: number(
      nutrition.carb_g
    ),

    fat_g: number(
      nutrition.fat_g
    ),

    fiber_g: number(
      nutrition.fiber_g
    ),

    sodium_mg: number(
      nutrition.sodium_mg
    ),
  };
}

// ======================================================
// Add Nutrition
// ======================================================

function addNutrition(
  current,
  nutrition
) {
  return {
    kcal:
      current.kcal +
      nutrition.kcal,

    protein_g:
      current.protein_g +
      nutrition.protein_g,

    carb_g:
      current.carb_g +
      nutrition.carb_g,

    fat_g:
      current.fat_g +
      nutrition.fat_g,

    fiber_g:
      current.fiber_g +
      nutrition.fiber_g,

    sodium_mg:
      current.sodium_mg +
      nutrition.sodium_mg,
  };
}

// ======================================================
// Map Food
// ======================================================

function mapFood(food) {
  if (!food) {
    return null;
  }

  const nutrition =
    getNutrition(food);

  return {
    food_id: food._id,

    name:
      food.name || "",

    image_url:
      food.image || "",

    category:
      food.category || "",

    kcal:
      nutrition.kcal,
  };
}

// ======================================================
// Map Addon
// ======================================================

function mapAddon(food) {
  if (!food) {
    return null;
  }

  const nutrition =
    getNutrition(food);

  return {
    food_id: food._id,

    name:
      food.name || "",

    image_url:
      food.image || "",

    category:
      food.category || "",

    kcal:
      nutrition.kcal,
  };
}

// ======================================================
// Nutrition Score
// ======================================================

function nutritionScore(
  nutrition,
  target
) {
  if (!target) {
    return 0;
  }

  const kcalDiff =
    Math.abs(
      nutrition.kcal -
        target.kcal
    );

  const proteinDiff =
    Math.abs(
      nutrition.protein_g -
        target.protein_g
    );

  const carbDiff =
    Math.abs(
      nutrition.carb_g -
        target.carb_g
    );

  const fatDiff =
    Math.abs(
      nutrition.fat_g -
        target.fat_g
    );

  const fiberDiff =
    Math.abs(
      nutrition.fiber_g -
        target.fiber_g
    );

  const sodiumDiff =
    Math.abs(
      nutrition.sodium_mg -
        target.sodium_mg
    );

  return (
    kcalDiff * 2 +
    proteinDiff * 3 +
    carbDiff * 1.2 +
    fatDiff * 1.2 +
    fiberDiff * 0.8 +
    sodiumDiff * 0.02
  );
}

// ======================================================
// Find Best Food
// ======================================================

function findBestFood({
  foods,
  target,
  usedFoodIds = [],
  globalUsedFoodIds = [],
}) {
  if (!foods.length) {
    return null;
  }

  let candidates =
    foods.filter(
      (food) =>
        !usedFoodIds.includes(
          food._id
        )
    );

  const notUsedGlobally =
    candidates.filter(
      (food) =>
        !globalUsedFoodIds.includes(
          food._id
        )
    );

  if (
    notUsedGlobally.length
  ) {
    candidates =
      notUsedGlobally;
  }

  if (!candidates.length) {
    candidates =
      foods.filter(
        (food) =>
          !usedFoodIds.includes(
            food._id
          )
      );
  }

  if (!candidates.length) {
    candidates = foods;
  }

  const scored =
    candidates.map(
      (food) => {
        const nutrition =
          getNutrition(food);

        let score =
          nutritionScore(
            nutrition,
            target
          );

        if (
          food.is_recommended ===
          true
        ) {
          score -= 5;
        }

        return {
          food,
          score,
        };
      }
    );

  scored.sort(
    (a, b) =>
      a.score - b.score
  );

  return (
    scored[0]?.food ||
    null
  );
}

// ======================================================
// Addons
// ======================================================

function findAddons({
  foods,
  currentNutrition,
  target,
  usedFoodIds,
}) {
  const addons = [];

  let nutrition = {
    ...currentNutrition,
  };

  const maxAddons = 2;

  for (
    let i = 0;
    i < maxAddons;
    i++
  ) {
    const remainingKcal =
      target.kcal -
      nutrition.kcal;

    if (
      remainingKcal <= 50
    ) {
      break;
    }

    const candidates =
      foods.filter(
        (food) =>
          !usedFoodIds.includes(
            food._id
          )
      );

    if (!candidates.length) {
      break;
    }

    let bestFood =
      null;

    let bestScore =
      Infinity;

    for (
      const food of candidates
    ) {
      const foodNutrition =
        getNutrition(food);

      const combinedNutrition =
        addNutrition(
          nutrition,
          foodNutrition
        );

      const score =
        nutritionScore(
          combinedNutrition,
          target
        );

      if (
        score < bestScore
      ) {
        bestScore =
          score;

        bestFood =
          food;
      }
    }

    if (!bestFood) {
      break;
    }

    addons.push(
      mapAddon(bestFood)
    );

    usedFoodIds.push(
      bestFood._id
    );

    nutrition =
      addNutrition(
        nutrition,
        getNutrition(
          bestFood
        )
      );
  }

  return {
    addons,
    nutrition,
  };
}

// ======================================================
// Create Slot
// ======================================================

function createMealSlot({
  slotName,
  mealType,
  target,
  foods,
  usedFoodIds,
  globalUsedFoodIds,
}) {
  const mainFood =
    findBestFood({
      foods,
      target,
      usedFoodIds,
      globalUsedFoodIds,
    });

  if (!mainFood) {
    return {
      slot_name:
        slotName,

      meal_type:
        mealType,

      status:
        "pending",

      target_kcal:
        target.kcal,

      target_nutrition: {
        protein_g: 0,
        carb_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sodium_mg: 0,
      },

      main_food:
        null,

      addons: [],

      original_main_food_id:
        null,

      current_main_food_id:
        null,

      is_swapped:
        false,

      swap_history: [],
    };
  }

  usedFoodIds.push(
    mainFood._id
  );

  globalUsedFoodIds.push(
    mainFood._id
  );

  let nutrition =
    getNutrition(
      mainFood
    );

  const addonResult =
    findAddons({
      foods,
      currentNutrition:
        nutrition,
      target,
      usedFoodIds,
    });

  nutrition =
    addonResult.nutrition;

  return {
    slot_name:
      slotName,

    meal_type:
      mealType,

    status:
      "pending",

    target_kcal:
      target.kcal,

    target_nutrition: {
      protein_g:
        nutrition.protein_g,

      carb_g:
        nutrition.carb_g,

      fat_g:
        nutrition.fat_g,

      fiber_g:
        nutrition.fiber_g,

      sodium_mg:
        nutrition.sodium_mg,
    },

    main_food:
      mapFood(mainFood),

    addons:
      addonResult.addons,

    original_main_food_id:
      mainFood._id,

    current_main_food_id:
      mainFood._id,

    is_swapped:
      false,

    swap_history: [],
  };
}

// ======================================================
// POST /api/meal/plans
// ======================================================

async function createMealPlans(
  req,
  res
) {
  try {
    console.log(
      "================================"
    );

    console.log(
      "📥 CREATE MEAL PLAN"
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "================================"
    );

    const {
      user_id,
      start_date,
      days,
      target_kcal,
      protein_g,
      carb_g,
      fat_g,
      fiber_g,
      sodium_mg,
      goal,
      allergies = [],
      disliked_foods = [],
    } = req.body;

    // ==================================================
    // Validate
    // ==================================================

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message:
          "กรุณาระบุ user_id",
      });
    }

    if (
      !isValidDate(
        start_date
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "start_date ต้องอยู่ในรูปแบบ YYYY-MM-DD",
      });
    }

    const totalDays =
      Number(days);

    if (
      !Number.isInteger(
        totalDays
      ) ||
      totalDays < 1 ||
      totalDays > 7
    ) {
      return res.status(400).json({
        success: false,
        message:
          "days ต้องเป็นจำนวนเต็มระหว่าง 1-7",
      });
    }

    // ==================================================
    // Target
    // ==================================================

    const dailyTarget = {
      kcal:
        number(target_kcal),

      protein_g:
        number(protein_g),

      carb_g:
        number(carb_g),

      fat_g:
        number(fat_g),

      fiber_g:
        number(fiber_g),

      sodium_mg:
        number(sodium_mg),
    };

    if (
      dailyTarget.kcal <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "target_kcal ต้องมากกว่า 0",
      });
    }

    // ==================================================
    // MasterFood
    // ==================================================

    console.log(
      "🔎 Loading MasterFood..."
    );

    const masterFoods =
      await MasterFood.find({})
        .lean();

    console.log(
      "🍽️ MasterFood:",
      masterFoods.length
    );

    if (
      !masterFoods.length
    ) {
      return res.status(404).json({
        success: false,
        message:
          "ไม่พบข้อมูลอาหารใน MasterFood",
      });
    }

    // ==================================================
    // Filter
    // ==================================================

    const allergyList =
      Array.isArray(allergies)
        ? allergies
        : [];

    const dislikedList =
      Array.isArray(
        disliked_foods
      )
        ? disliked_foods
        : [];

    const filteredFoods =
      masterFoods.filter(
        (food) => {
          const allergens =
            Array.isArray(
              food.allergens
            )
              ? food.allergens
              : [];

          const hasAllergy =
            allergyList.some(
              (allergy) => {
                const value =
                  String(
                    allergy
                  )
                    .trim()
                    .toLowerCase();

                return (
                  value &&
                  allergens.some(
                    (item) =>
                      String(
                        item
                      )
                        .trim()
                        .toLowerCase()
                        .includes(
                          value
                        )
                  )
                );
              }
            );

          if (hasAllergy) {
            return false;
          }

          const searchText = [
            food.name,
            food.name_en,
            food.category,

            ...(Array.isArray(
              food.tags
            )
              ? food.tags
              : []),

            ...(Array.isArray(
              food.search_keywords
            )
              ? food.search_keywords
              : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const isDisliked =
            dislikedList.some(
              (item) => {
                const value =
                  String(
                    item
                  )
                    .trim()
                    .toLowerCase();

                return (
                  value &&
                  searchText.includes(
                    value
                  )
                );
              }
            );

          return !isDisliked;
        }
      );

    if (
      !filteredFoods.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "ไม่พบอาหารที่สามารถใช้สร้างแผนได้",
      });
    }

    // ==================================================
    // Plan ID
    // ==================================================

    const planId =
      generatePlanId();

    // ==================================================
    // Meal Targets
    // ==================================================

    const breakfastTarget = {
      kcal:
        dailyTarget.kcal *
        0.25,

      protein_g:
        dailyTarget.protein_g *
        0.25,

      carb_g:
        dailyTarget.carb_g *
        0.25,

      fat_g:
        dailyTarget.fat_g *
        0.25,

      fiber_g:
        dailyTarget.fiber_g *
        0.25,

      sodium_mg:
        dailyTarget.sodium_mg *
        0.25,
    };

    const lunchTarget = {
      kcal:
        dailyTarget.kcal *
        0.40,

      protein_g:
        dailyTarget.protein_g *
        0.40,

      carb_g:
        dailyTarget.carb_g *
        0.40,

      fat_g:
        dailyTarget.fat_g *
        0.40,

      fiber_g:
        dailyTarget.fiber_g *
        0.40,

      sodium_mg:
        dailyTarget.sodium_mg *
        0.40,
    };

    const dinnerTarget = {
      kcal:
        dailyTarget.kcal *
        0.35,

      protein_g:
        dailyTarget.protein_g *
        0.35,

      carb_g:
        dailyTarget.carb_g *
        0.35,

      fat_g:
        dailyTarget.fat_g *
        0.35,

      fiber_g:
        dailyTarget.fiber_g *
        0.35,

      sodium_mg:
        dailyTarget.sodium_mg *
        0.35,
    };

    // ==================================================
    // Documents
    // ==================================================

    const documents = [];

    const globalUsedFoodIds =
      [];

    // ==================================================
    // Generate Days
    // ==================================================

    for (
      let dayIndex = 0;
      dayIndex <
      totalDays;
      dayIndex++
    ) {
      const date =
        addDays(
          start_date,
          dayIndex
        );

      const usedFoodIds =
        [];

      const breakfast =
        createMealSlot({
          slotName:
            "มื้อเช้า",

          mealType:
            "breakfast",

          target:
            breakfastTarget,

          foods:
            filteredFoods,

          usedFoodIds,

          globalUsedFoodIds,
        });

      const lunch =
        createMealSlot({
          slotName:
            "มื้อกลางวัน",

          mealType:
            "lunch",

          target:
            lunchTarget,

          foods:
            filteredFoods,

          usedFoodIds,

          globalUsedFoodIds,
        });

      const dinner =
        createMealSlot({
          slotName:
            "มื้อเย็น",

          mealType:
            "dinner",

          target:
            dinnerTarget,

          foods:
            filteredFoods,

          usedFoodIds,

          globalUsedFoodIds,
        });

      documents.push({
        plan_id:
          planId,

        plan_status:
          "active",

        user_id,

        date,

        plan_type:
          "daily",

        generated_by:
          "ai",

        goal:
          goal || "",

        meals_per_day:
          3,

        slots: [
          breakfast,
          lunch,
          dinner,
        ],

        daily_target_summary: {
          kcal:
            dailyTarget.kcal,

          protein_g:
            dailyTarget.protein_g,

          carb_g:
            dailyTarget.carb_g,

          fat_g:
            dailyTarget.fat_g,

          fiber_g:
            dailyTarget.fiber_g,

          sodium_mg:
            dailyTarget.sodium_mg,
        },
      });
    }

    // ==================================================
    // Insert
    // ==================================================

    console.log(
      "💾 Saving",
      documents.length,
      "DailyPlans..."
    );

    const createdPlans =
      await DailyPlan.insertMany(
        documents
      );

    console.log(
      "✅ Saved:",
      createdPlans.length
    );

    // ==================================================
    // Response
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        `สร้างแผนอาหาร ${totalDays} วันสำเร็จ`,

      plan_id:
        planId,

      user_id,

      total_days:
        createdPlans.length,

      start_date:
        createdPlans[0].date,

      end_date:
        createdPlans[
          createdPlans.length - 1
        ].date,

      plans:
        createdPlans,
    });
  } catch (error) {
    console.error(
      "❌ Create Meal Plans Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "เกิดข้อผิดพลาดในการสร้างแผนอาหาร",

      error:
        error.message,
    });
  }
}

// ======================================================
// GET /api/meal/plans/:plan_id
// ======================================================

async function getPlansByPlanId(
  req,
  res
) {
  try {
    const {
      plan_id,
    } = req.params;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message:
          "กรุณาระบุ plan_id",
      });
    }

    const plans =
      await DailyPlan.find({
        plan_id,
      })
        .sort({
          date: 1,
        })
        .lean();

    if (!plans.length) {
      return res.status(404).json({
        success: false,
        message:
          "ไม่พบแผนอาหาร",
      });
    }

    return res.json({
      success: true,

      plan_id,

      total_days:
        plans.length,

      plans,
    });
  } catch (error) {
    console.error(
      "❌ Get Plans Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "ไม่สามารถโหลดแผนอาหารได้",

      error:
        error.message,
    });
  }
}

// ======================================================
// Generate Meal Plan
// ======================================================

async function generateMealPlan(
  req,
  res
) {
  return createMealPlans(
    req,
    res
  );
}

// ======================================================
// Export
// ======================================================

module.exports = {
  createMealPlans,
  generateMealPlan,
  getPlansByPlanId,
};