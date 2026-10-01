const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    user_id: String,
    username: String,
    email: String,
    password: String,
    avatar_url: { type: String, default: "" },
    gender: String,
    date_of_birth: Date,
    age: Number,
    height_cm: Number,
    weight_kg: Number,

    body_analysis: {
      bmi: Number,
      status: String,
      color: String,
    },

    health_goals: {
      primary_goal: String,
      target_weight_kg: Number,
      duration_weeks: Number,
      activity_level: String,
      protein_target_g: Number,
      tdee_target_kcal: Number,
    },

    allergies: {
      veg: [String],
      condiment: [String],
      meat: [String],
      other: [String],
    },

    disliked_foods: {
      nuts: [String],
      dairy: [String],
      meat: [String],
      seafood: [String],
      egg_cheese: [String],
      bread: [String],
      sweet: [String],
      veg_fruit: [String],
    },

    interested_cuisines: [String],

    meal_settings: {
      meals_per_day: Number,
      schedules: [
        {
          name: String,
          time: String,
          notify: Boolean,
        },
      ],
    },

    summary: {
      advice: String,
    },

    onboarding_completed: Boolean,
    created_at: Date,
    updated_at: Date,
  },
  {
    collection: "Users",
    versionKey: false,
  }
);

module.exports = mongoose.model("User", UserSchema);