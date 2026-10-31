const ACTIVITY_LEVELS = {
  sedentary: { label: "น้อย", factor: 1.2 },
  light: { label: "เล็กน้อย", factor: 1.375 },
  moderate: { label: "ปานกลาง", factor: 1.55 },
  heavy: { label: "หนัก", factor: 1.725 },
  extra_active: { label: "หนักมาก", factor: 1.9 },
};

function normalizeActivityLevel(activityLevel) {
  const value = String(activityLevel || "").trim().toLowerCase();

  if (["sedentary", "น้อย"].includes(value)) return "sedentary";
  if (["light", "เบา", "เล็กน้อย"].includes(value)) return "light";
  if (["moderate", "ปานกลาง", "มาก"].includes(value)) return "moderate";
  if (["active", "very_active", "heavy", "หนัก"].includes(value)) return "heavy";
  if (["extra_active", "extra active", "หนักมาก"].includes(value)) return "extra_active";

  return "sedentary";
}

function getActivityLabel(activityLevel) {
  return ACTIVITY_LEVELS[normalizeActivityLevel(activityLevel)].label;
}

function calculateTDEE(gender, weight, height, age, activityLevel) {
  const bmr =
    10 * Number(weight) +
    6.25 * Number(height) -
    5 * Number(age) +
    (gender === "ชาย" || gender === "male" ? 5 : -161);

  return Math.round(
    bmr * ACTIVITY_LEVELS[normalizeActivityLevel(activityLevel)].factor
  );
}

module.exports = {
  calculateTDEE,
  getActivityLabel,
  normalizeActivityLevel,
};
