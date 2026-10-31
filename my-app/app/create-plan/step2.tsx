import React, {
  useCallback,
  useEffect,
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
  Alert,
  Modal,
  TextInput,
  FlatList,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import axios, { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/config";

const ORANGE = "#F5A400";

// ======================================================
// Types
// ======================================================
type Food = {
  _id?: string;
  food_id?: string;
  name: string;
  name_en?: string;
  image?: string;
  image_url?: string;
  images?: string[];
  category?: string;
  kcal?: number;
  nutrition_per_portion?: {
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };
  portion?: {
    gram?: number;
    unit?: string;
  };
  portion_reference?: {
    total_weight_g?: number;
    unit_label?: string;
  };
  ingredients?: any[];
};

type Slot = {
  slot_name: string;
  meal_type: string;
  status?: string;
  target_kcal?: number;
  target_nutrition?: {
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
  };
  main_food?: Food | null;
  addons?: Food[];
  is_swapped?: boolean;
};

type FoodCategoryOption = { field: "category" | "category_type"; value: string; label: string };

type DailyPlan = {
  plan_id: string;
  date: string;
  meals_per_day: number;
  slots: Slot[];
  daily_target_summary?: {
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
  };
};

// ======================================================
// Date & Format Helpers (Mirroring plan.tsx)
// ======================================================
function parseDate(ds: string) {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(ds: string) {
  const d = parseDate(ds);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function thaiDay(ds: string) {
  return ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][parseDate(ds).getDay()];
}

function thaiDate(ds: string) {
  const d = parseDate(ds);
  const mo = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function createDateList(startDate: string, days: number) {
  if (!startDate || days <= 0) return [];
  const start = parseDate(startDate);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
}

function mealIcon(mt: string) {
  const t = String(mt || "").toLowerCase();
  if (t.includes("breakfast") || t.includes("เช้า")) return "sunny-outline";
  if (t.includes("lunch") || t.includes("กลางวัน")) return "partly-sunny-outline";
  if (t.includes("dinner") || t.includes("เย็น")) return "moon-outline";
  return "restaurant-outline";
}

// ======================================================
// Food Display Helpers
// ======================================================
function getFoodImage(food: any): string | null {
  if (!food) return null;
  const image = food.image || food.image_url || food.images?.[0] || null;
  if (!image || typeof image !== "string") return null;
  const value = image.trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  let filename = value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/^uploads\/master\//i, "").replace(/^master\//i, "");
  filename = filename.split("/").pop() || filename;
  return `${BASE_URL}/uploads/master/${encodeURIComponent(filename)}`;
}

function getFoodName(food: any): string {
  return food?.name || food?.food_name || food?.menu_name || "ไม่มีชื่อเมนู";
}

function getNutrition(food: any) {
  const n = food?.nutrition_per_portion || food?.nutrition || food?.nutrients || {};
  return {
    kcal: Number(n?.kcal ?? food?.kcal ?? 0) || 0,
    protein: Number(n?.protein_g ?? food?.protein_g ?? 0) || 0,
    carbs: Number(n?.carb_g ?? food?.carb_g ?? 0) || 0,
    fat: Number(n?.fat_g ?? food?.fat_g ?? 0) || 0,
    fiber: Number(n?.fiber_g ?? food?.fiber_g ?? 0) || 0,
    sodium: Number(n?.sodium_mg ?? food?.sodium_mg ?? 0) || 0,
  };
}

function FoodImage({ food, size = 72 }: { food: any; size?: number }) {
  const image = getFoodImage(food);
  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: 12, backgroundColor: "#f0f0f0" }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }}>
      <Ionicons name="fast-food-outline" size={size * 0.42} color="#ccc" />
    </View>
  );
}

