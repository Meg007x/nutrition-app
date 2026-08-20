import { API_BASE_URL } from "../constants/config";

export type Food = {
  food_id: string;
  name: string;
  image_url?: string;
  category?: string;
  kcal?: number;
};

export type Slot = {
  slot_name: string;
  meal_type: string;
  status?: string;
  target_kcal?: number;
  main_food?: Food | null;
};

export type DailyPlan = {
  plan_id: string;
  plan_status: string;
  user_id: string;
  date: string;
  slots: Slot[];
  daily_target_summary?: {
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };
};

export type SearchResult = {
  _id: string;
  name: string;
  name_en?: string;
  category?: string;
  image?: string;
  nutrition_per_portion?: any;
  portion?: any;
  ingredients?: any[];
  allergens?: string[];
};

export async function getUserPlan(userId: string) {
  const r = await fetch(`${API_BASE_URL}/meal/user/${encodeURIComponent(userId)}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "โหลดแผนอาหารไม่ได้");
  return d;
}

export async function getFood(foodId: string) {
  const r = await fetch(`${API_BASE_URL}/meal/foods/${encodeURIComponent(foodId)}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "โหลดรายละเอียดอาหารไม่ได้");
  return d.food;
}

export async function searchFoods(q: string, limit = 20) {
  const r = await fetch(
    `${API_BASE_URL}/meal/search-foods?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ค้นหาอาหารไม่ได้");
  return d;
}

export async function replaceMeal(
  planId: string,
  date: string,
  slotIndex: number,
  foodId: string
) {
  const r = await fetch(
    `${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}/meal`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        slot_index: slotIndex,
        food_id: foodId,
      }),
    }
  );

  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "เปลี่ยนอาหารไม่ได้");
  return d;
}

export async function deleteMeal(
  planId: string,
  mealId: string,
  date: string
) {
  const r = await fetch(
    `${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}/meal/${mealId}?date=${encodeURIComponent(date)}`,
    { method: "DELETE" }
  );

  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ลบมื้ออาหารไม่ได้");
  return d;
}

export async function deletePlan(planId: string) {
  const r = await fetch(
    `${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}`,
    { method: "DELETE" }
  );

  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ลบแผนไม่ได้");
  return d;
}

export async function toggleMealStatus(
  planId: string,
  date: string,
  slotIndex: number,
  status: string
) {
  return replaceMealStatus(planId, date, slotIndex, status);
}

async function replaceMealStatus(
  planId: string,
  date: string,
  slotIndex: number,
  status: string
) {
  const r = await fetch(
    `${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}/meal`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        slot_index: slotIndex,
        status,
      }),
    }
  );

  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "อัปเดตสถานะไม่ได้");
  return d;
}

export function getTodayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function getTodayPlan(plans: DailyPlan[]) {
  return plans.find((p) => p.date === getTodayDate()) || null;
}

export function getEatenKcal(plan: DailyPlan | null) {
  return (
    plan?.slots.reduce(
      (n, s) => n + (s.status === "eaten" ? s.main_food?.kcal || 0 : 0),
      0
    ) || 0
  );
}

export function getTargetKcal(plan: DailyPlan | null) {
  return plan?.daily_target_summary?.kcal || 0;
}

export function getEatenCount(plan: DailyPlan | null) {
  return plan?.slots.filter((s) => s.status === "eaten").length || 0;
}