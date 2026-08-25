import { API_BASE_URL } from "../constants/config";

/* =========================================================
   TYPES
========================================================= */

export type Food = {
  _id?: string;
  food_id?: string;

  name: string;
  name_en?: string;

  image?: string;
  image_url?: string;

  category?: string;

  kcal?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;

  nutrition_per_portion?: {
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };

  portion?: any;
  ingredients?: any[];
};

export type Slot = {
  slot_name: string;
  meal_type: string;

  status?: string;

  target_kcal?: number;

  main_food?: Food | null;
  addons?: Food[];

  /*
   * บาง backend อาจส่ง _id หรือ meal_id
   * จึงรองรับทั้งสองแบบ
   */
  _id?: string;
  meal_id?: string;
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

/* =========================================================
   HELPER
========================================================= */

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

/* =========================================================
   GET USER PLAN
========================================================= */

export async function getUserPlan(userId: string) {
  if (!userId || !userId.trim()) {
    throw new Error("user_id ไม่ถูกต้อง");
  }

  const url =
    `${API_BASE_URL}/meal/user/` +
    `${encodeURIComponent(userId)}`;

  console.log("[GET USER PLAN]");
  console.log("URL:", url);

  let r: Response;

  try {
    r = await fetch(url);
  } catch (error: any) {
    console.error("[GET USER PLAN ERROR]", error);

    throw new Error(
      `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ${
        error?.message || "Network error"
      }`
    );
  }

  const d = await parseResponse(r);

  console.log("[GET USER PLAN RESPONSE]", r.status, d);

  if (!r.ok) {
    throw new Error(
      d?.message || "โหลดแผนอาหารไม่ได้"
    );
  }

  return d;
}

/* =========================================================
   GET FOOD
========================================================= */

export async function getFood(foodId: string) {
  if (!foodId || !foodId.trim()) {
    throw new Error("food_id ไม่ถูกต้อง");
  }

  const url =
    `${API_BASE_URL}/meal/foods/` +
    `${encodeURIComponent(foodId)}`;

  const r = await fetch(url);

  const d = await parseResponse(r);

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "โหลดรายละเอียดอาหารไม่ได้"
    );
  }

  return d.food;
}

/* =========================================================
   SEARCH FOOD
========================================================= */

export async function searchFoods(
  q: string,
  limit = 20
) {
  const url =
    `${API_BASE_URL}/meal/search-foods` +
    `?q=${encodeURIComponent(q)}` +
    `&limit=${limit}`;

  const r = await fetch(url);

  const d = await parseResponse(r);

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "ค้นหาอาหารไม่ได้"
    );
  }

  return d;
}

/* =========================================================
   REPLACE MEAL
========================================================= */

export async function replaceMeal(
  planId: string,
  date: string,
  slotIndex: number,
  foodId: string
) {
  if (!planId?.trim()) {
    throw new Error("plan_id ไม่ถูกต้อง");
  }

  if (!date?.trim()) {
    throw new Error("date ไม่ถูกต้อง");
  }

  if (!foodId?.trim()) {
    throw new Error("food_id ไม่ถูกต้อง");
  }

  const url =
    `${API_BASE_URL}/meal/plans/` +
    `${encodeURIComponent(planId)}/meal`;

  const r = await fetch(url, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      date,
      slot_index: slotIndex,
      food_id: foodId,
    }),
  });

  const d = await parseResponse(r);

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "เปลี่ยนอาหารไม่ได้"
    );
  }

  return d;
}

/* =========================================================
   DELETE MEAL
   ลบเฉพาะเมนู
========================================================= */

