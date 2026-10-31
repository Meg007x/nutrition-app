"use strict";

const FAT_CALORIE_RATIO = 0.25;
const CALORIES_PER_GRAM = {
  protein: 4,
  carbohydrate: 4,
  fat: 9,
};

function calculateMacroTargets(targetCalories, proteinTargetG) {
  const calories = Number(targetCalories);
  const protein = Math.round(Number(proteinTargetG));

  if (!Number.isFinite(calories) || calories <= 0) {
    return {
      valid: false,
      message: "ไม่พบเป้าหมายพลังงานที่ถูกต้อง กรุณาตรวจสอบข้อมูลสุขภาพ",
    };
  }

  if (!Number.isFinite(protein) || protein <= 0) {
    return {
      valid: false,
      message: "ไม่พบเป้าหมายโปรตีนที่ถูกต้อง กรุณาตรวจสอบข้อมูลสุขภาพ",
    };
  }

  const fatG = Math.round(
    (calories * FAT_CALORIE_RATIO) / CALORIES_PER_GRAM.fat
  );
  const remainingCalories =
    calories -
    protein * CALORIES_PER_GRAM.protein -
    fatG * CALORIES_PER_GRAM.fat;

  if (remainingCalories < 0) {
    return {
      valid: false,
      message:
        "เป้าหมายโปรตีนสูงเกินพลังงานที่เหลือหลังจัดสรรไขมัน กรุณาปรับเป้าหมายโปรตีนหรือแคลอรี่",
    };
  }

  return {
    valid: true,
    target_calories: calories,
    target_protein_g: protein,
    target_carb_g: Math.round(
      remainingCalories / CALORIES_PER_GRAM.carbohydrate
    ),
    target_fat_g: fatG,
  };
}

module.exports = { calculateMacroTargets };
