import { BASE_URL } from "../../constants/config";

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getUserPlan,
  getPlanById,
  getFood,
  deletePlan as apiDeletePlan,
  deletePlanDay,
  replaceMeal,
  deleteMeal,
  toggleMealStatus,
  getTodayDate,
  getTodayPlan,
  getEatenKcal,
  getTargetKcal,
  getEatenCount,
  getEatenNutrition,
  logPlannedMeal,
  searchSafeFoods,
  type DailyPlan,
  type SearchResult,
} from "../../services/mealPlanService";

const ORANGE = "#DF9226";
type FoodCategoryOption = { field: "category" | "category_type"; value: string; label: string };

/* =========================================================
   DATE HELPERS
========================================================= */

function parseDate(ds: string) {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(ds: string) {
  const d = parseDate(ds);

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}

function thaiDay(ds: string) {
  return [
    "อา.",
    "จ.",
    "อ.",
    "พ.",
    "พฤ.",
    "ศ.",
    "ส.",
  ][parseDate(ds).getDay()];
}

function thaiDate(ds: string) {
  const d = parseDate(ds);

  const mo = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543
    }`;
}

function mealIcon(mt: string) {
  const t = String(mt || "").toLowerCase();

  if (
    t.includes("breakfast") ||
    t.includes("เช้า")
  ) {
    return "sunny-outline";
  }

  if (
    t.includes("lunch") ||
    t.includes("กลางวัน")
  ) {
    return "partly-sunny-outline";
  }

  if (
    t.includes("dinner") ||
    t.includes("เย็น")
  ) {
    return "moon-outline";
  }

  return "restaurant-outline";
}

/* =========================================================
   FOOD HELPERS
========================================================= */

function getFoodImage(food: any): string | null {
  if (!food) return null;

  const image =
    food.image ||
    food.image_url ||
    food.imageUrl ||
    food.photo ||
    food.photo_url ||
    food.thumbnail ||
    null;

  if (
    !image ||
    typeof image !== "string"
  ) {
    return null;
  }

  const value = image.trim();

  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  let filename = value;

  filename = filename.replace(/\\/g, "/");

  filename = filename
    .replace(/^\/+/, "")
    .replace(/^uploads\/master\//i, "")
    .replace(/^master\//i, "");

  filename =
    filename.split("/").pop() ||
    filename;

  return `${BASE_URL}/uploads/master/${encodeURIComponent(
    filename
  )}`;
}

function getFoodName(food: any): string {
  return (
    food?.name ||
    food?.food_name ||
    food?.menu_name ||
    "ไม่มีชื่อเมนู"
  );
}

function getFoodEnglishName(
  food: any
): string | null {
  return (
    food?.name_en ||
    food?.food_name_en ||
    food?.menu_name_en ||
    null
  );
}

function getNutrition(food: any) {
  const n =
    food?.nutrition_per_portion ||
    food?.nutrition ||
    food?.nutrients ||
    {};

  return {
    kcal:
      Number(
        n?.kcal ??
        food?.kcal ??
        food?.calories ??
        0
      ) || 0,

    protein:
      Number(
        n?.protein_g ??
        n?.protein ??
        food?.protein_g ??
        food?.protein ??
        0
      ) || 0,

    carbs:
      Number(
        n?.carb_g ??
        n?.carbs_g ??
        n?.carbohydrate_g ??
        n?.carbs ??
        food?.carb_g ??
        food?.carbs ??
        0
      ) || 0,

    fat:
      Number(
        n?.fat_g ??
        n?.fat ??
        food?.fat_g ??
        food?.fat ??
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

function getSlotNutrition(slot: any) {
  const foods = [slot?.main_food, ...(Array.isArray(slot?.addons) ? slot.addons : [])].filter(Boolean);
  return foods.reduce((total, food) => {
    const nutrition = getNutrition(food);
    return {
      kcal: total.kcal + nutrition.kcal,
      protein: total.protein + nutrition.protein,
      carbs: total.carbs + nutrition.carbs,
      fat: total.fat + nutrition.fat,
      fiber: total.fiber + nutrition.fiber,
      sodium: total.sodium + nutrition.sodium,
    };
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 });
}

function getIngredients(food: any): any[] {
  if (!food) return [];

  const ingredients =
    food?.ingredients || [];

  return Array.isArray(ingredients)
    ? ingredients
    : [];
}

function formatIngredient(
  ingredient: any
): string {
  if (!ingredient) return "";

  const name =
    ingredient?.name ||
    ingredient?.ingredient_name ||
    ingredient?.food_name ||
    ingredient?.ingredient_id ||
    "";

  const qty =
    ingredient?.qty ??
    ingredient?.amount ??
    "";

  const unit =
    ingredient?.unit ||
    "";

  const parts: string[] = [];

  if (name) {
    parts.push(String(name));
  }

  if (
    qty !== "" &&
    qty !== null &&
    qty !== undefined
  ) {
    parts.push(String(qty));
  }

  if (unit) {
    parts.push(String(unit));
  }

  return parts.join(" ");
}

/* =========================================================
   PLAN SCREEN
========================================================= */

export default function PlanScreen() {
  const params = useLocalSearchParams<{ plan_id?: string | string[] }>();
  const requestedPlanId = Array.isArray(params.plan_id)
    ? params.plan_id[0] || ""
    : params.plan_id || "";

  const [plans, setPlans] =
    useState<DailyPlan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [hasPlan, setHasPlan] =
    useState(false);

  /*
   * null = ไม่มีการลบ
   * ALL = กำลังลบทั้งหมด
   * planId = กำลังลบแผนหนึ่ง
   */
  const [deletingPlanId, setDeletingPlanId] =
    useState<string | null>(null);

  /*
   * ใช้กันกรณี API/load คืนข้อมูลเก่ากลับมา
   */
  const justDeletedPlanIds =
    useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] =
    useState<"today" | "full">(
      "today"
    );

  const [dayIdx, setDayIdx] =
    useState(0);

  /* =====================================================
     SEARCH / REPLACE
  ===================================================== */

  const [showModal, setShowModal] =
    useState(false);

  const [selSlot, setSelSlot] =
    useState<{
      planId: string;
      date: string;
      idx: number;
      name: string;
      mode: "replace" | "add";
    } | null>(null);

  const [searchQ, setSearchQ] =
    useState("");

  const [kcalFilter, setKcalFilter] =
    useState("");

  const [calorieFilterInfo, setCalorieFilterInfo] =
    useState<{
      target_kcal: number;
      tolerance: number;
      has_matches: boolean;
    } | null>(null);

  const [searchError, setSearchError] =
    useState("");

  const [searchRes, setSearchRes] =
    useState<SearchResult[]>([]);

  const [foodCategories, setFoodCategories] = useState<FoodCategoryOption[]>([]);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<FoodCategoryOption | null>(null);

  const [searching, setSearching] =
    useState(false);

  const timerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  /* =====================================================
     FOOD DETAIL
  ===================================================== */

  const [
    showFoodDetail,
    setShowFoodDetail,
  ] = useState(false);

  const [
    selectedFood,
    setSelectedFood,
  ] = useState<any>(null);

  const [foodDetailTab, setFoodDetailTab] = useState<"nutrition" | "ingredients">("nutrition");
  const [foodDetailLoading, setFoodDetailLoading] = useState(false);
  const [savingFoodSelection, setSavingFoodSelection] = useState(false);
  const [mealStatusError, setMealStatusError] = useState("");

  /* =====================================================
     GET USER ID
  ===================================================== */

  async function getUid() {
    for (const key of [
      "user_id",
      "userId",
    ]) {
      const value =
        await AsyncStorage.getItem(
          key
        );

      if (value) {
        return value;
      }
    }

    const raw =
      await AsyncStorage.getItem(
        "currentUser"
      );

    if (raw) {
      try {
        const user =
          JSON.parse(raw);

        if (user?.user_id) {
          return String(
            user.user_id
          );
        }

        if (user?.userId) {
          return String(
            user.userId
          );
        }

        if (user?._id) {
          return String(
            user._id
          );
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /* =====================================================
     LOAD PLAN
  ===================================================== */

  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);

      const data = requestedPlanId
        ? await getPlanById(requestedPlanId)
        : await (async () => {
            const uid = await getUid();
            return uid ? getUserPlan(uid) : null;
          })();

      if (!data) {
        setPlans([]);
        setHasPlan(false);
        return;
      }

      const p =
        Array.isArray(data?.plans)
          ? data.plans.filter(
            (plan: DailyPlan) =>
              (!requestedPlanId || plan.plan_id === requestedPlanId) &&
              !justDeletedPlanIds.current.has(plan.plan_id)
          )
          : [];

      setPlans(p);
      setHasPlan(
        p.length > 0
      );
      if (requestedPlanId) {
        setActiveTab("today");
      }

      const today =
        getTodayDate();

      const ti =
        p.findIndex(
          (x: DailyPlan) =>
            x.date === today
        );

      if (ti >= 0) {
        setDayIdx(ti);
      } else if (
        p.length > 0
      ) {
        setDayIdx((prev) =>
          prev >= p.length
            ? p.length - 1
            : prev
        );
      } else {
        setDayIdx(0);
      }
    } catch (e: any) {
      console.error(
        "loadPlan error:",
        e
      );

      setPlans([]);
      setHasPlan(false);

      Alert.alert(
        "โหลดแผนไม่สำเร็จ",
        e?.message ||
        "ไม่สามารถโหลดแผนอาหารได้"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestedPlanId]);

  useFocusEffect(
    useCallback(() => {
      void loadPlan();
    }, [loadPlan])
  );

  /* =====================================================
     TODAY DATA
  ===================================================== */

  const todayPlan =
    useMemo(
      () =>
        getTodayPlan(plans),
      [plans]
    );

  const eatenKcal =
    useMemo(
      () =>
        getEatenKcal(
          todayPlan
        ),
      [todayPlan]
    );

  const eatenNutrition =
    useMemo(
      () =>
        getEatenNutrition(
          todayPlan
        ),
      [todayPlan]
    );

  const targetKcal =
    useMemo(
      () =>
        getTargetKcal(
          todayPlan
        ),
      [todayPlan]
    );

  const eatenCount =
    useMemo(
      () =>
        getEatenCount(
          todayPlan
        ),
      [todayPlan]
    );

  const remainingTodayMeals = useMemo(
    () => todayPlan?.slots.filter((slot) => slot.status === "pending").length || 0,
    [todayPlan]
  );
  const skippedTodayMeals = useMemo(
    () => todayPlan?.slots.filter((slot) => slot.status === "skipped").length || 0,
    [todayPlan]
  );

  const selDay =
    plans[dayIdx] || null;

  /* =========================================================
     CLEAR CURRENT PLAN ID
  ========================================================= */

  async function clearCurrentPlanIfNeeded(
    deletedPlanId: string
  ) {
    try {
      const currentPlanId =
        await AsyncStorage.getItem(
          "currentPlanId"
        );

      if (
        currentPlanId &&
        currentPlanId ===
        deletedPlanId
      ) {
        await AsyncStorage.removeItem(
          "currentPlanId"
        );

        console.log(
          "[DELETE] cleared currentPlanId:",
          deletedPlanId
        );
      }
    } catch (e) {
      console.warn(
        "clear currentPlanId error:",
        e
      );
    }
  }

  /* =========================================================
     DELETE ONE DAY
     
     สำคัญ:
     ใช้ plan_id + date
     ไม่ใช้ deletePlan(planId)
     เพราะ deletePlan(planId) จะลบทั้งชุด
  ========================================================= */

  async function handleDeletePlanDay(
    plan: DailyPlan
  ) {
    if (
      !plan?.plan_id ||
      !plan?.date
    ) {
      Alert.alert(
        "ผิดพลาด",
        "ข้อมูลแผนไม่ถูกต้อง"
      );
      return;
    }

    if (deletingPlanId) {
      return;
    }

    const planId =
      String(plan.plan_id);

    const date =
      String(plan.date);

    setDeletingPlanId(
      `${planId}:${date}`
    );

    try {
      console.log(
        "[DELETE DAY] start:",
        {
          planId,
          date,
        }
      );

      /*
       * DELETE เฉพาะวัน
       */
      await deletePlanDay(
        planId,
        date
      );

      /*
       * ลบออกจาก state ทันที
       */
      setPlans((current) => {
        const index =
          current.findIndex(
            (x) =>
              x.plan_id ===
              planId &&
              x.date === date
          );

        const updated =
          current.filter(
            (x) =>
              !(
                x.plan_id ===
                planId &&
                x.date === date
              )
          );

        /*
         * ปรับ dayIdx
         */
        setDayIdx((oldIdx) => {
          if (
            updated.length === 0
          ) {
            return 0;
          }

          if (
            index < 0
          ) {
            return Math.min(
              oldIdx,
              updated.length - 1
            );
          }

          /*
           * ถ้าลบ item ก่อนหน้า index ปัจจุบัน
           */
          if (
            index < oldIdx
          ) {
            return Math.max(
              0,
              oldIdx - 1
            );
          }

          /*
           * ถ้า index ปัจจุบันเกินจำนวนใหม่
           */
          return Math.min(
            oldIdx,
            updated.length - 1
          );
        });

        setHasPlan(
          updated.length > 0
        );

        return updated;
      });

      /*
       * currentPlanId:
       *
       * ถ้าลบวันเดียว แต่ยังมีวันอื่นของ
       * plan_id เดิมอยู่ -> ไม่ต้องล้าง
       *
       * ถ้า plan_id นี้ไม่เหลือแล้ว -> ล้าง
       */
      const result = await deletePlanDay(
        plan.plan_id,
        plan.date
      );

      setPlans((current) => {
        return current.filter(
          (p) =>
            !(
              p.plan_id === plan.plan_id &&
              p.date === plan.date
            )
        );
      });

      Alert.alert(
        "สำเร็จ",
        `ลบแผนวันที่ ${thaiDate(
          date
        )} แล้ว`
      );
    } catch (e: any) {
      console.error(
        "[DELETE DAY ERROR]",
        e
      );

      Alert.alert(
        "ลบไม่สำเร็จ",
        e?.message ||
        "ไม่สามารถลบแผนของวันนี้ได้"
      );
    } finally {
      setDeletingPlanId(null);
    }
  }

  /* =========================================================
     CONFIRM DELETE ONE DAY
  ========================================================= */

  function confirmDeletePlanDay(
    plan: DailyPlan
  ) {
    if (
      !plan?.plan_id ||
      !plan?.date
    ) {
      return;
    }

    const message =
      `ต้องการลบแผนอาหารวันที่ ${thaiDate(
        plan.date
      )} หรือไม่?`;

    if (
      Platform.OS ===
      "web"
    ) {
      const ok =
        window.confirm(
          message
        );

      if (ok) {
        handleDeletePlanDay(
          plan
        );
      }

      return;
    }

    Alert.alert(
      "ลบแผนอาหาร",
      message,
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบแผนนี้",
          style: "destructive",
          onPress: () =>
            handleDeletePlanDay(
              plan
            ),
        },
      ]
    );
  }

  /* =========================================================
     DELETE ALL PLANS
  ========================================================= */

  async function handleDeleteAllPlans() {
    if (
      plans.length === 0
    ) {
      return;
    }

    if (deletingPlanId) {
      return;
    }

    setDeletingPlanId(
      "ALL"
    );

    try {
      /*
       * เก็บ plan_id ที่มีจริง
       */
      const planIds =
        Array.from(
          new Set(
            plans
              .map(
                (p) =>
                  String(
                    p.plan_id
                  )
              )
              .filter(Boolean)
          )
        );

      console.log(
        "[DELETE ALL] planIds:",
        planIds
      );

      /*
       * ลบแต่ละ plan_id
       *
       * deletePlan(planId)
       * = ลบทั้งชุดของ plan_id
       */
      for (
        const planId of planIds
      ) {
        await apiDeletePlan(
          planId
        );

        justDeletedPlanIds.current.add(
          planId
        );
      }

      /*
       * ปรับ state
       */
      setPlans([]);
      setHasPlan(false);
      setDayIdx(0);

      /*
       * ล้าง currentPlanId
       */
      await AsyncStorage.removeItem(
        "currentPlanId"
      );

      Alert.alert(
        "สำเร็จ",
        "ลบแผนอาหารทั้งหมดแล้ว"
      );
    } catch (e: any) {
      console.error(
        "[DELETE ALL ERROR]",
        e
      );

      Alert.alert(
        "ลบไม่สำเร็จ",
        e?.message ||
        "ไม่สามารถลบแผนอาหารทั้งหมดได้"
      );
    } finally {
      setDeletingPlanId(
        null
      );
    }
  }

  /* =========================================================
     CONFIRM DELETE ALL
  ========================================================= */

  function confirmDeleteAllPlans() {
    if (
      plans.length === 0
    ) {
      return;
    }

    const message =
      `ต้องการลบแผนอาหารทั้งหมด ${plans.length} วันหรือไม่?`;

    if (
      Platform.OS ===
      "web"
    ) {
      const ok =
        window.confirm(
          message
        );

      if (ok) {
        handleDeleteAllPlans();
      }

      return;
    }

    Alert.alert(
      "ลบแผนอาหารทั้งหมด",
      message,
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบทั้งหมด",
          style: "destructive",
          onPress:
            handleDeleteAllPlans,
        },
      ]
    );
  }

  /* =========================================================
     TOGGLE EATEN
  ========================================================= */

  async function handleToggle(
    planId: string,
    date: string,
    slotIndex: number,
    currentStatus: string
  ) {
    try {
      if (currentStatus === "skipped") {
        setMealStatusError("มื้อนี้ถูกข้ามอยู่ กรุณากดยกเลิกข้ามก่อนจึงจะบันทึกว่ากินแล้วได้");
        return;
      }

      // Only allow toggling for today's date
      const today = getTodayDate();
      if (date !== today) {
        Alert.alert(
          "ไม่สามารถแก้ไขได้",
          "สามารถบันทึกการกินได้เฉพาะวันที่ปัจจุบันเท่านั้น"
        );
        return;
      }

      const newStatus =
        currentStatus ===
          "eaten"
          ? "pending"
          : "eaten";

      await toggleMealStatus(
        planId,
        date,
        slotIndex,
        newStatus
      );

      setPlans((current) =>
        current.map(
          (plan) => {
            if (
              plan.plan_id ===
              planId &&
              plan.date ===
              date
            ) {
              const slots = [
                ...plan.slots,
              ];

              if (
                slots[
                slotIndex
                ]
              ) {
                slots[
                  slotIndex
                ] = {
                  ...slots[
                  slotIndex
                  ],
                  status:
                    newStatus,
                };
              }

              return {
                ...plan,
                slots,
              };
            }

            return plan;
          }
        )
      );
    } catch (e: any) {
      Alert.alert(
        "อัปเดตไม่สำเร็จ",
        e?.message ||
        "ไม่สามารถอัปเดตสถานะมื้ออาหารได้"
      );
    }
  }

  function handleSkipMeal(planId: string, date: string, slotIndex: number, currentStatus: string) {
    const today = getTodayDate();
    if (date !== today) {
      setMealStatusError("สามารถปรับสถานะมื้ออาหารได้เฉพาะวันนี้");
      return;
    }

    const nextStatus = currentStatus === "skipped" ? "pending" : "skipped";
    setMealStatusError("");
    void (async () => {
      try {
        const result = await toggleMealStatus(planId, date, slotIndex, nextStatus);
        if (!result?.success) throw new Error(result?.message || "เซิร์ฟเวอร์ไม่ได้บันทึกสถานะมื้อ");
        const updatedPlan = result.updated_plan;
        setPlans((current) => current.map((plan) => {
          if (plan.plan_id !== planId || plan.date !== date) return plan;
          if (updatedPlan) return updatedPlan;
          const slots = [...plan.slots];
          if (slots[slotIndex]) slots[slotIndex] = { ...slots[slotIndex], status: nextStatus };
          return { ...plan, slots };
        }));
      } catch (error: any) {
        const rawMessage = error?.message || "ไม่สามารถปรับสถานะมื้ออาหารได้";
        const message = rawMessage.includes("status ต้องเป็น")
          ? "เซิร์ฟเวอร์ยังไม่รองรับสถานะข้ามมื้อ กรุณารีสตาร์ต nutrition-backend แล้วลองอีกครั้ง"
          : rawMessage;
        setMealStatusError(message);
        if (Platform.OS !== "web") Alert.alert("อัปเดตไม่สำเร็จ", message);
      }
    })();
  }

  /* =========================================================
     LOG PLANNED MEAL → MealLog
  ========================================================= */

  async function handleLogMeal(
    date: string,
    mealType: string,
    slot: any
  ) {
    try {
      if (slot.status === "skipped") {
        setMealStatusError("มื้อนี้ถูกข้ามอยู่ กรุณากดยกเลิกข้ามก่อนจึงจะบันทึกแผนมื้ออาหารได้");
        return;
      }

      const today = getTodayDate();
      if (date !== today) {
        Alert.alert(
          "ไม่สามารถบันทึกได้",
          "สามารถบันทึกการกินได้เฉพาะวันที่ปัจจุบันเท่านั้น"
        );
        return;
      }

      if (slot.status !== "eaten") {
        Alert.alert(
          "ยังไม่ได้ทำเครื่องหมาย",
          "กรุณาติ๊กวงกลมว่ากินแล้วก่อนบันทึกแผน"
        );
        return;
      }

      const userId = await getUid();
      if (!userId) {
        Alert.alert("ไม่พบผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      Alert.alert(
        "บันทึกแผนมื้ออาหาร",
        `ต้องการบันทึกแผนมื้อ "${mealType}" หรือไม่?`,
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "บันทึก",
            onPress: async () => {
              try {
                await logPlannedMeal(userId, date, mealType, slot);
                await loadPlan();
                Alert.alert("สำเร็จ", "บันทึกแผนมื้ออาหารเรียบร้อยแล้ว");
              } catch (err: any) {
                Alert.alert("บันทึกไม่สำเร็จ", err?.message || "เกิดข้อผิดพลาด");
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("เกิดข้อผิดพลาด", e?.message || "ไม่สามารถบันทึกได้");
    }
  }

  async function handleDeleteAddon(planId: string, date: string, slotIndex: number, addon: any) {
    const foodId = String(addon?.food_id || addon?._id || "");
    if (!foodId) return;
    Alert.alert("ลบเมนูเสริม", `ต้องการลบ ${getFoodName(addon)} ออกจากมื้อนี้หรือไม่?`, [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${BASE_URL}/api/meal/plans/${encodeURIComponent(planId)}/addon`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date, slot_index: slotIndex, food_id: foodId }),
            });
            const result = await response.json();
            if (!response.ok || !result?.success) throw new Error(result?.message || "ลบเมนูเสริมไม่สำเร็จ");
            if (result.updated_plan) {
              setPlans((current) => current.map((plan) => plan.date === date ? result.updated_plan : plan));
            } else {
              await loadPlan();
            }
          } catch (error: any) {
            Alert.alert("ลบเมนูไม่สำเร็จ", error?.message || "เกิดข้อผิดพลาด");
          }
        },
      },
    ]);
  }

  function renderAddonFoods(planId: string, date: string, slotIndex: number, addons: any[] = []) {
    if (!addons.length) return null;
    return (
      <View style={{ marginTop: 10, gap: 8 }}>
        <Text style={{ marginLeft: 30, fontSize: 12, color: "#888", fontWeight: "700" }}>เมนูเสริม</Text>
        {addons.map((addon, addonIndex) => (
          <View key={`${addon.food_id || addon._id || addon.name}-${addonIndex}`} style={{ flexDirection: "row", alignItems: "center", gap: 9, marginLeft: 28, padding: 9, backgroundColor: "#FFF8EB", borderRadius: 10 }}>
            <TouchableOpacity onPress={() => openFoodDetail(addon)} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 9 }}>
              <FoodImage food={addon} size={46} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ color: "#333", fontWeight: "700" }}>{getFoodName(addon)}</Text>
                <Text style={{ color: ORANGE, fontWeight: "700", marginTop: 3 }}>{getNutrition(addon).kcal} kcal</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteAddon(planId, date, slotIndex, addon)} accessibilityLabel={`ลบ${getFoodName(addon)}ออกจากมื้อนี้`} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={19} color="#D64545" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  }

  /* =========================================================
     OPEN CHANGE FOOD
  ========================================================= */

  function openModal(
    planId: string,
    date: string,
    slotIndex: number,
    slotName: string,
    mode: "replace" | "add" = "replace"
  ) {
    setSelSlot({
      planId,
      date,
      idx: slotIndex,
      name: slotName,
      mode,
    });

    setSearchQ("");
    setKcalFilter("");
    setSelectedFoodCategory(null);
    setCalorieFilterInfo(null);
    setSearchError("");
    setShowModal(true);

    void loadFoodCategories();
    loadDefaultFoods();
  }

  async function loadFoodCategories() {
    try {
      const response = await fetch(`${BASE_URL}/api/meal/food-categories`);
      const data = await response.json();
      if (response.ok && data?.success && Array.isArray(data.categories)) {
        setFoodCategories(data.categories);
      }
    } catch (error) {
      console.warn("Could not load food categories:", error);
    }
  }

  function shortFoodCategoryLabel(category: FoodCategoryOption) {
    const raw = `${category.value} ${category.label}`.toLowerCase();
    if (/ทอด|ผัด|fried|stir/.test(raw)) return "ผัดทอด";
    if (/ขนม|ของหวาน|dessert|snack|bakery/.test(raw)) return "ของทานเล่น";
    if (/ต้ม|แกง|ซุป|soup|curry/.test(raw)) return "ต้มแกง";
    if (/นึ่ง|ย่าง|steam|grill/.test(raw)) return "นึ่งและย่าง";
    if (/ข้าว|เส้น|พาสต้า|rice|noodle|pasta/.test(raw)) return "ข้าวเส้น";
    if (/ยำ|สลัด|ผัก|salad|vegetable/.test(raw)) return "ยำสลัด";
    if (/เครื่องดื่ม|drink|juice|กาแฟ/.test(raw)) return "เครื่องดื่ม";
    if (/เนื้อ|ไก่|หมู|ปลา|meat|chicken|fish/.test(raw)) return "เนื้อสัตว์";
    if (/อาหารจานเดียว|จานเดียว|single/.test(raw)) return "จานเดียว";
    if (/อาหารหลัก|จานหลัก|main/.test(raw)) return "จานหลัก";
    if (/เครื่องเคียง|side/.test(raw)) return "เครื่องเคียง";
    if (/อื่น|other/.test(raw)) return "อื่นๆ";
    return /[a-z]/i.test(category.label) ? "อื่นๆ" : category.label.trim();
  }

  function foodCategorySticker(category: FoodCategoryOption, used: Set<string>) {
    const raw = `${category.value} ${category.label}`.toLowerCase();
    const preferred = /ทอด|ผัด|fried|stir/.test(raw) ? "🍳"
      : /ขนม|ของหวาน|dessert|snack|bakery/.test(raw) ? "🍰"
      : /ต้ม|แกง|ซุป|soup|curry/.test(raw) ? "🍲"
      : /ข้าว|เส้น|พาสต้า|rice|noodle|pasta/.test(raw) ? "🍜"
      : /ยำ|สลัด|ผัก|salad|vegetable/.test(raw) ? "🥗"
      : /เครื่องดื่ม|drink|juice|กาแฟ/.test(raw) ? "🥤"
      : /เนื้อ|ไก่|หมู|ปลา|meat|chicken|fish/.test(raw) ? "🍖"
      : /จานเดียว|single/.test(raw) ? "🍱" : "🍽️";
    const fallbacks = ["🥟", "🥪", "🧆", "🥘", "🍛", "🧁", "🍙", "🥗", "🍢", "🥐"];
    const icon = !used.has(preferred) ? preferred : fallbacks.find((item) => !used.has(item)) || "🍴";
    used.add(icon);
    return icon;
  }

  async function loadFoodResults(query: string, targetKcal?: number, category: FoodCategoryOption | null = selectedFoodCategory) {
    try {
      setSearching(true);
      setSearchError("");

      const userId = await getUid();
      if (!userId) {
        throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      }

      const data = await searchSafeFoods(userId, query, targetKcal, "all", category);
      setSearchRes(
        Array.isArray(data?.foods) ? data.foods : []
      );
      setCalorieFilterInfo(data?.calorie_filter || null);
    } catch (e: any) {
      console.error("load food results error:", e);
      setSearchRes([]);
      setCalorieFilterInfo(null);
      setSearchError(e?.message || "ไม่สามารถค้นหาเมนูอาหารได้");
    } finally {
      setSearching(false);
    }
  }

  async function loadDefaultFoods() {
    await loadFoodResults("", undefined, null);
  }

  function onFoodCategorySelect(category: FoodCategoryOption | null) {
    setSelectedFoodCategory(category);
    const typedCalories = Number(kcalFilter);
    const targetKcal = kcalFilter.trim() && Number.isFinite(typedCalories) && typedCalories >= 0
      ? typedCalories
      : undefined;
    const query = /^\d+$/.test(searchQ.trim()) ? "" : searchQ.trim();
    void loadFoodResults(query, targetKcal, category);
  }

  /* =========================================================
     SEARCH FOOD
  ========================================================= */

  function onSearch(
    text: string
  ) {
    setSearchQ(text);
    const trimmed = text.trim();
    const isCalorieSearch = /^\d+$/.test(trimmed);
    if (isCalorieSearch) {
      setKcalFilter(trimmed);
    }

    if (
      timerRef.current
    ) {
      clearTimeout(
        timerRef.current
      );
    }

    timerRef.current =
      setTimeout(
        () => {
          const targetKcal = Number(kcalFilter);
          void loadFoodResults(
            isCalorieSearch ? "" : trimmed,
            isCalorieSearch
              ? Number(trimmed)
              : kcalFilter.trim() &&
                  Number.isFinite(targetKcal) &&
                  targetKcal >= 0
                ? targetKcal
                : undefined
          );
        },
        400
      );
  }

  function onKcalFilterChange(text: string) {
    const numericText = text.replace(/[^\d]/g, "");
    setKcalFilter(numericText);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const targetKcal = Number(numericText);
      const query = /^\d+$/.test(searchQ.trim())
        ? ""
        : searchQ.trim();
      void loadFoodResults(
        query,
        numericText &&
          Number.isFinite(targetKcal) &&
          targetKcal >= 0
          ? targetKcal
          : undefined
      );
    }, 400);
  }

  /* =========================================================
     FOOD DETAIL
  ========================================================= */

  async function openFoodDetail(
    food: any
  ) {
    setFoodDetailTab("nutrition");
    setSelectedFood(
      food
    );

    setShowFoodDetail(
      true
    );

    const foodId = String(food?._id || food?.food_id || "");
    if (!foodId || (Array.isArray(food?.ingredients) && food.ingredients.length > 0)) return;

    try {
      setFoodDetailLoading(true);
      const details = await getFood(foodId);
      if (details) setSelectedFood({ ...food, ...details });
    } catch (error) {
      console.warn("Could not load menu ingredients:", error);
    } finally {
      setFoodDetailLoading(false);
    }
  }

  function closeFoodDetail() {
    setShowFoodDetail(
      false
    );

    setSelectedFood(
      null
    );
  }

  /* =========================================================
     REPLACE MEAL
  ========================================================= */

  async function doReplace(
    foodId: string
  ) {
    if (!selSlot) {
      return;
    }

    try {
      await replaceMeal(
        selSlot.planId,
        selSlot.date,
        selSlot.idx,
        foodId
      );

      Alert.alert(
        "สำเร็จ",
        "แทนที่มื้ออาหารแล้ว"
      );

      setShowFoodDetail(
        false
      );

      setSelectedFood(
        null
      );

      setShowModal(
        false
      );

      setSelSlot(
        null
      );

      /*
       * ไม่ต้อง loadPlan
       * ปรับ state จาก API response ไม่ได้
       * ดังนั้นกรณี replace ยัง reload ได้
       * เพื่อให้ข้อมูลอาหารใหม่ตรง DB
       */
      await loadPlan();
    } catch (e: any) {
      Alert.alert(
        "แทนที่ไม่สำเร็จ",
        e?.message ||
        "ไม่สามารถแทนที่มื้ออาหารได้"
      );
    }
  }

  async function handleFoodSelection(food: any) {
    if (!selSlot) return;
    if (selSlot.mode !== "add") {
      await doReplace(String(food?._id || food?.food_id || ""));
      return;
    }

    const foodId = String(food?._id || food?.food_id || "");
    if (!foodId || savingFoodSelection) {
      if (!foodId) Alert.alert("เพิ่มเมนูไม่สำเร็จ", "ไม่พบรหัสเมนูอาหาร");
      return;
    }

    setSavingFoodSelection(true);
    try {
      const response = await fetch(`${BASE_URL}/api/meal/plans/${encodeURIComponent(selSlot.planId)}/addon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selSlot.date, slot_index: selSlot.idx, food_id: foodId }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "เพิ่มเมนูไม่สำเร็จ");
      }

      if (result.updated_plan) {
        setPlans((current) => current.map((plan) => plan.date === result.updated_plan.date ? result.updated_plan : plan));
      } else {
        await loadPlan();
      }
      setShowFoodDetail(false);
      setSelectedFood(null);
      setShowModal(false);
      setSelSlot(null);
      Alert.alert("เพิ่มเมนูแล้ว", `เพิ่ม ${getFoodName(food)} ในมื้อนี้แล้ว`);
    } catch (error: any) {
      Alert.alert("เพิ่มเมนูไม่สำเร็จ", error?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingFoodSelection(false);
    }
  }

  /* =========================================================
     DELETE MEAL
  ========================================================= */

  function doDeleteMeal(
    planId: string,
    date: string,
    slotIndex: number
  ) {
    const executeDelete =
      async () => {
        try {
          await deleteMeal(
            planId,
            String(
              slotIndex
            ),
            date
          );

          /*
           * ปรับ state เอง
           * ไม่ loadPlan
           */
          setPlans(
            (current) =>
              current.map(
                (plan) => {
                  if (
                    plan.plan_id !==
                    planId ||
                    plan.date !==
                    date
                  ) {
                    return plan;
                  }

                  const slots =
                    [
                      ...plan.slots,
                    ];

                  /*
                   * เอาเฉพาะเมนูออก
                   *
                   * ไม่ลบทั้ง plan
                   */
                  if (
                    slots[
                    slotIndex
                    ]
                  ) {
                    slots[
                      slotIndex
                    ] = {
                      ...slots[
                      slotIndex
                      ],
                      main_food:
                        null,
                      status:
                        "pending",
                    } as any;
                  }

                  return {
                    ...plan,
                    slots,
                  };
                }
              )
          );

          setShowModal(
            false
          );

          setSelSlot(
            null
          );

          Alert.alert(
            "สำเร็จ",
            "ลบมื้ออาหารแล้ว"
          );
        } catch (
        e: any
        ) {
          Alert.alert(
            "ลบไม่สำเร็จ",
            e?.message ||
            "ไม่สามารถลบมื้ออาหารได้"
          );
        }
      };

    if (
      Platform.OS ===
      "web"
    ) {
      const ok =
        window.confirm(
          "ต้องการลบมื้อนี้หรือไม่?"
        );

      if (ok) {
        executeDelete();
      }

      return;
    }

    Alert.alert(
      "ลบมื้ออาหาร",
      "ต้องการลบมื้อนี้หรือไม่?",
      [
        {
          text: "ยกเลิก",
          style: "cancel",
        },
        {
          text: "ลบ",
          style: "destructive",
          onPress:
            executeDelete,
        },
      ]
    );
  }

  /* =========================================================
     SCAN REPLACE
  ========================================================= */

  function doScanReplace() {
    if (!selSlot) {
      return;
    }

    setShowModal(false);

    router.push({
      pathname:
        "/food-scan",
      params: {
        replaceTarget:
          JSON.stringify(
            selSlot
          ),
      },
    });
  }

  /* =========================================================
     FOOD IMAGE
  ========================================================= */

  function FoodImage({
    food,
    size = 72,
  }: {
    food: any;
    size?: number;
  }) {
    const image =
      getFoodImage(food);

    if (image) {
      return (
        <Image
          source={{
            uri: image,
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 12,
            backgroundColor:
              "#f0f0f0",
          }}
          resizeMode="cover"
          onError={(event) => {
            console.log(
              "Food image load error:",
              image,
              event.nativeEvent.error
            );
          }}
        />
      );
    }

    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor:
            "#f0f0f0",
          justifyContent:
            "center",
          alignItems:
            "center",
        }}
      >
        <Ionicons
          name="fast-food-outline"
          size={size * 0.42}
          color="#ccc"
        />
      </View>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading &&
    plans.length === 0
  ) {
    return (
      <SafeAreaView
        style={st.container}
      >
        <View
          style={st.header}
        >
          <Text
            style={
              st.headerTitle
            }
          >
            แผนอาหาร
          </Text>
        </View>

        <View
          style={st.center}
        >
          <ActivityIndicator
            size="large"
            color={ORANGE}
          />

          <Text
            style={{
              marginTop: 12,
              color: "#777",
            }}
          >
            กำลังโหลด...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================================================
     NO PLAN
  ========================================================= */

  if (
    !hasPlan ||
    plans.length === 0
  ) {
    return (
      <SafeAreaView
        style={st.container}
      >
        <View
          style={st.header}
        >
          <Text
            style={
              st.headerTitle
            }
          >
            แผนอาหาร
          </Text>
        </View>

        <View
          style={st.center}
        >
          <Ionicons
            name="nutrition-outline"
            size={64}
            color={ORANGE}
          />

          <Text
            style={
              st.emptyTitle
            }
          >
            ยังไม่มีแผนอาหาร
          </Text>

          <Text
            style={
              st.emptyText
            }
          >
            เริ่มต้นสร้างแผนอาหาร{"\n"}
            เพื่อสุขภาพที่ดีของคุณ
          </Text>

          <TouchableOpacity
            style={
              st.createBtn
            }
            onPress={() =>
              router.push(
                "/create-plan/step1"
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color="#fff"
            />

            <Text
              style={
                st.createBtnText
              }
            >
              สร้างแผนอาหาร
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =========================================================
     ACTIVE PLAN
  ========================================================= */

  return (
    <SafeAreaView
      style={st.container}
    >
      {/* HEADER */}

      <View
        style={st.header}
      >
        <Text
          style={
            st.headerTitle
          }
        >
          แผนอาหาร
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/create-plan/step1"
            )
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* TAB */}

      <View
        style={st.tabBar}
      >
        <TouchableOpacity
          style={[
            st.tab,
            activeTab ===
            "today" &&
            st.tabActive,
          ]}
          onPress={() =>
            setActiveTab(
              "today"
            )
          }
        >
          <Text
            style={[
              st.tabText,
              activeTab ===
              "today" &&
              st.tabTextActive,
            ]}
          >
            วันนี้
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            st.tab,
            activeTab ===
            "full" &&
            st.tabActive,
          ]}
          onPress={() =>
            setActiveTab(
              "full"
            )
          }
        >
          <Text
            style={[
              st.tabText,
              activeTab ===
              "full" &&
              st.tabTextActive,
            ]}
          >
            แผนทั้งหมด
          </Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================
          TODAY
      ===================================================== */}

      {activeTab ===
        "today" ? (
        <ScrollView
          style={{
            flex: 1,
          }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
          }}
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() => {
                setRefreshing(
                  true
                );
                loadPlan();
              }}
            />
          }
        >
          {/* SUMMARY */}

          <View
            style={
              st.summaryCard
            }
          >
            <View
              style={{
                flexDirection:
                  "row",
                alignItems:
                  "center",
                gap: 8,
              }}
            >
              <Ionicons
                name="flame-outline"
                size={22}
                color={ORANGE}
              />

              <Text
                style={{
                  fontSize: 18,
                  fontWeight:
                    "bold",
                }}
              >
                {thaiDate(
                  todayPlan?.date ||
                  getTodayDate()
                )}
              </Text>
            </View>

            <View
              style={{
                marginTop: 12,
              }}
            >
              <View
                style={
                  st.progressBar
                }
              >
                <View
                  style={[
                    st.progressFill,
                    {
                      width:
                        targetKcal >
                          0
                          ? `${Math.min(
                            150,
                            (eatenKcal /
                              targetKcal) *
                            100
                          )}%`
                          : "0%",
                      backgroundColor:
                        eatenKcal >
                        targetKcal
                          ? "#FF3B30"
                          : ORANGE,
                    },
                  ]}
                />
              </View>

              <Text
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  color:
                    eatenKcal >
                    targetKcal
                      ? "#FF3B30"
                      : "#777",
                  textAlign:
                    "right",
                  fontWeight:
                    eatenKcal >
                    targetKcal
                      ? "bold"
                      : "normal",
                }}
              >
                {eatenKcal} /{" "}
                {targetKcal} kcal
                {eatenKcal >
                  targetKcal &&
                  ` (+${eatenKcal - targetKcal})`}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#888", textAlign: "right" }}>
                กินแล้ว / เป้าหมาย
              </Text>
            </View>

            <View
              style={{
                flexDirection:
                  "row",
                marginTop: 12,
              }}
            >
              {[
                {
                  label:
                    "Protein",
                  eaten:
                    eatenNutrition.protein,
                  target:
                    todayPlan
                      ?.daily_target_summary
                      ?.protein_g ??
                    0,
                  color:
                    "#3B82F6",
                },
                {
                  label:
                    "Carbs",
                  eaten:
                    eatenNutrition.carbs,
                  target:
                    todayPlan
                      ?.daily_target_summary
                      ?.carb_g ??
                    0,
                  color:
                    "#F59E0B",
                },
                {
                  label: "Fat",
                  eaten:
                    eatenNutrition.fat,
                  target:
                    todayPlan
                      ?.daily_target_summary
                      ?.fat_g ??
                    0,
                  color:
                    "#EF4444",
                },
              ].map(
                (macro) => (
                  <View
                    key={
                      macro.label
                    }
                    style={{
                      flex: 1,
                      alignItems:
                        "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color:
                          "#999",
                      }}
                    >
                      {
                        macro.label
                      }
                    </Text>

                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight:
                          "bold",
                        color:
                          macro.color,
                        marginTop: 2,
                      }}
                    >
                      {Math.round(macro.eaten)}{" "}
                      /{" "}
                      {Math.round(macro.target)}g
                    </Text>
                  </View>
                )
              )}
            </View>

            <View
              style={{
                flexDirection:
                  "row",
                alignItems:
                  "center",
                marginTop: 12,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    "#22A06B",
                }}
              />

              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  color:
                    "#22A06B",
                  fontWeight:
                    "600",
                }}
              >
                กินแล้ว{" "}
                {eatenCount}/
                {todayPlan
                  ?.slots
                  ?.length ||
                  0}{" "}
                มื้อ{skippedTodayMeals > 0 ? ` · ข้าม ${skippedTodayMeals} มื้อ` : ""}
              </Text>
            </View>
          </View>

          {todayPlan && (
            <View style={{ marginTop: 12, marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: eatenKcal > targetKcal && targetKcal > 0 ? "#FFF4EF" : "#FFF8E8" }}>
              <Text style={{ fontSize: 13, lineHeight: 19, color: "#684A27" }}>
                {eatenKcal > targetKcal && targetKcal > 0
                  ? `วันนี้เกินเป้าหมาย ${eatenKcal - targetKcal} kcal แล้ว ไม่ต้องอดหรือชดเชย มื้อถัดไปกินตามปกติและบันทึกตามที่กินจริงได้`
                  : remainingTodayMeals > 0
                    ? `วันนี้ยังเหลือ ${remainingTodayMeals} มื้อตามแผน เลือกอาหารตามแผนหรือเพิ่มเมนูในมื้อที่ต้องการได้`
                    : skippedTodayMeals > 0
                      ? `วันนี้บันทึกข้ามมื้อแล้ว ${skippedTodayMeals} มื้อ ยอดกินแล้วคำนวณจากมื้อที่ทำเครื่องหมายว่ากิน`
                    : `บันทึกมื้อของวันนี้ครบแล้ว หากกินต่างจากแผน สามารถเปลี่ยนหรือเพิ่มเมนูแล้วบันทึกตามจริงได้`}
              </Text>
            </View>
          )}

          {!!mealStatusError && (
            <Text style={{ color: "#B42318", fontSize: 13, marginBottom: 12 }}>
              {mealStatusError}
            </Text>
          )}

          <Text
            style={{
              fontSize: 17,
              fontWeight:
                "bold",
              marginBottom: 12,
            }}
          >
            มื้ออาหารวันนี้
          </Text>

          {/* TODAY MEALS */}

          {todayPlan?.slots?.map(
            (slot, idx) => {
              const isE =
                slot.status ===
                "eaten";

              const hasF =
                !!slot.main_food;

              const food: any =
                slot.main_food;

              return (
                <View
                  key={idx}
                  style={
                    st.mealCard
                  }
                >
                  <View
                    style={{
                      flexDirection:
                        "row",
                      alignItems:
                        "center",
                      gap: 10,
                    }}
                  >
                    <Ionicons
                      name={
                        mealIcon(
                          slot.meal_type
                        ) as any
                      }
                      size={20}
                      color="#000"
                    />

                    <TouchableOpacity
                      disabled={
                        !hasF
                      }
                      onPress={() =>
                        openFoodDetail(
                          food
                        )
                      }
                      style={{
                        flex: 1,
                        flexDirection:
                          "row",
                        alignItems:
                          "center",
                        gap: 10,
                      }}
                      activeOpacity={
                        0.75
                      }
                    >
                      <FoodImage
                        food={
                          food
                        }
                        size={62}
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              "#999",
                            fontWeight:
                              "600",
                          }}
                        >
                          {
                            slot.slot_name
                          }
                        </Text>

                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight:
                              "bold",
                            color:
                              "#333",
                            marginTop:
                              2,
                          }}
                          numberOfLines={
                            2
                          }
                        >
                          {getFoodName(
                            food
                          )}
                        </Text>

                        {hasF && (
                          <Text
                            style={{
                              fontSize: 12,
                              color:
                                "#999",
                              marginTop:
                                3,
                            }}
                          >
                            แตะเพื่อดูรายละเอียด
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {hasF && (
                      <TouchableOpacity
                        disabled={slot.status === "skipped"}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: slot.status === "skipped", checked: isE }}
                        accessibilityLabel={slot.status === "skipped" ? "มื้อนี้ถูกข้าม กรุณายกเลิกข้ามก่อนบันทึกว่ากินแล้ว" : isE ? "ยกเลิกบันทึกว่ากินแล้ว" : "บันทึกว่ากินแล้ว"}
                        onPress={() =>
                          handleToggle(
                            todayPlan.plan_id,
                            todayPlan.date,
                            idx,
                            slot.status ||
                            "pending"
                          )
                        }
                      >
                        <Ionicons
                          name={
                            isE
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={
                            26
                          }
                          color={
                            isE
                              ? "#22A06B"
                              : "#ccc"
                          }
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {hasF && (
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        color:
                          ORANGE,
                        fontWeight:
                          "bold",
                      }}
                    >
                      {
                        getSlotNutrition(slot).kcal
                      }{" "}
                      kcal
                    </Text>
                  )}

                  {renderAddonFoods(todayPlan.plan_id, todayPlan.date, idx, slot.addons || [])}
                  {hasF && (slot.addons || []).length > 0 && (
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 7, marginLeft: 30 }}>
                      <Text style={st.slotMacroText}>โปรตีน {Math.round(getSlotNutrition(slot).protein)}g</Text>
                      <Text style={st.slotMacroText}>คาร์บ {Math.round(getSlotNutrition(slot).carbs)}g</Text>
                      <Text style={st.slotMacroText}>ไขมัน {Math.round(getSlotNutrition(slot).fat)}g</Text>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection:
                        "row",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={
                        st.actionBtn
                      }
                      onPress={() =>
                        openModal(
                          todayPlan.plan_id,
                          todayPlan.date,
                          idx,
                          slot.slot_name
                        )
                      }
                    >
                      <Ionicons
                        name="swap-horizontal-outline"
                        size={16}
                        color={
                          ORANGE
                        }
                      />

                      <Text
                        style={{
                          fontSize: 13,
                          color:
                            ORANGE,
                          fontWeight:
                            "600",
                        }}
                      >
                        เปลี่ยน
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={st.actionBtn}
                      onPress={() => openModal(todayPlan.plan_id, todayPlan.date, idx, slot.slot_name, "add")}
                    >
                      <Ionicons name="add-outline" size={18} color={ORANGE} />
                      <Text style={{ fontSize: 13, color: ORANGE, fontWeight: "600" }}>เพิ่มเมนู</Text>
                    </TouchableOpacity>

                    {slot.status !== "eaten" && (
                      <TouchableOpacity
                        style={st.actionBtn}
                        onPress={() => handleSkipMeal(todayPlan.plan_id, todayPlan.date, idx, slot.status || "pending")}
                      >
                        <Ionicons name={slot.status === "skipped" ? "return-up-back-outline" : "play-skip-forward-outline"} size={16} color="#777" />
                        <Text style={{ fontSize: 13, color: "#777", fontWeight: "600" }}>{slot.status === "skipped" ? "ยกเลิกข้าม" : "ข้ามมื้อ"}</Text>
                      </TouchableOpacity>
                    )}

                    {hasF && (
                      <TouchableOpacity
                        style={st.actionBtn}
                        onPress={() =>
                          doDeleteMeal(
                            todayPlan.plan_id,
                            todayPlan.date,
                            idx
                          )
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />

                        <Text
                          style={{
                            fontSize: 13,
                            color:
                              "#EF4444",
                            fontWeight:
                              "600",
                          }}
                        >
                          ลบ
                        </Text>
                      </TouchableOpacity>
                    )}

                    {hasF && isE && (
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: ORANGE,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                        onPress={() =>
                          handleLogMeal(
                            todayPlan.date,
                            slot.slot_name,
                            slot
                          )
                        }
                      >
                        <Ionicons
                          name="checkmark-done-outline"
                          size={16}
                          color="#fff"
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#fff",
                            fontWeight: "600",
                          }}
                        >
                          บันทึก
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }
          )}

          {/* BOTTOM BUTTONS */}

          <View
            style={{
              flexDirection:
                "row",
              gap: 10,
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              style={
                st.outlineBtn
              }
              onPress={() =>
                setActiveTab(
                  "full"
                )
              }
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#000"
              />

              <Text
                style={{
                  fontSize: 15,
                  color:
                    "#000",
                  fontWeight:
                    "600",
                }}
              >
                ดูแผนทั้งหมด
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                st.dangerBtn,
                deletingPlanId
                  ? {
                    opacity: 0.5,
                  }
                  : undefined,
              ]}
              disabled={
                !!deletingPlanId ||
                !todayPlan
              }
              onPress={() => {
                if (
                  todayPlan
                ) {
                  /*
                   * สำคัญ:
                   * ตรงนี้ลบเฉพาะวันนี้
                   */
                  confirmDeletePlanDay(
                    todayPlan
                  );
                }
              }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#fff"
              />

              <Text
                style={{
                  fontSize: 15,
                  color: "#fff",
                  fontWeight:
                    "600",
                }}
              >
                ลบแผน
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* =================================================
           FULL PLAN
        ================================================= */

        <ScrollView
          style={{
            flex: 1,
          }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
          }}
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() => {
                setRefreshing(
                  true
                );
                loadPlan();
              }}
            />
          }
        >
          {/* DAY TABS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            style={{
              marginBottom: 16,
            }}
            contentContainerStyle={{
              gap: 8,
            }}
          >
            {plans.map(
              (
                plan,
                index
              ) => (
                <TouchableOpacity
                  key={`${plan.plan_id}-${plan.date}`}
                  style={[
                    st.dayTab,
                    dayIdx ===
                    index &&
                    st.dayTabActive,
                  ]}
                  onPress={() =>
                    setDayIdx(
                      index
                    )
                  }
                >
                  <Text
                    style={[
                      {
                        fontSize: 13,
                        fontWeight:
                          "800",
                        color:
                          "#333",
                      },
                      dayIdx ===
                      index && {
                        color:
                          "#fff",
                      },
                    ]}
                  >
                    {thaiDay(
                      plan.date
                    )}
                  </Text>

                  <Text
                    style={[
                      {
                        fontSize: 11,
                        color:
                          "#999",
                        marginTop:
                          2,
                      },
                      dayIdx ===
                      index && {
                        color:
                          "#fff",
                      },
                    ]}
                  >
                    {fmtShort(
                      plan.date
                    )}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          {selDay && (
            <>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight:
                    "bold",
                  marginBottom: 12,
                }}
              >
                {thaiDate(
                  selDay.date
                )}
              </Text>

              {selDay.slots?.map(
                (
                  slot,
                  idx
                ) => {
                  const isE =
                    slot.status ===
                    "eaten";

                  const hasF =
                    !!slot.main_food;

                  const food: any =
                    slot.main_food;

                  return (
                    <View
                      key={idx}
                      style={
                        st.mealCard
                      }
                    >
                      <View
                        style={{
                          flexDirection:
                            "row",
                          alignItems:
                            "center",
                          gap: 10,
                        }}
                      >
                        <Ionicons
                          name={
                            mealIcon(
                              slot.meal_type
                            ) as any
                          }
                          size={20}
                          color="#000"
                        />

                        <TouchableOpacity
                          disabled={
                            !hasF
                          }
                          onPress={() =>
                            openFoodDetail(
                              food
                            )
                          }
                          style={{
                            flex: 1,
                            flexDirection:
                              "row",
                            alignItems:
                              "center",
                            gap: 10,
                          }}
                          activeOpacity={
                            0.75
                          }
                        >
                          <FoodImage
                            food={
                              food
                            }
                            size={
                              62
                            }
                          />

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color:
                                  "#999",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {
                                slot.slot_name
                              }
                            </Text>

                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight:
                                  "bold",
                                color:
                                  "#333",
                                marginTop:
                                  2,
                              }}
                              numberOfLines={
                                2
                              }
                            >
                              {getFoodName(
                                food
                              )}
                            </Text>

                            {hasF && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color:
                                    "#999",
                                  marginTop:
                                    3,
                                }}
                              >
                                แตะเพื่อดูรายละเอียด
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        {hasF && (
                          <TouchableOpacity
                            disabled={slot.status === "skipped"}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: slot.status === "skipped", checked: isE }}
                            accessibilityLabel={slot.status === "skipped" ? "มื้อนี้ถูกข้าม กรุณายกเลิกข้ามก่อนบันทึกว่ากินแล้ว" : isE ? "ยกเลิกบันทึกว่ากินแล้ว" : "บันทึกว่ากินแล้ว"}
                            onPress={() =>
                              handleToggle(
                                selDay.plan_id,
                                selDay.date,
                                idx,
                                slot.status ||
                                "pending"
                              )
                            }
                          >
                            <Ionicons
                              name={
                                isE
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={
                                26
                              }
                              color={
                                isE
                                  ? "#22A06B"
                                  : "#ccc"
                              }
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {hasF && (
                        <Text
                          style={{
                            marginTop: 8,
                            fontSize: 14,
                            color:
                              ORANGE,
                            fontWeight:
                              "bold",
                          }}
                        >
                          {
                            getSlotNutrition(slot).kcal
                          }{" "}
                          kcal
                        </Text>
                      )}

                      {renderAddonFoods(selDay.plan_id, selDay.date, idx, slot.addons || [])}
                      {hasF && (slot.addons || []).length > 0 && (
                        <View style={{ flexDirection: "row", gap: 6, marginTop: 7, marginLeft: 30 }}>
                          <Text style={st.slotMacroText}>โปรตีน {Math.round(getSlotNutrition(slot).protein)}g</Text>
                          <Text style={st.slotMacroText}>คาร์บ {Math.round(getSlotNutrition(slot).carbs)}g</Text>
                          <Text style={st.slotMacroText}>ไขมัน {Math.round(getSlotNutrition(slot).fat)}g</Text>
                        </View>
                      )}

                      <View
                        style={{
                          flexDirection:
                            "row",
                          flexWrap: "wrap",
                          gap: 10,
                          marginTop: 10,
                        }}
                      >
                        <TouchableOpacity
                          style={
                            st.actionBtn
                          }
                          onPress={() =>
                            openModal(
                              selDay.plan_id,
                              selDay.date,
                              idx,
                              slot.slot_name
                            )
                          }
                        >
                          <Ionicons
                            name="swap-horizontal-outline"
                            size={16}
                            color={
                              ORANGE
                            }
                          />

                          <Text
                            style={{
                              fontSize: 13,
                              color:
                                ORANGE,
                              fontWeight:
                                "600",
                            }}
                          >
                            เปลี่ยน
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={st.actionBtn}
                          onPress={() => openModal(selDay.plan_id, selDay.date, idx, slot.slot_name, "add")}
                        >
                          <Ionicons name="add-outline" size={18} color={ORANGE} />
                          <Text style={{ fontSize: 13, color: ORANGE, fontWeight: "600" }}>เพิ่มเมนู</Text>
                        </TouchableOpacity>

                        {selDay.date === getTodayDate() && slot.status !== "eaten" && (
                          <TouchableOpacity
                            style={st.actionBtn}
                            onPress={() => handleSkipMeal(selDay.plan_id, selDay.date, idx, slot.status || "pending")}
                          >
                            <Ionicons name={slot.status === "skipped" ? "return-up-back-outline" : "play-skip-forward-outline"} size={16} color="#777" />
                            <Text style={{ fontSize: 13, color: "#777", fontWeight: "600" }}>{slot.status === "skipped" ? "ยกเลิกข้าม" : "ข้ามมื้อ"}</Text>
                          </TouchableOpacity>
                        )}

                        {hasF && (
                          <TouchableOpacity
                            style={st.actionBtn}
                            onPress={() =>
                              doDeleteMeal(
                                selDay.plan_id,
                                selDay.date,
                                idx
                              )
                            }
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            <Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "600" }}>ลบ</Text>
                          </TouchableOpacity>
                        )}

                        {hasF && isE && (
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: ORANGE,
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8,
                            }}
                            onPress={() =>
                              handleLogMeal(
                                selDay.date,
                                slot.slot_name,
                                slot
                              )
                            }
                          >
                            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
                            <Text style={{ fontSize: 13, color: "#fff", fontWeight: "600" }}>บันทึก</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }
              )}

              {/* =================================================
                  DELETE SELECTED DAY
              ================================================= */}

              <TouchableOpacity
                style={[
                  st.dangerBtn,
                  {
                    marginTop: 24,
                    marginBottom: 10,
                  },
                  deletingPlanId
                    ? {
                      opacity: 0.5,
                    }
                    : undefined,
                ]}
                disabled={
                  !!deletingPlanId
                }
                onPress={() =>
                  confirmDeletePlanDay(
                    selDay
                  )
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#fff"
                />

                <Text
                  style={{
                    fontSize: 16,
                    color: "#fff",
                    fontWeight:
                      "bold",
                  }}
                >
                  ลบแผนนี้
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* =================================================
              DELETE ALL
          ================================================= */}

          <TouchableOpacity
            style={[
              st.dangerBtn,
              {
                marginTop: 10,
                marginBottom: 20,
                backgroundColor:
                  "#B91C1C",
              },
              deletingPlanId
                ? {
                  opacity: 0.5,
                }
                : undefined,
            ]}
            disabled={
              !!deletingPlanId
            }
            onPress={
              confirmDeleteAllPlans
            }
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color="#fff"
            />

            <Text
              style={{
                fontSize: 16,
                color: "#fff",
                fontWeight:
                  "bold",
              }}
            >
              ลบแผนอาหารทั้งหมด
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* =====================================================
          CHANGE FOOD MODAL
      ===================================================== */}

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setShowModal(false)
        }
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor:
              "#fff",
          }}
        >
          <View
            style={{
              flexDirection:
                "row",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor:
                "#eee",
            }}
          >
            <TouchableOpacity
              onPress={() =>
                setShowModal(
                  false
                )
              }
            >
              <Ionicons
                name="close"
                size={28}
                color="#333"
              />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 17,
                fontWeight:
                  "bold",
              }}
            >
              {selSlot?.mode === "add" ? "เพิ่มเมนูใน" : "เปลี่ยน"}{" "}
              {selSlot?.name ||
                "มื้ออาหาร"}
            </Text>

            <View
              style={{
                width: 28,
              }}
            />
          </View>

          <View
            style={{
              flexDirection:
                "row",
              alignItems:
                "center",
              margin: 16,
              paddingHorizontal: 14,
              backgroundColor:
                "#f5f5f5",
              borderRadius: 12,
              height: 46,
              gap: 8,
            }}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#999"
            />

            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: "#333",
              }}
              placeholder="ค้นหาเมนู หรือพิมพ์แคลอรี่ เช่น 100"
              placeholderTextColor="#aaa"
              value={searchQ}
              onChangeText={
                onSearch
              }
              autoFocus
            />

            {searchQ.length >
              0 && (
                <TouchableOpacity
                  onPress={() =>
                    onSearch("")
                  }
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              )}
          </View>

          <View
            style={{
              marginHorizontal: 16,
              marginTop: -6,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ color: "#666", fontSize: 13, fontWeight: "600" }}>
                กรองแคลอรี่
              </Text>
              <TextInput
                style={{
                  width: 100,
                  height: 40,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#e5e5e5",
                  paddingHorizontal: 10,
                  color: "#333",
                  backgroundColor: "#fff",
                }}
                placeholder="เช่น 100"
                value={kcalFilter}
                onChangeText={onKcalFilterChange}
                keyboardType="number-pad"
                accessibilityLabel="กรองเมนูตามแคลอรี่"
              />
              <Text style={{ color: "#888", fontSize: 12 }}>kcal</Text>
            </View>
            <Text style={{ color: "#888", fontSize: 12, marginTop: 5 }}>
              {kcalFilter
                ? `แสดงเมนูใกล้เคียง ±50 kcal จาก ${kcalFilter} kcal`
                : "ระบุแคลอรี่เพื่อค้นหาเมนูที่ใกล้เคียง"}
            </Text>
          </View>

          <View style={{ zIndex: 5, elevation: 5, backgroundColor: "#fff", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#eee", paddingTop: 9, paddingBottom: 5, marginBottom: 8 }}>
            <Text style={{ marginHorizontal: 16, marginBottom: 7, color: "#777", fontSize: 12, fontWeight: "700" }}>เลือกหมวดอาหาร</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 10, alignItems: "center" }}
            >
              {(() => {
                const usedIcons = new Set<string>(["🍽️"]);
                return [null, ...foodCategories].map((category) => {
                  const key = category ? `${category.field}:${category.value}` : "";
                  const activeKey = selectedFoodCategory ? `${selectedFoodCategory.field}:${selectedFoodCategory.value}` : "";
                  const active = activeKey === key;
                  const label = category ? shortFoodCategoryLabel(category) : "ทั้งหมด";
                  const icon = category ? foodCategorySticker(category, usedIcons) : "🍽️";
                  return (
                    <TouchableOpacity
                      key={key || "all-categories"}
                      onPress={() => onFoodCategorySelect(category)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      style={{ width: 76, minHeight: 68, flexShrink: 0, alignItems: "center", justifyContent: "center", paddingVertical: 5, paddingHorizontal: 3, borderRadius: 12, backgroundColor: active ? "#FFF1D6" : "#F7F7F7", borderWidth: active ? 1.5 : 1, borderColor: active ? ORANGE : "#eee" }}
                    >
                      <Text style={{ fontSize: 20 }}>{icon}</Text>
                      <Text numberOfLines={2} style={{ width: "100%", textAlign: "center", fontSize: 9, fontWeight: active ? "800" : "600", color: active ? "#9A5B00" : "#666", marginTop: 2 }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>

          {calorieFilterInfo &&
            !calorieFilterInfo.has_matches &&
            searchRes.length > 0 && (
              <Text
                style={{
                  color: "#8a5a00",
                  fontSize: 13,
                  marginHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                ไม่พบเมนูในช่วง{" "}
                {calorieFilterInfo.target_kcal -
                  calorieFilterInfo.tolerance}
                –
                {calorieFilterInfo.target_kcal +
                  calorieFilterInfo.tolerance}{" "}
                kcal จึงแสดงเมนูที่ใกล้เคียงที่สุด
              </Text>
            )}

          {!!searchError && !searching && (
            <Text
              style={{
                color: "#B42318",
                fontSize: 13,
                textAlign: "center",
                marginHorizontal: 16,
                marginBottom: 8,
              }}
            >
              {searchError}
            </Text>
          )}

          {/* SCAN + DELETE */}

          <View
            style={{
              flexDirection:
                "row",
              paddingHorizontal: 16,
              gap: 10,
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection:
                  "row",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor:
                  "#FFF8E8",
              }}
              onPress={
                doScanReplace
              }
            >
              <Ionicons
                name="camera-outline"
                size={22}
                color={
                  ORANGE
                }
              />

              <Text
                style={{
                  fontSize: 14,
                  fontWeight:
                    "600",
                  color:
                    ORANGE,
                }}
              >
                สแกนอาหาร
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection:
                  "row",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: 6,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor:
                  "#FEF2F2",
              }}
              onPress={() => {
                if (
                  selSlot
                ) {
                  doDeleteMeal(
                    selSlot.planId,
                    selSlot.date,
                    selSlot.idx
                  );
                }
              }}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color="#EF4444"
              />

              <Text
                style={{
                  fontSize: 14,
                  fontWeight:
                    "600",
                  color:
                    "#EF4444",
                }}
              >
                ลบมื้อนี้
              </Text>
            </TouchableOpacity>
          </View>

          {searching && (
            <ActivityIndicator
              size="small"
              color={ORANGE}
              style={{
                marginTop: 20,
              }}
            />
          )}

          <FlatList
            data={searchRes}
            keyExtractor={(
              item: any,
              index
            ) =>
              String(
                item?._id ??
                index
              )
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 30,
            }}
            ListEmptyComponent={
              !searching &&
                (searchQ.trim().length > 0 ||
                  kcalFilter.trim().length > 0 ||
                  selectedFoodCategory !== null) ? (
                <View
                  style={{
                    alignItems:
                      "center",
                    paddingTop: 60,
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={40}
                    color="#ddd"
                  />

                  <Text
                    style={{
                      marginTop: 12,
                      color:
                        "#ccc",
                    }}
                  >
                    {calorieFilterInfo &&
                    !calorieFilterInfo.has_matches
                      ? "ไม่พบเมนูที่ใกล้เคียงกับแคลอรี่ที่เลือก"
                      : searchError
                        ? "ค้นหาเมนูไม่สำเร็จ"
                        : "ไม่พบอาหาร"}
                  </Text>
                </View>
              ) : searchQ.length ===
                0 ? (
                <View
                  style={{
                    alignItems:
                      "center",
                    paddingTop: 60,
                  }}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={40}
                    color="#ddd"
                  />

                  <Text
                    style={{
                      marginTop: 12,
                      color:
                        "#ccc",
                    }}
                  >
                    กำลังโหลดรายการอาหาร...
                  </Text>
                </View>
              ) : null
            }
            renderItem={({
              item,
            }) => {
              const food: any =
                item;

              const nutrition =
                getNutrition(
                  food
                );

              return (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                    gap: 14,
                  }}
                  onPress={() =>
                    openFoodDetail(
                      food
                    )
                  }
                  activeOpacity={
                    0.7
                  }
                >
                  <FoodImage
                    food={food}
                    size={60}
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#333",
                      }}
                      numberOfLines={
                        1
                      }
                    >
                      {getFoodName(
                        food
                      )}
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        color: ORANGE,
                        fontWeight: "bold",
                        marginTop: 4,
                      }}
                    >
                      {
                        nutrition.kcal
                      }{" "}
                      kcal
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#ccc"
                  />
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* =====================================================
          FOOD DETAIL MODAL
      ===================================================== */}

      <Modal
        visible={
          showFoodDetail
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={
          closeFoodDetail
        }
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor:
              "#fff",
          }}
        >
          <View
            style={
              st.detailHeader
            }
          >
            <TouchableOpacity
              onPress={
                closeFoodDetail
              }
            >
              <Ionicons
                name="close"
                size={28}
                color="#333"
              />
            </TouchableOpacity>

            <Text
              style={
                st.detailHeaderTitle
              }
            >
              รายละเอียดอาหาร
            </Text>

            <View
              style={{
                width: 28,
              }}
            />
          </View>

          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 40,
            }}
          >
            {selectedFood && (
              <>
                <View style={st.detailImageWrapper}>
                  <FoodImage
                    food={selectedFood}
                    size={250}
                  />
                </View>

                <Text style={{ fontSize: 24, fontWeight: "900", color: "#222" }}>
                  {getFoodName(selectedFood)}
                </Text>
                {!!getFoodEnglishName(selectedFood) && (
                  <Text style={{ color: "#888", marginTop: 4 }}>
                    {getFoodEnglishName(selectedFood)}
                  </Text>
                )}

                <View style={{ flexDirection: "row", marginTop: 16, borderWidth: 1, borderColor: "#222", borderRadius: 10, overflow: "hidden" }}>
                  {([{ key: "nutrition", label: "โภชนาการ" }, { key: "ingredients", label: "ส่วนผสม" }] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setFoodDetailTab(tab.key)}
                      style={{ flex: 1, paddingVertical: 13, alignItems: "center", backgroundColor: foodDetailTab === tab.key ? ORANGE : "#fff" }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "800", color: foodDetailTab === tab.key ? "#fff" : "#333" }}>{tab.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {foodDetailTab === "nutrition" ? (
                  <View style={{ marginTop: 16 }}>
                    <View style={{ backgroundColor: "#FFF8EA", borderRadius: 14, padding: 16, alignItems: "center" }}>
                      <Text style={{ fontSize: 15, color: "#777", fontWeight: "700" }}>พลังงานต่อหนึ่งหน่วยบริโภค (100 กรัม)</Text>
                      <Text style={{ fontSize: 32, color: ORANGE, fontWeight: "900", marginTop: 4 }}>{Math.round(getNutrition(selectedFood).kcal)} kcal</Text>
                      <Text style={{ color: "#777", marginTop: 2 }}>
                        {selectedFood.portion_reference?.unit_label || `${selectedFood.portion_reference?.total_weight_g || selectedFood.portion?.gram || 100} กรัม`}
                      </Text>
                    </View>
                    <Text style={st.sectionTitle}>สารอาหารหลัก</Text>
                    {([
                      { label: "โปรตีน", value: getNutrition(selectedFood).protein, icon: "fitness-outline", color: "#E53935", unit: "g" },
                      { label: "คาร์บ", value: getNutrition(selectedFood).carbs, icon: "water-outline", color: "#1E88E5", unit: "g" },
                      { label: "ไขมัน", value: getNutrition(selectedFood).fat, icon: "nutrition-outline", color: "#FBC02D", unit: "g" },
                      { label: "ใยอาหาร", value: getNutrition(selectedFood).fiber, icon: "leaf-outline", color: "#22A06B", unit: "g" },
                      { label: "โซเดียม", value: getNutrition(selectedFood).sodium, icon: "flask-outline", color: "#8B5CF6", unit: "mg" },
                    ] as const).map((item) => (
                      <View key={item.label} style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFF7E6", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                            <Ionicons name={item.icon as any} size={20} color={item.color} />
                          </View>
                          <Text style={{ fontSize: 15, color: "#444", fontWeight: "600" }}>{item.label}</Text>
                        </View>
                        <Text style={{ fontSize: 15, color: "#333", fontWeight: "700" }}>{Math.round(item.value)} {item.unit}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ marginTop: 16 }}>
                    <Text style={st.sectionTitle}>ส่วนผสม</Text>
                    {foodDetailLoading ? (
                      <ActivityIndicator size="small" color={ORANGE} style={{ marginTop: 24 }} />
                    ) : getIngredients(selectedFood).length > 0 ? getIngredients(selectedFood).map((ingredient: any, index: number) => (
                      <View key={`${ingredient.ingredient_id || ingredient.name || "ingredient"}-${index}`} style={{ minHeight: 54, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ORANGE, marginRight: 12 }} />
                        <Text style={{ flex: 1, fontSize: 15, color: "#333" }}>{ingredient.name || ingredient.name_snap || "วัตถุดิบ"}</Text>
                        {(ingredient.qty || ingredient.weight_g) ? <Text style={{ color: "#777" }}>{ingredient.qty || ingredient.weight_g} {ingredient.unit || (ingredient.weight_g ? "g" : "")}</Text> : null}
                      </View>
                    )) : (
                      <View style={{ paddingVertical: 32, alignItems: "center", backgroundColor: "#fafafa", borderRadius: 14 }}>
                        <Ionicons name="restaurant-outline" size={40} color="#bbb" />
                        <Text style={{ color: "#999", marginTop: 8 }}>ไม่พบข้อมูลส่วนผสม</Text>
                      </View>
                    )}
                  </View>
                )}

                {selSlot &&
                  selectedFood?._id && (
                    <TouchableOpacity
                      style={[st.replaceDetailBtn, savingFoodSelection && { opacity: 0.65 }]}
                      onPress={() => handleFoodSelection(selectedFood)}
                      disabled={savingFoodSelection}
                      activeOpacity={
                        0.8
                      }
                    >
                      <Ionicons
                        name={selSlot.mode === "add" ? "add-circle-outline" : "swap-horizontal-outline"}
                        size={22}
                        color="#fff"
                      />

                      <Text
                        style={
                          st.replaceDetailText
                        }
                      >
                        {savingFoodSelection ? "กำลังบันทึก..." : selSlot.mode === "add" ? "เพิ่มเมนูนี้" : "เปลี่ยนเป็นเมนูนี้"}
                      </Text>
                    </TouchableOpacity>
                  )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const st =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#fff",
    },

    header: {
      height: 56,
      backgroundColor:
        ORANGE,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
    },

    headerTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      fontSize: 20,
      fontWeight:
        "bold",
      color: "#fff",
      fontFamily: "NotoSansThaiBold",
      textAlign: "center",
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal: 40,
    },

    emptyTitle: {
      fontSize: 22,
      fontWeight:
        "bold",
      marginTop: 20,
      color: "#333",
    },

    emptyText: {
      fontSize: 15,
      color: "#999",
      textAlign:
        "center",
      marginTop: 10,
      lineHeight: 22,
    },

    createBtn: {
      marginTop: 30,
      backgroundColor:
        ORANGE,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 32,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    createBtnText: {
      color: "#fff",
      fontSize: 18,
      fontWeight:
        "bold",
    },

    tabBar: {
      flexDirection:
        "row",
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
    },

    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems:
        "center",
    },

    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor:
        ORANGE,
    },

    tabText: {
      fontSize: 15,
      color: "#999",
      fontWeight:
        "600",
    },

    tabTextActive: {
      color: ORANGE,
      fontWeight:
        "bold",
    },

    summaryCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: ORANGE,
    },

    progressBar: {
      height: 10,
      backgroundColor:
        "#eee",
      borderRadius: 5,
      overflow:
        "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        ORANGE,
      borderRadius: 5,
    },

    mealCard: {
      backgroundColor:
        "#fff",
      borderWidth: 1,
      borderColor:
        "#eee",
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },

    actionBtn: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor:
        "#f8f8f8",
    },

    slotMacroText: {
      fontSize: 11,
      color: "#777",
      backgroundColor: "#f3f3f3",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 10,
    },

    outlineBtn: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor:
        "#000",
      backgroundColor:
        "#fff",
    },

    dangerBtn: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor:
        "#EF4444",
    },

    dayTab: {
      width: 58,
      height: 62,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        "#eee",
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
    },

    dayTabActive: {
      backgroundColor:
        ORANGE,
      borderColor:
        ORANGE,
    },

    detailHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        "#eee",
    },

    detailHeaderTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      color: "#333",
    },

    detailImageWrapper: {
      width: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      color: "#333",
      marginTop: 24,
      marginBottom: 12,
    },

    nutritionGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    nutritionBox: {
      width: "47%",
      backgroundColor:
        "#FFF8E8",
      borderRadius: 12,
      padding: 14,
      alignItems:
        "center",
    },

    nutritionLabel: {
      fontSize: 13,
      color: "#777",
    },

    nutritionValueOrange: {
      fontSize: 23,
      fontWeight:
        "bold",
      color: ORANGE,
      marginTop: 4,
    },

    nutritionValue: {
      fontSize: 23,
      fontWeight:
        "bold",
      marginTop: 4,
    },

    nutritionUnit: {
      fontSize: 12,
      color: "#999",
    },

    portionBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#FFF8E8",
      borderRadius: 12,
      padding: 14,
      gap: 10,
    },

    portionText: {
      flex: 1,
      fontSize: 15,
      color: "#555",
      fontWeight:
        "600",
    },

    ingredientsBox: {
      backgroundColor:
        "#f8f8f8",
      borderRadius: 12,
      padding: 14,
    },

    ingredientRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      marginBottom: 10,
    },

    ingredientDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        ORANGE,
      marginTop: 6,
      marginRight: 10,
    },

    ingredientText: {
      flex: 1,
      fontSize: 14,
      color: "#555",
      lineHeight: 20,
    },

    emptyIngredientBox: {
      backgroundColor:
        "#f8f8f8",
      borderRadius: 12,
      paddingVertical: 30,
      alignItems:
        "center",
    },

    replaceDetailBtn: {
      marginTop: 28,
      backgroundColor:
        ORANGE,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    replaceDetailText: {
      color: "#fff",
      fontSize: 16,
      fontWeight:
        "bold",
    },
  });