export async function deleteMeal(
  planId: string,
  mealId: string,
  date: string
) {
  if (!planId?.trim()) {
    throw new Error("plan_id ไม่ถูกต้อง");
  }

  if (!mealId?.trim()) {
    throw new Error("meal_id ไม่ถูกต้อง");
  }

  if (!date?.trim()) {
    throw new Error("date ไม่ถูกต้อง");
  }

  const url =
    `${API_BASE_URL}/meal/plans/` +
    `${encodeURIComponent(planId)}` +
    `/meal/` +
    `${encodeURIComponent(mealId)}` +
    `?date=${encodeURIComponent(date)}`;

  console.log("[DELETE MEAL]");
  console.log("planId:", planId);
  console.log("mealId:", mealId);
  console.log("date:", date);
  console.log("URL:", url);

  let r: Response;

  try {
    r = await fetch(url, {
      method: "DELETE",
    });
  } catch (error: any) {
    console.error(
      "[DELETE MEAL NETWORK ERROR]",
      error
    );

    throw new Error(
      `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ${
        error?.message ||
        "Network error"
      }`
    );
  }

  const d = await parseResponse(r);

  console.log(
    "[DELETE MEAL RESPONSE]",
    r.status,
    d
  );

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "ลบมื้ออาหารไม่ได้"
    );
  }

  return d;
}

/* =========================================================
   DELETE PLAN DAY
   ลบเฉพาะวันที่เลือก
========================================================= */

export async function deletePlanDay(
  planId: string,
  date: string
) {
  if (!planId || !planId.trim()) {
    throw new Error("plan_id ไม่ถูกต้อง");
  }

  if (!date || !date.trim()) {
    throw new Error("date ไม่ถูกต้อง");
  }

  const url =
    `${API_BASE_URL}/meal/plans/` +
    `${encodeURIComponent(planId)}` +
    `/day/` +
    `${encodeURIComponent(date)}`;

  console.log("==============================");
  console.log("[DELETE PLAN DAY]");
  console.log("planId:", planId);
  console.log("date:", date);
  console.log("URL:", url);
  console.log("==============================");

  let r: Response;

  try {
    r = await fetch(url, {
      method: "DELETE",
    });
  } catch (error: any) {
    console.error(
      "[DELETE PLAN DAY NETWORK ERROR]",
      error
    );

    throw new Error(
      `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ${
        error?.message ||
        "Network error"
      }`
    );
  }

  const d = await parseResponse(r);

  console.log(
    "[DELETE PLAN DAY RESPONSE]",
    r.status,
    d
  );

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "ลบแผนของวันนี้ไม่ได้"
    );
  }

  return d;
}

/* =========================================================
   DELETE ENTIRE PLAN
   ลบทุกวันที่มี plan_id เดียวกัน
========================================================= */

export async function deletePlan(
  planId: string
) {
  if (
    typeof planId !== "string" ||
    !planId.trim()
  ) {
    console.error(
      "[DELETE PLAN] invalid planId:",
      planId
    );

    throw new Error(
      "plan_id ไม่ถูกต้อง"
    );
  }

  const url =
    `${API_BASE_URL}/meal/plans/` +
    `${encodeURIComponent(planId)}`;

  console.log("==============================");
  console.log("[DELETE ENTIRE PLAN]");
  console.log("planId:", planId);
  console.log("URL:", url);
  console.log("==============================");

  let r: Response;

  try {
    r = await fetch(url, {
      method: "DELETE",
    });
  } catch (networkErr: any) {
    console.error(
      "[DELETE PLAN NETWORK ERROR]",
      networkErr
    );

    throw new Error(
      `เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: ${
        networkErr?.message ||
        "Network error"
      }`
    );
  }

  console.log(
    "[DELETE PLAN RESPONSE STATUS]",
    r.status
  );

  const d = await parseResponse(r);

  console.log(
    "[DELETE PLAN RESPONSE BODY]",
    d
  );

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "ลบแผนไม่ได้"
    );
  }

  console.log(
    "[DELETE PLAN SUCCESS]",
    d
  );

  return d;
}

/* =========================================================
   TOGGLE MEAL STATUS
========================================================= */

