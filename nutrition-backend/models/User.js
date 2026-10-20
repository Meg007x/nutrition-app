const mongoose = require("mongoose");

/* ======================================================
   User Schema — v2 (allergy hierarchy)
====================================================== */

const UserAllergyEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["parent", "specific"], default: "specific" },
    code: { type: String, default: "" },        // e.g. "tree_nuts", "shellfish", "milk"
    label: { type: String, default: "" },        // e.g. "ถั่วเปลือกแข็ง", "สัตว์มีเปลือก", "นม"
    ingredient_id: { type: String, default: null }, // link to Ingredients collection
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    username: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    avatar_url: { type: String, default: "" },
    gender: { type: String, default: "" },
    date_of_birth: { type: Date, default: null },
    age: { type: Number, default: 0 },
    height_cm: { type: Number, default: 0 },
    weight_kg: { type: Number, default: 0 },

    body_analysis: {
      bmi: { type: Number, default: 0 },
      status: { type: String, default: "" },
      color: { type: String, default: "" },
    },

    health_goals: {
      primary_goal: { type: String, default: "" },
      target_weight_kg: { type: Number, default: 0 },
      duration_weeks: { type: Number, default: 0 },
      activity_level: { type: String, default: "" },
      protein_target_g: { type: Number, default: 0 },
      tdee_target_kcal: { type: Number, default: 0 },
    },

    // ── v2: allergies เปลี่ยนเป็น structured array ──
    // 保留เดิม backward-compat (migration จะ populate v2 จาก v1)
    allergies: {
      veg: { type: [String], default: [] },
      condiment: { type: [String], default: [] },
      meat: { type: [String], default: [] },
      other: { type: [String], default: [] },
    },

    // ── ฟิลด์ใหม่ v2 ──
    allergies_v2: {
      type: [UserAllergyEntrySchema],
      default: [],
    },

    disliked_foods: {
      nuts: { type: [String], default: [] },
      dairy: { type: [String], default: [] },
      meat: { type: [String], default: [] },
      seafood: { type: [String], default: [] },
      egg_cheese: { type: [String], default: [] },
      bread: { type: [String], default: [] },
      sweet: { type: [String], default: [] },
      veg_fruit: { type: [String], default: [] },
    },

    interested_cuisines: { type: [String], default: [] },

    meal_settings: {
      meals_per_day: { type: Number, default: 3 },
      schedules: [
        {
          name: { type: String, default: "" },
          time: { type: String, default: "" },
          notify: { type: Boolean, default: false },
        },
      ],
    },

    summary: {
      advice: { type: String, default: "" },
    },

    // streak fields (from streakUpdater)
    current_streak: { type: Number, default: 0 },
    last_active_date: { type: String, default: "" },

    onboarding_completed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: "Users",
    versionKey: false,
  }
);

UserSchema.index({ user_id: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { sparse: true });

module.exports = mongoose.model("User", UserSchema);