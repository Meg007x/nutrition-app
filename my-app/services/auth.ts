import { apiRequest } from "./api";
import type { RegisterData } from "../types/register-types";

type AuthResponse = {
  message: string;
  user: any;
};

const mapGoalToBackend = (goalType: RegisterData["goalType"]) => {
  if (goalType === "lose_weight") return "ลดน้ำหนัก";
  if (goalType === "gain_weight") return "เพิ่มกล้ามเนื้อ";
  return "รักษาน้ำหนัก";
};

const mapActivityToBackend = (activityLevel: RegisterData["activityLevel"]) => {
  if (activityLevel === "sedentary") return "น้อย";
  if (activityLevel === "light") return "น้อย";
  if (activityLevel === "moderate") return "ปานกลาง";
  if (activityLevel === "active") return "มาก";
  if (activityLevel === "very_active") return "หนัก";
  return "น้อย";
};

const mapMealSchedules = (form: RegisterData) => {
  const mealTimes: any = form.mealTimes;

  if (Array.isArray(mealTimes)) {
    return mealTimes
      .filter((item) => item?.time)
      .map((item) => ({
        name: item.name,
        time: item.time,
        notify: item.notify ?? true,
      }));
  }

  const schedules = [
    mealTimes?.breakfast
      ? { name: "เช้า", time: mealTimes.breakfast, notify: true }
      : null,
    mealTimes?.lunch
      ? { name: "กลางวัน", time: mealTimes.lunch, notify: true }
      : null,
    mealTimes?.dinner
      ? { name: "เย็น", time: mealTimes.dinner, notify: true }
      : null,
    mealTimes?.snack
      ? { name: "ดึก", time: mealTimes.snack, notify: true }
      : null,
  ].filter(Boolean) as { name: string; time: string; notify: boolean }[];

  return schedules;
};

export async function registerUserFromForm(form: RegisterData): Promise<AuthResponse> {
  const mealSchedules = mapMealSchedules(form);

  const durationWeeksNumber = form.goalDurationWeeks
    ? Number(String(form.goalDurationWeeks).replace(/[^\d]/g, ""))
    : null;

  // 🟢 คำนวณอายุจากวันเกิดเพื่อส่งให้ Backend
  const calculateAge = (dob: string): number => {
    if (!dob) return 20;
    const birth = new Date(dob);
    const now = new Date();
    let a = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
    return a;
  };

  const payload = {
    username: (form as any).username || form.name,
    email: (form as any).email,
    password: (form as any).password,
    gender: form.gender,
    date_of_birth: (form as any).dateOfBirth,

    height_cm: Number(form.heightCm),
    weight_kg: Number(form.weightKg),

    primary_goal: mapGoalToBackend(form.goalType),
    target_weight_kg: form.targetWeightKg ? Number(form.targetWeightKg) : null,
    duration_weeks: durationWeeksNumber,
    activity_level: mapActivityToBackend(form.activityLevel),
    protein_target_g: form.recommendedProteinG ?? null,

    allergies: form.allergies,
    disliked_foods: form.dislikedFoods,
    interested_cuisines: form.interestedCuisines,

    meals_per_day: mealSchedules.length || 3,
    meal_schedules: mealSchedules,
  };

  // 🟢 Debug: log payload ก่อนส่ง เพื่อตรวจสอบโครงสร้าง
  console.log("📤 Payload ที่ส่งไป Backend:", JSON.stringify(payload, null, 2));

  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: {
      email: email.trim().toLowerCase(),
      password,
    },
  });
}