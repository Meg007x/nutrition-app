import { API_BASE_URL } from "../constants/config";

// Types
export type Food = { food_id: string; name: string; image_url?: string; category?: string; kcal?: number };
export type Slot = {
  slot_name: string; meal_type: string; status?: string; target_kcal?: number;
  target_nutrition?: { protein_g?: number; carb_g?: number; fat_g?: number; fiber_g?: number; sodium_mg?: number };
  main_food?: Food | null; addons?: Food[]; original_main_food_id?: string | null;
  current_main_food_id?: string | null; is_swapped?: boolean; swap_history?: any[];
};
export type DailyPlan = {
  plan_id: string; plan_status: string; user_id: string; date: string; plan_type: string;
  generated_by: string; goal: string; meals_per_day: number; slots: Slot[];
  daily_target_summary?: { kcal?: number; protein_g?: number; carb_g?: number; fat_g?: number; fiber_g?: number; sodium_mg?: number };
};
export type SearchResult = { _id: string; name: string; name_en: string; category: string; image: string; nutrition_per_portion: any; allergens: string[] };

// API
export async function getUserPlan(userId: string) {
  const r = await fetch(`${API_BASE_URL}/meal/user/${encodeURIComponent(userId)}`);
  const d = await r.json();
  if (!r.ok && r.status !== 200) throw new Error(d?.message || "ไม่สามารถโหลดแผนอาหารได้");
  return d;
}

export async function replaceMeal(planId: string, date: string, slotIndex: number, foodId: string) {
  const r = await fetch(`${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}/meal`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, slot_index: slotIndex, food_id: foodId }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ไม่สามารถแทนที่มื้ออาหารได้");
  return d;
}

export async function deleteMeal(planId: string, mealId: string, date: string) {
  const r = await fetch(`${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}/meal/${mealId}?date=${date}`, { method: "DELETE" });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ไม่สามารถลบมื้ออาหารได้");
  return d;
}

export async function deletePlan(planId: string) {
  const r = await fetch(`${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}`, { method: "DELETE" });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ไม่สามารถลบแผนอาหารได้");
  return d;
}

export async function searchFoods(query: string, limit = 20) {
  const r = await fetch(`${API_BASE_URL}/meal/search-foods?q=${encodeURIComponent(query)}&limit=${limit}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ไม่สามารถค้นหาอาหารได้");
  return d;
}

export async function toggleMealStatus(planId: string, date: string, slotIndex: number, newStatus: string) {
  const r = await fetch(`${API_BASE_URL}/meal/plans/${encodeURIComponent(planId)}/meal`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, slot_index: slotIndex, status: newStatus }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.message || "ไม่สามารถอัปเดตสถานะได้");
  return d;
}

// Helpers
export function getTodayDate(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function getTodayPlan(plans: DailyPlan[]): DailyPlan | null {
  return plans.find((p) => p.date === getTodayDate()) || null;
}

export function getEatenKcal(plan: DailyPlan | null): number {
  if (!plan) return 0;
  return plan.slots.reduce((t, s) => t + (s.status === "eaten" && s.main_food ? s.main_food.kcal || 0 : 0), 0);
}

export function getTargetKcal(plan: DailyPlan | null): number {
  return plan?.daily_target_summary?.kcal || 0;
}

export function getEatenCount(plan: DailyPlan | null): number {
  if (!plan) return 0;
  return plan.slots.filter((s) => s.status === "eaten").length;
}