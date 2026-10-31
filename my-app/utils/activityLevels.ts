const ACTIVITY_FACTORS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.725,
  extra_active: 1.9,
  "extra active": 1.9,
  น้อย: 1.2,
  เบา: 1.375,
  เล็กน้อย: 1.375,
  ปานกลาง: 1.55,
  มาก: 1.55,
  หนัก: 1.725,
  หนักมาก: 1.9,
};

export function getActivityFactor(activityLevel?: string | null) {
  return ACTIVITY_FACTORS[String(activityLevel || "").trim().toLowerCase()] ?? 1.2;
}
