function calculateTargetCalories(tdee, primaryGoal) {
  const goal = String(primaryGoal || "").trim().toLowerCase();

  if (
    ["ลดน้ำหนัก", "lose_weight", "ลดน้ำหนัก/ลดไขมัน"].includes(goal)
  ) {
    return Math.max(1000, Math.round(Number(tdee) - 300));
  }

  if (
    [
      "เพิ่มน้ำหนัก",
      "gain_weight",
      "เพิ่มกล้ามเนื้อ",
      "gain_muscle",
      "build_muscle",
    ].includes(goal)
  ) {
    return Math.round(Number(tdee) + 200);
  }

  return Math.round(Number(tdee));
}

module.exports = { calculateTargetCalories };