// ======================================================
// Main Component
// ======================================================
export default function Step2Screen() {
  const params = useLocalSearchParams<{ startDate?: string; endDate?: string; days?: string; plan_id?: string; }>();
  const startDate = params.startDate || "";
  const planId = params.plan_id || "";
  const planDays = Number(params.days) || 0;

  const dateTabs = useMemo(() => createDateList(startDate, planDays), [startDate, planDays]);
  const [selectedDay, setSelectedDay] = useState(0);

  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Swap Modal State
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selSlot, setSelSlot] = useState<{ date: string; idx: number; name: string; mode: "replace" | "add" } | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [kcalFilter, setKcalFilter] = useState("");
  const [calorieFilterInfo, setCalorieFilterInfo] = useState<{
    target_kcal: number;
    tolerance: number;
    has_matches: boolean;
  } | null>(null);
  const [safeFoods, setSafeFoods] = useState<any[]>([]);
  const [foodCategories, setFoodCategories] = useState<FoodCategoryOption[]>([]);
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<FoodCategoryOption | null>(null);
  const [searching, setSearching] = useState(false);
  const [safeFoodsError, setSafeFoodsError] = useState("");
  const [activeAllergyLabels, setActiveAllergyLabels] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail Modal State
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [savingFoodSelection, setSavingFoodSelection] = useState(false);
  const [foodDetailTab, setFoodDetailTab] = useState<"nutrition" | "ingredients">("nutrition");
  const [foodDetailLoading, setFoodDetailLoading] = useState(false);

  const selectedDate = dateTabs[selectedDay];
  const selectedPlan = plans.find((p) => p.date === selectedDate);

  // ─── Initialization ───
  const loadUserId = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem("currentUser");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.user_id) {
          setUserId(String(obj.user_id));
        }
      }
    } catch (e) {
      console.log("loadUserId error:", e);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      if (!planId) throw new Error("ไม่พบ plan_id");
      const url = `${BASE_URL}/api/meal/plans/${planId}`;
      const response = await axios.get(url, { timeout: 30000 });
      if (!response.data?.success) throw new Error(response.data?.message || "โหลดแผนอาหารไม่สำเร็จ");
      setPlans(response.data.plans || []);
    } catch (error: any) {
      Alert.alert("โหลดแผนไม่สำเร็จ", error?.message || "ไม่สามารถโหลดแผนอาหารได้");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      await loadUserId();
      if (!cancelled) {
        await loadPlans();
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loadPlans, loadUserId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // ─── Safe Swap Foods (Strict Allergen Filtering Backend Call) ───
  function extractFoodCategories(foods: any[]): FoodCategoryOption[] {
    const options = foods.map((food) => {
      const field = food?.category_type ? "category_type" as const : "category" as const;
      const value = String(food?.category_type || food?.category || "").trim();
      const label = String(food?.category_type_label || food?.category || value).trim();
      return value ? { field, value, label } : null;
    }).filter((item): item is FoodCategoryOption => !!item);
    return [...new Map(options.map((item) => [`${item.field}:${item.value}`, item])).values()]
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async function loadSafeFoods(query: string = "", targetKcal?: number, category: FoodCategoryOption | null = selectedFoodCategory) {
    if (!userId) {
      setSafeFoods([]);
      setSafeFoodsError("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      return;
    }
    setSearching(true);
    setSafeFoodsError("");
    try {
      // Backend api/meal/safe-foods MUST enforce allergen logic using user_id
      const params = new URLSearchParams({
        user_id: userId,
        q: query,
        limit: "all",
      });
      if (category) {
        params.set("category", category.value);
        params.set("category_field", category.field);
        params.set("category_label", category.label);
      }
      if (targetKcal !== undefined) {
        params.set("target_kcal", String(targetKcal));
        params.set("kcal_tolerance", "50");
      }
      const url = `${BASE_URL}/api/meal/safe-foods?${params.toString()}`;
      const response = await axios.get(url, { timeout: 15000 });
      if (response.data?.success) {
        const foods = response.data.foods || [];
        setSafeFoods(foods);
        setActiveAllergyLabels(Array.isArray(response.data.allergy_filters) ? response.data.allergy_filters : []);
        const fromFoods = extractFoodCategories(foods);
        if (fromFoods.length) {
          setFoodCategories((previous) => {
            const merged = [...previous, ...fromFoods];
            return [...new Map(merged.map((item) => [`${item.field}:${item.value}`, item])).values()]
              .sort((a, b) => a.label.localeCompare(b.label));
          });
        }
        setCalorieFilterInfo(response.data.calorie_filter || null);
      } else {
        setSafeFoods([]);
        setCalorieFilterInfo(null);
      }
    } catch (e) {
      console.error("loadSafeFoods error:", e);
      setSafeFoods([]);
      setCalorieFilterInfo(null);
      setSafeFoodsError(
        isAxiosError(e)
          ? e.response?.data?.message || e.message
          : "ไม่สามารถค้นหาเมนูอาหารได้"
      );
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    axios.get(`${BASE_URL}/api/meal/food-categories`, { timeout: 15000 })
      .then((response) => {
        if (!cancelled && response.data?.success) {
          setFoodCategories(Array.isArray(response.data.categories) ? response.data.categories : []);
        }
      })
      .catch((error) => console.warn("Could not load food categories:", error));
    return () => { cancelled = true; };
  }, []);

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
    const distinctFallbacks = ["🥟", "🥪", "🧆", "🥘", "🍛", "🧁", "🍙", "🥗", "🍢", "🥐"];
    const icon = !used.has(preferred) ? preferred : distinctFallbacks.find((item) => !used.has(item)) || "🍴";
    used.add(icon);
    return icon;
  }

  async function openFoodDetail(food: any) {
    setSelectedFood(food);
    setFoodDetailTab("nutrition");
    setShowFoodDetail(true);

    // Saved plan slots contain a compact food snapshot. Fetch the MasterFood
    // record when that snapshot has no ingredients so the detail tab can show them.
    const foodId = String(food?._id || food?.food_id || "");
    if (!foodId || (Array.isArray(food?.ingredients) && food.ingredients.length > 0)) return;

    try {
      setFoodDetailLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/meal/foods/${encodeURIComponent(foodId)}`,
        { timeout: 15000 }
      );
      const details = response.data?.food || response.data?.data;
      if (details) setSelectedFood({ ...food, ...details });
    } catch (error) {
      console.warn("Could not load menu ingredients:", error);
    } finally {
      setFoodDetailLoading(false);
    }
  }

  function onSearchChange(text: string) {
    setSearchQ(text);
    const numericSearch = text.trim();
    const isCalorieSearch = /^\d+$/.test(numericSearch);
    if (isCalorieSearch) {
      setKcalFilter(numericSearch);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const targetKcal = Number(kcalFilter);
      loadSafeFoods(
        isCalorieSearch ? "" : numericSearch,
        isCalorieSearch
          ? Number(numericSearch)
          : kcalFilter.trim() && Number.isFinite(targetKcal) && targetKcal >= 0
            ? targetKcal
            : undefined
      );
    }, 400);
  }

  function onKcalFilterChange(text: string) {
    const numericText = text.replace(/[^\d]/g, "");
    setKcalFilter(numericText);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const targetKcal = Number(numericText);
      loadSafeFoods(
        /^\d+$/.test(searchQ.trim()) ? "" : searchQ.trim(),
        numericText && Number.isFinite(targetKcal) && targetKcal >= 0
          ? targetKcal
          : undefined
      );
    }, 400);
  }

  function onFoodCategorySelect(category: FoodCategoryOption | null) {
    setSelectedFoodCategory(category);
    setCalorieFilterInfo(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    const searchText = searchQ.trim();
    const isCalorieSearch = /^\d+$/.test(searchText);
    const targetKcal = isCalorieSearch ? Number(searchText) : Number(kcalFilter);
    loadSafeFoods(
      isCalorieSearch ? "" : searchText,
      targetKcal > 0 || (kcalFilter === "0" && !isCalorieSearch) ? targetKcal : undefined,
      category
    );
  }

  function openSwapModal(date: string, idx: number, name: string, mode: "replace" | "add" = "replace") {
    setSelSlot({ date, idx, name, mode });
    setSearchQ("");
    setKcalFilter("");
    setSelectedFoodCategory(null);
    setCalorieFilterInfo(null);
    setSafeFoodsError("");
    setShowSwapModal(true);
    loadSafeFoods("", undefined, null); // Load default safe foods
  }

  async function handleSwapConfirm(newFood: any) {
    if (!selSlot || !selectedPlan) return;
    try {
      await axios.put(
        `${BASE_URL}/api/meal/plans/${planId}/meal`,
        {
          date: selSlot.date,
          slot_index: selSlot.idx,
          food_id: newFood._id,
        },
        { timeout: 15000 }
      );
      await loadPlans(); // Reload to get dynamic macros updated
      setShowSwapModal(false);
      setShowFoodDetail(false);
      setSelSlot(null);
      Alert.alert("สำเร็จ", "เปลี่ยนเมนูอาหารเรียบร้อยแล้ว");
    } catch (e: any) {
      Alert.alert(
        "เปลี่ยนเมนูไม่สำเร็จ",
        e?.response?.data?.message || e?.message || "เกิดข้อผิดพลาด"
      );
    }
  }

  async function handleFoodSelection(newFood: any) {
    if (!selSlot) {
      Alert.alert("ไม่สามารถเพิ่มเมนูได้", "กรุณาเลือกมื้ออาหารก่อน");
      return;
    }
    if (selSlot.mode !== "add") {
      await handleSwapConfirm(newFood);
      return;
    }
    const foodId = newFood?._id || newFood?.food_id;
    if (!selectedPlan || !foodId || savingFoodSelection) {
      if (!foodId) Alert.alert("ไม่สามารถเพิ่มเมนูได้", "ไม่พบรหัสเมนูอาหาร");
      return;
    }

    setSavingFoodSelection(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/meal/plans/${planId}/addon`,
        { date: selSlot.date, slot_index: selSlot.idx, food_id: foodId },
        { timeout: 15000 }
      );
      const updatedPlan = response.data?.updated_plan;
      if (!response.data?.success || !updatedPlan) {
        throw new Error(response.data?.message || "เซิร์ฟเวอร์ไม่ได้บันทึกเมนู");
      }
      setPlans((previous) => {
        const exists = previous.some((plan) => plan.date === updatedPlan.date);
        return exists
          ? previous.map((plan) => plan.date === updatedPlan.date ? updatedPlan : plan)
          : [...previous, updatedPlan].sort((a, b) => a.date.localeCompare(b.date));
      });
      setShowSwapModal(false);
      setShowFoodDetail(false);
      setSelSlot(null);
      Alert.alert("เพิ่มเมนูแล้ว", `เพิ่ม ${getFoodName(newFood)} ในมื้อนี้แล้ว`);
    } catch (e: any) {
      Alert.alert("เพิ่มเมนูไม่สำเร็จ", e?.response?.data?.message || e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingFoodSelection(false);
    }
  }

  async function handleDeleteAddon(date: string, slotIndex: number, addon: Food) {
    const foodId = addon.food_id || addon._id;
    if (!foodId || savingFoodSelection) return;
    setSavingFoodSelection(true);
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/meal/plans/${planId}/addon`,
        { data: { date, slot_index: slotIndex, food_id: foodId }, timeout: 15000 }
      );
      const updatedPlan = response.data?.updated_plan;
      if (!response.data?.success || !updatedPlan) {
        throw new Error(response.data?.message || "เซิร์ฟเวอร์ลบเมนูไม่สำเร็จ");
      }
      setPlans((previous) => previous.map((plan) => plan.date === updatedPlan.date ? updatedPlan : plan));
    } catch (e: any) {
      Alert.alert("ลบเมนูไม่สำเร็จ", e?.response?.data?.message || e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingFoodSelection(false);
    }
  }

  function handleSave() {
    if (saving || !planId) return;
    setSaving(true);
    // Replace to Main Plan Tab
    router.replace({ pathname: "/(tabs)/plan", params: { refresh: Date.now().toString(), plan_id: planId } });
  }

  // ─── Calculate planned energy for the selected day ───
  const targetKcal = selectedPlan?.daily_target_summary?.kcal ?? 0;
  const plannedTotals = selectedPlan?.slots.reduce((totals, slot) => {
    const foods = [...(slot.main_food ? [slot.main_food] : []), ...(slot.addons || [])];
    for (const item of foods) {
      const nutrition = getNutrition(item);
      totals.kcal += nutrition.kcal;
      totals.protein += nutrition.protein;
      totals.carbs += nutrition.carbs;
      totals.fat += nutrition.fat;
    }
    return totals;
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const plannedKcal = plannedTotals?.kcal ?? 0;
  const plannedProtein = plannedTotals?.protein ?? 0;
  const plannedCarbs = plannedTotals?.carbs ?? 0;
  const plannedFat = plannedTotals?.fat ?? 0;

  // ====================================================
  // Loading State
  // ====================================================
  if (loading) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
          <Text style={st.headerTitle}>สร้างแผนอาหาร</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={st.center}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={{ marginTop: 12, color: "#777" }}>กำลังจัดเตรียมแผนอาหารให้คุณ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ====================================================
  // Main Render
  // ====================================================
  return (
    <SafeAreaView style={st.container}>
      {/* HEADER */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/plan")}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={st.headerTitle}>สร้างแผนการกิน</Text>
          <Text style={st.headerStep}>ขั้นตอนที่ 2 จาก 2</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* DAY TABS (Scrollable) */}
      <View style={st.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {dateTabs.map((date, index) => {
            const active = index === selectedDay;
            return (
              <TouchableOpacity key={date} style={[st.dayTab, active && st.dayTabActive]} onPress={() => setSelectedDay(index)}>
                <Text style={[st.dayName, active && st.dayTextActive]}>{thaiDay(date)}</Text>
                <Text style={[st.dateText, active && st.dayTextActive]}>{fmtShort(date)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTENT SCROLL */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        
        {/* SUMMARY CARD */}
        <View style={st.summaryCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="flame-outline" size={22} color={ORANGE} />
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>{thaiDate(selectedDate)}</Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <View style={st.progressBar}>
              <View style={[ st.progressFill, { width: targetKcal > 0 ? `${Math.min(100, (plannedKcal / targetKcal) * 100)}%` : "0%", backgroundColor: plannedKcal > targetKcal ? "#FF3B30" : ORANGE } ]} />
            </View>
            <Text style={{ marginTop: 6, fontSize: 14, color: plannedKcal > targetKcal ? "#FF3B30" : "#777", textAlign: "right", fontWeight: "600" }}>
              ตามแผนอาหาร {Math.round(plannedKcal)} / {Math.round(targetKcal)} kcal
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 16 }}>
            {[
              { label: "Protein", val: plannedProtein, target: selectedPlan?.daily_target_summary?.protein_g ?? 0, color: "#3B82F6" },
              { label: "Carbs", val: plannedCarbs, target: selectedPlan?.daily_target_summary?.carb_g ?? 0, color: "#F59E0B" },
              { label: "Fat", val: plannedFat, target: selectedPlan?.daily_target_summary?.fat_g ?? 0, color: "#EF4444" },
            ].map((macro) => (
              <View key={macro.label} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>{macro.label}</Text>
                <Text style={{ fontSize: 17, fontWeight: "bold", color: macro.color, marginTop: 4 }}>
                  {Math.round(macro.val)} <Text style={{ fontSize: 12, color: "#999" }}>/ {Math.round(macro.target)}g</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#222" }}>มื้ออาหารประจำวัน</Text>

        {/* MEALS LIST */}
        {!selectedPlan || selectedPlan.slots.length === 0 ? (
          <View style={st.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
            <Text style={st.emptyText}>ไม่มีการจัดแผนในวันนี้</Text>
          </View>
        ) : (
          selectedPlan.slots.map((slot, idx) => {
            const hasFood = !!slot.main_food;
            const food: any = slot.main_food;
            const mealFoods = [...(slot.main_food ? [slot.main_food] : []), ...(slot.addons || [])];
            const mealNutrition = mealFoods.reduce((totals, item) => {
              const nutrition = getNutrition(item);
              totals.kcal += nutrition.kcal;
              totals.protein += nutrition.protein;
              totals.carbs += nutrition.carbs;
              totals.fat += nutrition.fat;
              return totals;
            }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });

            return (
              <View key={idx} style={st.mealCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name={mealIcon(slot.meal_type) as any} size={22} color="#444" />
                  
                  {/* Food Info Area */}
                  {hasFood ? (
                    <TouchableOpacity
                      onPress={() => { void openFoodDetail(food); }}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                      activeOpacity={0.7}
                    >
                      <FoodImage food={food} size={65} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: "#888", fontWeight: "600" }}>{slot.slot_name}</Text>
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#222", marginTop: 2 }} numberOfLines={2}>
                          {getFoodName(food)}
                        </Text>
                        <Text style={{ fontSize: 14, color: ORANGE, fontWeight: "bold", marginTop: 4 }}>
                          {getNutrition(food).kcal} kcal
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    // 🚨 EMPTY SLOT DUE TO ALLERGENS OR NO DATA
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ width: 65, height: 65, borderRadius: 12, backgroundColor: "#FFF0F0", justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="warning-outline" size={28} color="#FF3B30" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, color: "#888", fontWeight: "600" }}>{slot.slot_name}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#FF3B30", marginTop: 2 }}>ไม่มีเมนูที่เหมาะสม</Text>
                        <Text style={{ fontSize: 11, color: "#999", marginTop: 2 }}>(ติดเงื่อนไขการแพ้อาหาร หรือข้อมูลไม่พอ)</Text>
                      </View>
                    </View>
                  )}
                </View>

                {(slot.addons || []).map((addon, addonIndex) => (
                  <View
                    key={`${addon.food_id || addon._id || addon.name}-${addonIndex}`}
                    style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginLeft: 32, padding: 10, backgroundColor: "#FFF9ED", borderRadius: 10 }}
                  >
                    <TouchableOpacity onPress={() => { void openFoodDetail(addon); }} style={{ flex: 1, flexDirection: "row", alignItems: "center" }} activeOpacity={0.7}>
                      <FoodImage food={addon} size={52} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ color: "#333", fontWeight: "700" }} numberOfLines={2}>{getFoodName(addon)}</Text>
                        <Text style={{ color: ORANGE, fontWeight: "700", marginTop: 3 }}>{getNutrition(addon).kcal} kcal</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => { void handleDeleteAddon(selectedPlan.date, idx, addon); }}
                      disabled={savingFoodSelection}
                      accessibilityLabel={`ลบ${getFoodName(addon)}ออกจากมื้อนี้`}
                      style={{ padding: 8, marginLeft: 4 }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#D64545" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Macro Pills & Action Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  {mealFoods.length > 0 ? (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View style={st.macroPill}><Text style={st.macroPillText}>P {Math.round(mealNutrition.protein)}g</Text></View>
                      <View style={st.macroPill}><Text style={st.macroPillText}>C {Math.round(mealNutrition.carbs)}g</Text></View>
                      <View style={st.macroPill}><Text style={st.macroPillText}>F {Math.round(mealNutrition.fat)}g</Text></View>
                    </View>
                  ) : <View />}

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity style={st.actionBtn} onPress={() => openSwapModal(selectedPlan.date, idx, slot.slot_name, "replace")}>
                      <Ionicons name="search-outline" size={16} color={ORANGE} />
                      <Text style={{ fontSize: 12, color: ORANGE, fontWeight: "bold" }}>{hasFood ? "เปลี่ยนเมนู" : "เลือกเมนู"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={st.actionBtn} onPress={() => openSwapModal(selectedPlan.date, idx, slot.slot_name, "add")}>
                      <Ionicons name="add-outline" size={18} color={ORANGE} />
                      <Text style={{ fontSize: 12, color: ORANGE, fontWeight: "bold" }}>เพิ่มเมนู</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* FOOTER - SAVE BUTTON */}
      <View style={st.footer}>
        <TouchableOpacity
          style={[st.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />}
          <Text style={st.saveButtonText}>{saving ? "กำลังบันทึก..." : "ยืนยันและบันทึกแผน"}</Text>
        </TouchableOpacity>
      </View>

      {/* =====================================================
          SWAP MODAL (Mirroring plan.tsx but using Safe Foods)
      ===================================================== */}
      <Modal visible={showSwapModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSwapModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setShowSwapModal(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>{selSlot?.mode === "add" ? `เพิ่มเมนูใน ${selSlot?.name}` : `เปลี่ยน ${selSlot?.name}`}</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={st.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: "#333", marginLeft: 8 }}
              placeholder="ค้นหาเมนู หรือพิมพ์แคลอรี่ เช่น 100"
              value={searchQ}
              onChangeText={onSearchChange}
              autoFocus
            />
            {searchQ.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange("")}><Ionicons name="close-circle" size={20} color="#ccc" /></TouchableOpacity>
            )}
          </View>

          <View style={{ marginHorizontal: 16, marginTop: -6, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ color: "#666", fontSize: 13, fontWeight: "600" }}>กรองแคลอรี่</Text>
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

          {calorieFilterInfo && !calorieFilterInfo.has_matches && safeFoods.length > 0 && (
            <Text style={{ color: "#8a5a00", fontSize: 13, marginHorizontal: 16, marginBottom: 8 }}>
              ไม่พบเมนูในช่วง {calorieFilterInfo.target_kcal - calorieFilterInfo.tolerance}–{calorieFilterInfo.target_kcal + calorieFilterInfo.tolerance} kcal จึงแสดงเมนูที่ใกล้เคียงที่สุด
            </Text>
          )}

          {searching && <ActivityIndicator size="small" color={ORANGE} style={{ marginTop: 20 }} />}
          {!!safeFoodsError && !searching && (
            <Text style={{ color: "#B42318", fontSize: 13, textAlign: "center", marginHorizontal: 16, marginBottom: 8 }}>
              {safeFoodsError}
            </Text>
          )}

          <FlatList
            data={safeFoods}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              !searching ? (
                <View style={st.emptyContainer}>
                  <Ionicons name="shield-checkmark-outline" size={50} color="#ccc" />
                  <Text style={[st.emptyText, { marginTop: 12 }]}>
                    {calorieFilterInfo && !calorieFilterInfo.has_matches
                      ? "ไม่พบเมนูที่ใกล้เคียงกับแคลอรี่ที่เลือก"
                      : "ไม่พบเมนูที่ตรงเงื่อนไข"}
                  </Text>
                  <Text style={{ color: "#999", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                    {activeAllergyLabels.length
                      ? `กรองเมนูที่มี ${activeAllergyLabels.join(", ")} ตามข้อมูลแพ้ของคุณแล้ว`
                      : "ยังไม่ได้ระบุอาการแพ้ ระบบจึงไม่กรองเมนูด้วยข้อมูลการแพ้"}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const nutrition = getNutrition(item);
              return (
                <TouchableOpacity style={st.foodListItem} onPress={() => { void openFoodDetail(item); }}>
                  <FoodImage food={item} size={60} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }} numberOfLines={1}>{getFoodName(item)}</Text>
                    <Text style={{ fontSize: 14, color: ORANGE, fontWeight: "bold", marginTop: 4 }}>{nutrition.kcal} kcal</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Food detail follows the nutrition / ingredients layout used by scan results. */}
      <Modal visible={showFoodDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFoodDetail(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setShowFoodDetail(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>รายละเอียดอาหาร</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {selectedFood && (
              <>
                <View style={{ width: "100%", alignItems: "center", marginBottom: 16 }}>
                  <FoodImage food={selectedFood} size={250} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: "900", color: "#222" }}>{getFoodName(selectedFood)}</Text>
                {!!selectedFood.name_en && <Text style={{ color: "#888", marginTop: 4 }}>{selectedFood.name_en}</Text>}

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
                        {selectedFood.portion_reference?.unit_label ||
                          `${selectedFood.portion_reference?.total_weight_g || selectedFood.portion?.gram || 100} กรัม`}
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
                    ) : selectedFood.ingredients?.length ? selectedFood.ingredients.map((ingredient: any, index: number) => (
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

                <TouchableOpacity style={[st.replaceDetailBtn, { marginTop: 20, opacity: savingFoodSelection ? 0.65 : 1 }]} onPress={() => handleFoodSelection(selectedFood)} disabled={savingFoodSelection}>
                  {savingFoodSelection ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>{savingFoodSelection ? "กำลังเพิ่มเมนู..." : selSlot?.mode === "add" ? "เพิ่มเมนูนี้" : "เลือกเมนูนี้"}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ======================================================
// Styles (Merged from plan.tsx)
// ======================================================
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Header
  header: { height: 60, backgroundColor: ORANGE, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  headerStep: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2, textAlign: "center" },
  
  // Tab Bar
  tabBarContainer: { backgroundColor: "#fff", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dayTab: { width: 62, height: 66, borderRadius: 14, borderWidth: 1, borderColor: "#E2E2E2", justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  dayTabActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  dayName: { fontSize: 15, fontWeight: "bold", color: "#333" },
  dateText: { fontSize: 12, color: "#888", marginTop: 2 },
  dayTextActive: { color: "#fff" },
  
  // Summary Card
  summaryCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: ORANGE },
  progressBar: { height: 10, backgroundColor: "#eee", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  
  // Meal Card
  mealCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#E8E8E8", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  macroPill: { backgroundColor: "#F5F5F5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  macroPillText: { fontSize: 11, fontWeight: "700", color: "#666" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF8ED", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  
  // Empty
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 50, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#eee" },
  emptyText: { fontSize: 16, fontWeight: "bold", color: "#666", marginTop: 12 },
  
  // Modals
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 16, paddingHorizontal: 14, backgroundColor: "#f5f5f5", borderRadius: 12, height: 46 },
  foodListItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0", gap: 14 },
  
  // Detail
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 24, marginBottom: 12 },
  nutritionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  nutritionBox: { width: "48%", backgroundColor: "#FFF8E8", borderRadius: 12, padding: 16, alignItems: "center" },
  nutritionLabel: { fontSize: 13, color: "#777", marginBottom: 4 },
  nutritionValue: { fontSize: 24, fontWeight: "bold" },
  nutritionUnit: { fontSize: 12, color: "#999", marginTop: 2 },
  replaceDetailBtn: { marginTop: 30, backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  
  // Footer
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 30 : 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
  saveButton: { height: 56, borderRadius: 16, backgroundColor: ORANGE, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" }
});
