export function calculateTargetCalories(
  tdee: number,
  primaryGoal?: string | null
): number {
  const goal = String(primaryGoal || "").trim().toLowerCase();

  if (
    goal === "ลดน้ำหนัก" ||
    goal === "lose_weight" ||
    goal === "ลดน้ำหนัก/ลดไขมัน"
  ) {
    return Math.max(1000, Math.round(tdee - 300));
  }

  if (
    goal === "เพิ่มน้ำหนัก" ||
    goal === "gain_weight" ||
    goal === "เพิ่มกล้ามเนื้อ" ||
    goal === "gain_muscle" ||
    goal === "build_muscle"
  ) {
    return Math.round(tdee + 200);
  }

  return Math.round(tdee);
}
