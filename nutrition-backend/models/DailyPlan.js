const mongoose = require("mongoose");

// ======================================================
// Food Schema
// ======================================================

const FoodSchema =
  new mongoose.Schema(
    {
      food_id: {
        type: String,
        default: null,
      },

      name: {
        type: String,
        default: "",
      },

      image_url: {
        type: String,
        default: "",
      },

      category: {
        type: String,
        default: "",
      },

      kcal: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

// ======================================================
// Target Nutrition
// ======================================================

const TargetNutritionSchema =
  new mongoose.Schema(
    {
      protein_g: {
        type: Number,
        default: 0,
      },

      carb_g: {
        type: Number,
        default: 0,
      },

      fat_g: {
        type: Number,
        default: 0,
      },

      fiber_g: {
        type: Number,
        default: 0,
      },

      sodium_mg: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

// ======================================================
// Meal Slot
// ======================================================

const SlotSchema =
  new mongoose.Schema(
    {
      slot_name: {
        type: String,
        default: "",
      },

      meal_type: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        default: "pending",
      },

      target_kcal: {
        type: Number,
        default: 0,
      },

      target_nutrition:
        TargetNutritionSchema,

      main_food:
        FoodSchema,

      addons: {
        type: [
          FoodSchema,
        ],
        default: [],
      },

      original_main_food_id: {
        type: String,
        default: null,
      },

      current_main_food_id: {
        type: String,
        default: null,
      },

      is_swapped: {
        type: Boolean,
        default: false,
      },

      swap_history: {
        type: Array,
        default: [],
      },
    },
    {
      _id: false,
    }
  );

// ======================================================
// Daily Target
// ======================================================

const DailyTargetSchema =
  new mongoose.Schema(
    {
      kcal: {
        type: Number,
        default: 0,
      },

      protein_g: {
        type: Number,
        default: 0,
      },

      carb_g: {
        type: Number,
        default: 0,
      },

      fat_g: {
        type: Number,
        default: 0,
      },

      fiber_g: {
        type: Number,
        default: 0,
      },

      sodium_mg: {
        type: Number,
        default: 0,
      },
    },
    {
      _id: false,
    }
  );

// ======================================================
// Daily Plan
// ======================================================

const DailyPlanSchema =
  new mongoose.Schema(
    {
      plan_id: {
        type: String,
        required: true,
        index: true,
      },

      plan_status: {
        type: String,
        default: "active",
      },

      user_id: {
        type: String,
        required: true,
        index: true,
      },

      date: {
        type: String,
        required: true,
        index: true,
      },

      plan_type: {
        type: String,
        default: "daily",
      },

      generated_by: {
        type: String,
        default: "ai",
      },

      goal: {
        type: String,
        default: "",
      },

      meals_per_day: {
        type: Number,
        default: 3,
      },

      slots: {
        type: [
          SlotSchema,
        ],
        default: [],
      },

      daily_target_summary:
        DailyTargetSchema,
    },
    {
      timestamps: true,

      collection:
        "DailyPlans",
    }
  );

// ======================================================
// Index
// ======================================================

DailyPlanSchema.index({
  plan_id: 1,
  date: 1,
});

DailyPlanSchema.index({
  user_id: 1,
  date: 1,
});

// ======================================================
// Export
// ======================================================

module.exports =
  mongoose.model(
    "DailyPlan",
    DailyPlanSchema
  );