export async function toggleMealStatus(
  planId: string,
  date: string,
  slotIndex: number,
  status: string
) {
  if (!planId?.trim()) {
    throw new Error("plan_id ไม่ถูกต้อง");
  }

  if (!date?.trim()) {
    throw new Error("date ไม่ถูกต้อง");
  }

  const url =
    `${API_BASE_URL}/meal/plans/` +
    `${encodeURIComponent(planId)}/meal`;

  const r = await fetch(url, {
    method: "PUT",

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({
      date,
      slot_index: slotIndex,
      status,
    }),
  });

  const d = await parseResponse(r);

  if (!r.ok) {
    throw new Error(
      d?.message ||
        "อัปเดตสถานะไม่ได้"
    );
  }

  return d;
}

/* =========================================================
   TODAY DATE
========================================================= */

export function getTodayDate() {
  const d = new Date();

  return (
    `${d.getFullYear()}-` +
    `${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-` +
    `${String(
      d.getDate()
    ).padStart(2, "0")}`
  );
}

/* =========================================================
   TODAY PLAN
========================================================= */

export function getTodayPlan(
  plans: DailyPlan[]
) {
  const today = getTodayDate();

  return (
    plans.find(
      (p) => p.date === today
    ) || null
  );
}

/* =========================================================
   FOOD NUTRITION
========================================================= */

function getFoodNutrition(
  food?: Food | null
) {
  const n =
    food?.nutrition_per_portion;

  return {
    kcal:
      Number(
        n?.kcal ??
          food?.kcal ??
          0
      ) || 0,

    protein:
      Number(
        n?.protein_g ??
          food?.protein_g ??
          0
      ) || 0,

    carbs:
      Number(
        n?.carb_g ??
          food?.carb_g ??
          0
      ) || 0,

    fat:
      Number(
        n?.fat_g ??
          food?.fat_g ??
          0
      ) || 0,

    fiber:
      Number(
        n?.fiber_g ??
          food?.fiber_g ??
          0
      ) || 0,

    sodium:
      Number(
        n?.sodium_mg ??
          food?.sodium_mg ??
          0
      ) || 0,
  };
}

/* =========================================================
   EATEN NUTRITION (all macros)
========================================================= */

export function getEatenNutrition(
  plan: DailyPlan | null
) {
  if (!plan) {
    return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };
  }

  return plan.slots.reduce(
    (total, slot) => {
      if (slot.status !== "eaten") {
        return total;
      }

      const main = getFoodNutrition(slot.main_food);

      const addonsTotal = (slot.addons || []).reduce(
        (acc, addon) => {
          const an = getFoodNutrition(addon);
          return {
            kcal: acc.kcal + an.kcal,
            protein: acc.protein + an.protein,
            carbs: acc.carbs + an.carbs,
            fat: acc.fat + an.fat,
            fiber: acc.fiber + an.fiber,
            sodium: acc.sodium + an.sodium,
          };
        },
        { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
      );

      return {
        kcal: total.kcal + main.kcal + addonsTotal.kcal,
        protein: total.protein + main.protein + addonsTotal.protein,
        carbs: total.carbs + main.carbs + addonsTotal.carbs,
        fat: total.fat + main.fat + addonsTotal.fat,
        fiber: total.fiber + main.fiber + addonsTotal.fiber,
        sodium: total.sodium + main.sodium + addonsTotal.sodium,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
}

/* =========================================================
   EATEN KCAL
========================================================= */

export function getEatenKcal(
  plan: DailyPlan | null
) {
  if (!plan) {
    return 0;
  }

  return plan.slots.reduce(
    (total, slot) => {
      if (
        slot.status !== "eaten"
      ) {
        return total;
      }

      return (
        total +
        getFoodNutrition(
          slot.main_food
        ).kcal
      );
    },
    0
  );
}

/* =========================================================
   TARGET KCAL
========================================================= */

export function getTargetKcal(
  plan: DailyPlan | null
) {
  return (
    plan?.daily_target_summary
      ?.kcal || 0
  );
}

/* =========================================================
   EATEN COUNT
========================================================= */

export function getEatenCount(
  plan: DailyPlan | null
) {
  return (
    plan?.slots.filter(
      (slot) =>
        slot.status === "eaten"
    ).length || 0
  );
}