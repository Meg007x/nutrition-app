import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IngredientTabKey = "veg_group" | "seasoning_group" | "protein_group";
type TabKey = "nutrition" | "ingredients";

type IngredientItem = {
  ingredient_id: string;
  name: string;
  category?: string;
  category_group?: IngredientTabKey | string;
  category_group_label?: string;
  sub_category?: string;
  sub_category_label?: string;
  qty: number;
  unit: string;
  keywords?: string[];
};

type FoodData = {
  id: string;
  dishName: string;
  dishNameEn?: string;
  category?: string;
  cuisine?: string[];
  tags?: string[];
  image?: string | null;
  calories: number;
  protein: number;
  carb: number;
  fat: number;
  fiber: number;
  sodium: number;
  portion: {
    unit: string;
    gram: number;
  };
  ingredients: IngredientItem[];
  allergens: string[];
};

type AnalyzeResponse = {
  success: boolean;
  source?: string;
  matchedBy?: string;
  aiDetection?: {
    dishName?: string;
    dishNameEn?: string;
    possibleKeywords?: string[];
    category?: string;
  };
  data?: FoodData;
  error?: string;
};

type MealSettingsResponse = {
  success: boolean;
  mealOptions?: string[];
  mealSchedules?: {
    name: string;
    time: string;
    notify: boolean;
  }[];
  mealsPerDay?: number;
  error?: string;
};

type DailySummaryResponse = {
  success: boolean;
  date?: string;
  count?: number;
  summary?: {
    calories: number;
    protein: number;
    carb: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  logs?: any[];
  error?: string;
};

type CurrentUser = {
  _id?: string;
  user_id: string;
  username?: string;
  email?: string;
  health_goals?: {
    protein_target_g?: number;
    tdee_target_kcal?: number;
  };
  meal_settings?: {
    meals_per_day?: number;
    schedules?: {
      name: string;
      time?: string;
      notify?: boolean;
    }[];
  };
};

const ORANGE = "#F28A1A";
const BG = "#F4F4F4";
const WHITE = "#FFFFFF";
const BORDER = "#202020";

const FORCE_MOCK_MODE = false;

const GROUP_LABELS: Record<IngredientTabKey, string> = {
  veg_group: "ผักและผลไม้",
  seasoning_group: "เครื่องปรุง/ส่วนผสม",
  protein_group: "เนื้อสัตว์และโปรตีน",
};

const DEFAULT_DAILY_TARGET = {
  calories: 1625,
  protein: 55,
  carb: 220,
  fat: 50,
  fiber: 25,
  sodium: 2000,
};

const DEFAULT_MEALS = ["เช้า", "กลางวัน", "เย็น", "คํ่า", "ดึก"];
const MAX_EXTRA_INGREDIENTS = 5;

const MOCK_FOOD_DATA: FoodData = {
  id: "f_spaghetti_tomato_basil",
  dishName: "สปาเก็ตตี้ซอสมะเขือเทศและโหระพา",
  dishNameEn: "Spaghetti with Tomato and Basil",
  category: "main_dish",
  cuisine: ["western"],
  tags: ["Carb", "Pasta", "Vegetarian"],
  image: "master/spaghetti_tomato_basil.jpg",
  calories: 320,
  protein: 9,
  carb: 52,
  fat: 9,
  fiber: 5,
  sodium: 520,
  portion: {
    unit: "plate",
    gram: 250,
  },
  ingredients: [
    {
      ingredient_id: "ing_pasta",
      name: "เส้นพาสต้า",
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "bread_flour",
      sub_category_label: "ขนมปังและแป้ง",
      qty: 120,
      unit: "g",
    },
    {
      ingredient_id: "ing_tomato",
      name: "มะเขือเทศ",
      category_group: "veg_group",
      category_group_label: "ผักและผลไม้",
      sub_category: "vegetable",
      sub_category_label: "ผัก",
      qty: 180,
      unit: "g",
    },
    {
      ingredient_id: "ing_basil",
      name: "ใบโหระพา",
      category_group: "veg_group",
      category_group_label: "ผักและผลไม้",
      sub_category: "herb",
      sub_category_label: "สมุนไพร",
      qty: 8,
      unit: "g",
    },
    {
      ingredient_id: "ing_garlic",
      name: "กระเทียม",
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "seasoning",
      sub_category_label: "เครื่องปรุง",
      qty: 10,
      unit: "g",
    },
    {
      ingredient_id: "ing_olive_oil",
      name: "น้ำมันมะกอก",
      category_group: "seasoning_group",
      category_group_label: "เครื่องปรุง/ส่วนผสม",
      sub_category: "seasoning",
      sub_category_label: "เครื่องปรุง",
      qty: 15,
      unit: "ml",
    },
  ],
  allergens: ["Gluten"],
};

function getThaiUnit(unit?: string) {
  const normalized = (unit || "").toLowerCase();
  if (normalized === "plate") return "จาน";
  if (normalized === "bowl") return "ชาม";
  if (normalized === "cup") return "ถ้วย";
  if (normalized === "piece") return "ชิ้น";
  return unit || "หน่วย";
}

function buildPortionLabel(multiplier: number, unit: string, gram: number) {
  const thaiUnit = getThaiUnit(unit);

  if (multiplier === 0.5) {
    return `ครึ่ง${thaiUnit} (${Math.round(gram * 0.5)} กรัม)`;
  }
  if (multiplier === 1) {
    return `1 ${thaiUnit} (${Math.round(gram)} กรัม)`;
  }
  return `${multiplier} ${thaiUnit} (${Math.round(gram * multiplier)} กรัม)`;
}

function getApiBase() {
  return Platform.OS === "web"
    ? "http://localhost:3000"
    : "http://172.16.8.225:3000";
}

function fallbackGroupFromLegacyCategory(category?: string): IngredientTabKey {
  const c = String(category || "").trim().toLowerCase();

  if (["veg", "veg_fruit", "fruit", "vegetable"].includes(c)) {
    return "veg_group";
  }
  if (
    [
      "seasoning",
      "condiment",
      "dairy",
      "bread",
      "sweet",
      "egg_cheese",
      "egg",
      "cheese",
      "other",
    ].includes(c)
  ) {
    return "seasoning_group";
  }

  return "protein_group";
}

function fallbackGroupLabelFromLegacyCategory(category?: string) {
  return GROUP_LABELS[fallbackGroupFromLegacyCategory(category)];
}

function fallbackSubCategoryFromLegacy(item: any): string {
  const category = String(item?.category || "").trim().toLowerCase();
  const name = String(item?.name || "").trim();

  if (category === "veg") {
    if (["ใบโหระพา", "พาร์สลีย์"].includes(name)) return "herb";
    return "vegetable";
  }

  if (category === "veg_fruit") {
    if (["กล้วยหอม", "แอปเปิล"].includes(name)) return "fruit";
    return "vegetable";
  }

  if (category === "seasoning") {
    if (["ครีมซอส"].includes(name)) return "sauce";
    if (["เส้นพาสต้า", "แป้งพิซซ่า"].includes(name)) return "bread_flour";
    return "seasoning";
  }

  if (category === "dairy") return "dairy";
  if (category === "egg_cheese") return "egg_cheese";
  if (category === "bread") return "bread_flour";
  if (category === "sweet") return "sweetener";
  if (category === "other") {
    if (["ชีส"].includes(name)) return "egg_cheese";
    return "other";
  }
  if (category === "meat") return "meat";
  if (category === "seafood") return "seafood";
  if (category === "nuts") return "nuts_seeds";

  return "other";
}

function fallbackSubCategoryLabel(subCategory?: string) {
  const map: Record<string, string> = {
    vegetable: "ผัก",
    fruit: "ผลไม้",
    herb: "สมุนไพร",
    seasoning: "เครื่องปรุง",
    sauce: "ซอส",
    dairy: "นมและผลิตภัณฑ์นม",
    egg_cheese: "ไข่และชีส",
    bread_flour: "ขนมปังและแป้ง",
    sweetener: "ของหวานและน้ำตาล",
    other: "อื่น ๆ",
    meat: "เนื้อสัตว์",
    seafood: "อาหารทะเล",
    nuts_seeds: "ถั่วและเมล็ดพืช",
  };

  return map[subCategory || "other"] || "อื่น ๆ";
}

function buildDynamicDailyTarget(user: CurrentUser | null) {
  const calories = Number(user?.health_goals?.tdee_target_kcal);
  const protein = Number(user?.health_goals?.protein_target_g);

  return {
    calories: calories > 0 ? Math.round(calories) : DEFAULT_DAILY_TARGET.calories,
    protein: protein > 0 ? Math.round(protein) : DEFAULT_DAILY_TARGET.protein,
    carb: DEFAULT_DAILY_TARGET.carb,
    fat: DEFAULT_DAILY_TARGET.fat,
    fiber: DEFAULT_DAILY_TARGET.fiber,
    sodium: DEFAULT_DAILY_TARGET.sodium,
  };
}

export default function ResultScreen() {
  const {
    imageUri,
    userId: routeUserId,
    date: routeDate,
    mealType: routeMealType,
    returnTo,
  } = useLocalSearchParams<{
    imageUri?: string;
    userId?: string;
    date?: string;
    mealType?: string;
    returnTo?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("nutrition");

  const [food, setFood] = useState<FoodData | null>(null);
  const [aiDishName, setAiDishName] = useState("");
  const [customDishName, setCustomDishName] = useState("");

  const [customGram, setCustomGram] = useState("");
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState("");

  const [mealOptions, setMealOptions] = useState<string[]>(DEFAULT_MEALS);
  const [selectedMeal, setSelectedMeal] = useState(DEFAULT_MEALS[0]);

  const [ingredientOptions, setIngredientOptions] = useState<IngredientItem[]>([]);
  const [extraIngredientInput, setExtraIngredientInput] = useState("");
  const [extraIngredients, setExtraIngredients] = useState<IngredientItem[]>([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const [ingredientTab, setIngredientTab] = useState<IngredientTabKey>("veg_group");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");

  const [dailyConsumed, setDailyConsumed] = useState({
    calories: 0,
    protein: 0,
    carb: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
  });

  const API_BASE = getApiBase();
  const ANALYZE_API_URL = `${API_BASE}/api/ai/analyze`;
  const DAILY_TARGET = useMemo(() => buildDynamicDailyTarget(currentUser), [currentUser]);

  const resetDailyConsumed = () => {
    setDailyConsumed({
      calories: 0,
      protein: 0,
      carb: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
    });
  };

  const hydrateUserState = (raw: any) => {
    const candidate = raw?.user ?? raw;
    const userId = String(candidate?.user_id || candidate?.id || "").trim();

    if (!userId) {
      return false;
    }

    setCurrentUser({
      ...candidate,
      user_id: userId,
    });
    setResolvedUserId(userId);
    return true;
  };

  const fetchUserProfile = async (userId: string) => {
    const endpoints = [`${API_BASE}/api/users/${userId}`];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) continue;

        const res = await response.json();
        const candidate = res?.data || res?.user || res;

        if (candidate?.user_id) {
          setCurrentUser({
            ...candidate,
            user_id: candidate.user_id,
          });
          return;
        }
      } catch (_) {}
    }
  };

  const loadCurrentUser = async () => {
    try {
      setLoadingUser(true);

      if (routeUserId && String(routeUserId).trim()) {
        const normalizedUserId = String(routeUserId).trim();
        setResolvedUserId(normalizedUserId);
        setCurrentUser({ user_id: normalizedUserId });
        await fetchUserProfile(normalizedUserId);
        return;
      }

      const possibleKeys = [
        "loggedInUser",
        "currentUser",
        "user",
        "authUser",
        "userData",
      ];

      for (const key of possibleKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        try {
          const parsed = JSON.parse(raw);
          const found = hydrateUserState(parsed);
          if (found) {
            await fetchUserProfile(String(parsed?.user?.user_id || parsed?.user_id));
            return;
          }
        } catch (_) {}
      }

      setCurrentUser(null);
      setResolvedUserId("");
    } catch (error) {
      console.error("❌ loadCurrentUser error:", error);
      setCurrentUser(null);
      setResolvedUserId("");
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (FORCE_MOCK_MODE) {
      setFood(MOCK_FOOD_DATA);
      setAiDishName(MOCK_FOOD_DATA.dishName);
      setCustomDishName(MOCK_FOOD_DATA.dishName);
      setLoading(false);
      return;
    }

    if (imageUri) {
      analyzeImage();
    } else {
      setLoading(false);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่พบรูปภาพที่ต้องการวิเคราะห์");
    }
  }, [imageUri]);

  useEffect(() => {
    if (!resolvedUserId) {
      setMealOptions(DEFAULT_MEALS);
      setSelectedMeal((prev) =>
        DEFAULT_MEALS.includes(prev) ? prev : DEFAULT_MEALS[0]
      );
      resetDailyConsumed();
      return;
    }

    fetchMealSettings();
    fetchDailySummary();
  }, [resolvedUserId, currentUser?.meal_settings?.schedules?.length]);

  useEffect(() => {
    setSelectedSubCategory("all");
  }, [ingredientTab]);

  const fetchMealSettings = async () => {
    if (!resolvedUserId) {
      setMealOptions(DEFAULT_MEALS);
      setSelectedMeal(DEFAULT_MEALS[0]);
      return;
    }

    try {
      setLoadingMeals(true);

      const response = await fetch(
        `${API_BASE}/api/users/${resolvedUserId}/meal-settings`
      );
      const res: MealSettingsResponse = await response.json();

      let nextMeals: string[] = [];

      if (
        response.ok &&
        res.success &&
        Array.isArray(res.mealOptions) &&
        res.mealOptions.length > 0
      ) {
        nextMeals = res.mealOptions;
      } else if (
        currentUser?.meal_settings?.schedules &&
        currentUser.meal_settings.schedules.length > 0
      ) {
        nextMeals = currentUser.meal_settings.schedules
          .map((item) => item?.name?.trim())
          .filter(Boolean) as string[];
      }

      if (nextMeals.length === 0) {
        nextMeals = DEFAULT_MEALS;
      }

      setMealOptions(nextMeals);
      setSelectedMeal((prev) => {
        const preferredMeal = String(routeMealType || "").trim();
        if (preferredMeal && nextMeals.includes(preferredMeal)) {
          return preferredMeal;
        }
        return nextMeals.includes(prev) ? prev : nextMeals[0];
      });
    } catch (error) {
      const fallbackMeals =
        currentUser?.meal_settings?.schedules
          ?.map((item) => item?.name?.trim())
          .filter(Boolean) || DEFAULT_MEALS;

      setMealOptions(fallbackMeals);
      setSelectedMeal((prev) => {
        const preferredMeal = String(routeMealType || "").trim();
        if (preferredMeal && fallbackMeals.includes(preferredMeal)) {
          return preferredMeal;
        }
        return fallbackMeals.includes(prev) ? prev : fallbackMeals[0];
      });
    } finally {
      setLoadingMeals(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      setLoadingIngredients(true);

      const response = await fetch(`${API_BASE}/api/ingredients`);
      const res = await response.json();

      let items: any[] = [];

      if (Array.isArray(res)) {
        items = res;
      } else if (Array.isArray(res?.data)) {
        items = res.data;
      } else if (Array.isArray(res?.ingredients)) {
        items = res.ingredients;
      }

      const mapped: IngredientItem[] = items
        .map((item: any) => {
          const category_group =
            item.category_group ||
            fallbackGroupFromLegacyCategory(item.category);
          const category_group_label =
            item.category_group_label ||
            fallbackGroupLabelFromLegacyCategory(item.category);
          const sub_category =
            item.sub_category || fallbackSubCategoryFromLegacy(item);
          const sub_category_label =
            item.sub_category_label ||
            fallbackSubCategoryLabel(sub_category);

          return {
            ingredient_id: item._id || item.ingredient_id || "",
            name: item.name || "",
            category: item.category || "",
            category_group,
            category_group_label,
            sub_category,
            sub_category_label,
            qty: 1,
            unit: item.default_unit || "หน่วย",
            keywords: Array.isArray(item.keywords) ? item.keywords : [],
          };
        })
        .filter((item) => item.ingredient_id && item.name);

      setIngredientOptions(mapped);
    } catch (error) {
      console.error("❌ fetchIngredients error:", error);
      setIngredientOptions([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const fetchDailySummary = async () => {
    if (!resolvedUserId) {
      resetDailyConsumed();
      return;
    }

    try {
      const today = new Date();
      const fallbackDate = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const date = String(routeDate || fallbackDate);

      const response = await fetch(
        `${API_BASE}/api/scan-sessions/daily-summary/${resolvedUserId}?date=${date}`
      );
      const res: DailySummaryResponse = await response.json();

      if (response.ok && res.success && res.summary) {
        setDailyConsumed(res.summary);
      } else {
        resetDailyConsumed();
      }
    } catch (error) {
      resetDailyConsumed();
    }
  };

  const analyzeImage = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (Platform.OS === "web") {
        const responseImg = await fetch(imageUri as string);
        const blob = await responseImg.blob();
        formData.append("image", blob, "food_image.jpg");
      } else {
        // @ts-ignore
        formData.append("image", {
          uri: imageUri,
          name: "food_image.jpg",
          type: "image/jpeg",
        });
      }

      const response = await fetch(ANALYZE_API_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const res: AnalyzeResponse = await response.json();

      if (!response.ok || !res.success || !res.data) {
        throw new Error(res.error || "ไม่สามารถวิเคราะห์อาหารได้");
      }

      setFood(res.data);
      setAiDishName(res.aiDetection?.dishName || "");
      setCustomDishName(res.data.dishName || "");
    } catch (err: any) {
      console.error("❌ analyzeImage error:", err);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        err.message || "ไม่สามารถเชื่อมต่อกับ Server ได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const baseGram = food?.portion?.gram || 100;

  const selectedGram = useMemo(() => {
    const custom = Number(customGram);
    if (!Number.isNaN(custom) && custom > 0) {
      return custom;
    }
    return baseGram * portionMultiplier;
  }, [customGram, baseGram, portionMultiplier]);

  const ratio = useMemo(() => {
    if (!baseGram || baseGram <= 0) return 1;
    return selectedGram / baseGram;
  }, [selectedGram, baseGram]);

  const scaledNutrition = useMemo(() => {
    if (!food) {
      return {
        calories: 0,
        protein: 0,
        carb: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
      };
    }

    const round1 = (n: number) => Math.round(n * 10) / 10;

    return {
      calories: Math.round(food.calories * ratio),
      protein: round1(food.protein * ratio),
      carb: round1(food.carb * ratio),
      fat: round1(food.fat * ratio),
      fiber: round1(food.fiber * ratio),
      sodium: round1(food.sodium * ratio),
    };
  }, [food, ratio]);

  const dailyTotal = useMemo(() => {
    return {
      calories: dailyConsumed.calories + scaledNutrition.calories,
      protein: dailyConsumed.protein + scaledNutrition.protein,
      carb: dailyConsumed.carb + scaledNutrition.carb,
      fat: dailyConsumed.fat + scaledNutrition.fat,
      fiber: dailyConsumed.fiber + scaledNutrition.fiber,
      sodium: dailyConsumed.sodium + scaledNutrition.sodium,
    };
  }, [scaledNutrition, dailyConsumed]);

  const currentPortionText = useMemo(() => {
    if (!food) return "";
    return buildPortionLabel(
      portionMultiplier,
      food.portion.unit,
      food.portion.gram
    );
  }, [food, portionMultiplier]);

  const selectedIngredientLabel = extraIngredientInput || "เลือกส่วนผสม";

  const currentTabIngredients = useMemo(() => {
    return ingredientOptions.filter(
      (item) => item.category_group === ingredientTab
    );
  }, [ingredientOptions, ingredientTab]);

  const subCategoryOptions = useMemo(() => {
    const map = new Map<string, string>();

    currentTabIngredients.forEach((item) => {
      if (item.sub_category) {
        map.set(
          item.sub_category,
          item.sub_category_label || fallbackSubCategoryLabel(item.sub_category)
        );
      }
    });

    return [
      { value: "all", label: "ทั้งหมด" },
      ...Array.from(map.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [currentTabIngredients]);

  const filteredIngredientOptions = useMemo(() => {
    if (selectedSubCategory === "all") return currentTabIngredients;
    return currentTabIngredients.filter(
      (item) => item.sub_category === selectedSubCategory
    );
  }, [currentTabIngredients, selectedSubCategory]);

  const vegCount = ingredientOptions.filter(
    (item) => item.category_group === "veg_group"
  ).length;

  const seasoningCount = ingredientOptions.filter(
    (item) => item.category_group === "seasoning_group"
  ).length;

  const proteinCount = ingredientOptions.filter(
    (item) => item.category_group === "protein_group"
  ).length;

  const sanitizeQtyInput = (value: string) => {
    let cleaned = value.replace(/[^0-9.]/g, "");

    const firstDotIndex = cleaned.indexOf(".");
    if (firstDotIndex !== -1) {
      cleaned =
        cleaned.slice(0, firstDotIndex + 1) +
        cleaned.slice(firstDotIndex + 1).replace(/\./g, "");
    }

    return cleaned;
  };

  const getQtyStep = (unit?: string) => {
    switch ((unit || "").toLowerCase()) {
      case "g":
      case "gram":
        return 1;
      case "ml":
        return 5;
      case "tsp":
      case "ช้อนชา":
        return 0.5;
      case "tbsp":
      case "ช้อนโต๊ะ":
        return 0.5;
      case "piece":
      case "ชิ้น":
        return 1;
      default:
        return 1;
    }
  };

  const clampQty = (num: number, min = 0.1, max = 5000) => {
    if (Number.isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
  };

  const updateExtraIngredientQty = (index: number, value: string) => {
    const cleaned = sanitizeQtyInput(value);

    setExtraIngredients((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              qty: cleaned === "" ? 0 : Number(cleaned),
            }
          : item
      )
    );
  };

  const normalizeExtraIngredientQty = (index: number) => {
    setExtraIngredients((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              qty: clampQty(Number(item.qty || 0)),
            }
          : item
      )
    );
  };

  const increaseExtraIngredientQty = (index: number) => {
    setExtraIngredients((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const step = getQtyStep(item.unit);
        const nextQty = clampQty(
          Math.round((Number(item.qty || 0) + step) * 10) / 10
        );

        return {
          ...item,
          qty: nextQty,
        };
      })
    );
  };

  const decreaseExtraIngredientQty = (index: number) => {
    setExtraIngredients((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const step = getQtyStep(item.unit);
        const nextQty = clampQty(
          Math.round((Number(item.qty || 0) - step) * 10) / 10
        );

        return {
          ...item,
          qty: nextQty,
        };
      })
    );
  };

  const handleAddExtraIngredient = () => {
    const found = ingredientOptions.find(
      (item) => item.name === extraIngredientInput
    );

    if (!found) {
      Alert.alert("ไม่พบส่วนผสม", "กรุณาเลือกส่วนผสมจากดรอปดาวลิส");
      return;
    }

    if (extraIngredients.length >= MAX_EXTRA_INGREDIENTS) {
      Alert.alert(
        "เพิ่มส่วนผสมเกินกำหนด",
        `สามารถเพิ่มส่วนผสมได้ไม่เกิน ${MAX_EXTRA_INGREDIENTS} รายการ`
      );
      return;
    }

    const isDuplicate = extraIngredients.some(
      (item) => item.ingredient_id === found.ingredient_id
    );

    if (isDuplicate) {
      Alert.alert("เพิ่มแล้ว", "ส่วนผสมนี้ถูกเพิ่มไปแล้ว");
      return;
    }

    setExtraIngredients((prev) => [
      ...prev,
      {
        ...found,
        qty: found.qty && found.qty > 0 ? found.qty : 1,
      },
    ]);
    setExtraIngredientInput("");
  };

  const removeExtraIngredient = (index: number) => {
    setExtraIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const goToFoodScanIndex = () => {
    try {
      router.back();
    } catch (_) {
      try {
        router.replace("/food-scan" as any);
      } catch (__) {
        try {
          router.push("/food-scan" as any);
        } catch (_3) {}
      }
    }
  };

  const resetAndGoBack = () => {
    setFood(null);
    setAiDishName("");
    setCustomDishName("");
    setCustomGram("");
    setPortionMultiplier(1);
    setExtraIngredientInput("");
    setExtraIngredients([]);
    setSelectedMeal(mealOptions[0] || DEFAULT_MEALS[0]);
    setActiveTab("nutrition");
    setSelectedSubCategory("all");
    setShowEditModal(false);
    setShowMealModal(false);
    setShowPortionModal(false);
    setShowIngredientModal(false);
    setShowDeleteConfirmModal(false);

    goToFoodScanIndex();
  };

  const handleDelete = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleEditOpen = () => {
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!customDishName.trim()) {
      Alert.alert("กรุณาระบุชื่อเมนู", "ชื่อเมนูห้ามว่าง");
      return;
    }
    setShowEditModal(false);
  };

  const handleSave = async () => {
    if (!food || saving) return;

    if (!resolvedUserId) {
      Alert.alert("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      return;
    }

    try {
      setSaving(true);

      const invalidExtraIngredient = extraIngredients.find(
        (item) =>
          item.qty === undefined ||
          item.qty === null ||
          Number(item.qty) <= 0 ||
          Number.isNaN(Number(item.qty))
      );

      if (invalidExtraIngredient) {
        Alert.alert(
          "ปริมาณไม่ถูกต้อง",
          `กรุณาตรวจสอบปริมาณของ ${invalidExtraIngredient.name}`
        );
        setSaving(false);
        return;
      }

      const today = new Date();
      const fallbackDate = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const date = String(routeDate || fallbackDate);

      const payload = {
        user_id: resolvedUserId,
        date,
        meal_type: selectedMeal,

        food_id: food.id,
        food_name: customDishName || food.dishName,
        food_name_en: food.dishNameEn || "",
        source: FORCE_MOCK_MODE ? "mock" : "database",

        selected_portion: {
          mode:
            customGram && Number(customGram) > 0 ? "custom_gram" : "portion",
          multiplier: portionMultiplier,
          gram: selectedGram,
          unit: food.portion.unit,
          base_gram: food.portion.gram,
          display_text: currentPortionText,
        },

        nutrition: {
          kcal: scaledNutrition.calories,
          protein_g: scaledNutrition.protein,
          carb_g: scaledNutrition.carb,
          fat_g: scaledNutrition.fat,
          fiber_g: scaledNutrition.fiber,
          sodium_mg: scaledNutrition.sodium,
        },

        ingredients_from_master: food.ingredients,
        extra_ingredients: extraIngredients,
        image_uri: imageUri || "",
      };

      const response = await fetch(`${API_BASE}/api/scan-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const res = await response.json();

      if (response.status === 409) {
        throw new Error(res.error || "รายการนี้ถูกบันทึกไปแล้ว");
      }

      if (!response.ok || !res.success) {
        throw new Error(res.error || "ไม่สามารถบันทึกมื้ออาหารได้");
      }

      await fetchDailySummary();

      Alert.alert("บันทึกสำเร็จ", "ระบบได้บันทึกรายการอาหารเรียบร้อยแล้ว");

      requestAnimationFrame(() => {
        try {
          if (returnTo === "meal-entry") {
            router.replace({
              pathname: "/meal-entry",
              params: {
                ...(routeDate ? { date: String(routeDate) } : {}),
                ...(selectedMeal ? { mealType: String(selectedMeal) } : {}),
              },
            });
            return;
          }

          router.back();
        } catch (_) {}
      });
    } catch (error: any) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ marginTop: 16, fontWeight: "700" }}>
          กำลังวิเคราะห์อาหาร...
        </Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.center}>
        <Text>ไม่พบข้อมูลอาหาร</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={30} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>อาหารที่พบ</Text>
        </View>

        <View style={styles.previewWrap}>
          <View style={styles.frameWrap}>
            <Image
              source={{
                uri:
                  imageUri ||
                  "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=1200&auto=format&fit=crop",
              }}
              style={styles.foodImg}
            />
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.titleRow}>
            <Text style={styles.foodTitle}>
              {customDishName || food.dishName}
            </Text>
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={handleEditOpen}>
                <Ionicons name="create-outline" size={28} color="#111" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={28} color="#111" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabWrap}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "nutrition" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("nutrition")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "nutrition" && styles.tabTextActive,
                ]}
              >
                โภชนาการ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === "ingredients" && styles.tabActive,
              ]}
              onPress={() => setActiveTab("ingredients")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "ingredients" && styles.tabTextActive,
                ]}
              >
                ส่วนผสม
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "nutrition" ? (
            <>
              <View style={styles.orangeBox}>
                <Text style={styles.orangeTitle}>น้ำหนักอาหาร</Text>

                <View style={styles.inputBox}>
                  <TextInput
                    value={customGram}
                    onChangeText={setCustomGram}
                    placeholder="กรอกน้ำหนัก (กรัม)"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <Text style={styles.inputUnit}>g</Text>
                </View>

                <Text style={styles.subText}>หรือเลือกจากปริมาณมาตรฐาน</Text>

                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setShowPortionModal(true)}
                >
                  <Text style={styles.selectText}>{currentPortionText}</Text>
                  <Ionicons name="chevron-down" size={22} color="#111" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.kcalRow}>
                  <View style={styles.kcalTitleWrap}>
                    <Ionicons name="flame-outline" size={30} color="#FF4A3D" />
                    <Text style={styles.cardTitle}>แคลอรี่</Text>
                  </View>
                  <Text style={styles.mainValue}>
                    {scaledNutrition.calories} / {DAILY_TARGET.calories.toLocaleString()} kcal
                  </Text>
                </View>

                <Text style={styles.helperText}>
                  รวมวันนี้หลังบันทึก: {dailyTotal.calories} kcal
                </Text>

                <View style={{ height: 20 }} />

                <View style={styles.kcalTitleWrap}>
                  <Ionicons name="pie-chart-outline" size={28} color="#18D92E" />
                  <Text style={styles.cardTitle}>สารอาหารหลัก</Text>
                </View>

                <MacroRow
                  label="โปรตีน"
                  value={dailyTotal.protein}
                  target={DAILY_TARGET.protein}
                  unit="g"
                  color="#E53935"
                />
                <MacroRow
                  label="ไขมัน"
                  value={dailyTotal.fat}
                  target={DAILY_TARGET.fat}
                  unit="g"
                  color="#FBC02D"
                />
                <MacroRow
                  label="คาร์บ"
                  value={dailyTotal.carb}
                  target={DAILY_TARGET.carb}
                  unit="g"
                  color="#1E88E5"
                />

                <SimpleMetricRow
                  label="ใยอาหาร"
                  value={dailyTotal.fiber}
                  target={DAILY_TARGET.fiber}
                  unit="g"
                />
                <SimpleMetricRow
                  label="โซเดียม"
                  value={dailyTotal.sodium}
                  target={DAILY_TARGET.sodium}
                  unit="mg"
                />
              </View>
            </>
          ) : (
            <View style={styles.infoCard}>
              <View style={styles.sectionHeadRow}>
                <Text style={styles.sectionTitle}>ส่วนผสม</Text>
                <Text style={styles.sectionUnitTitle}>เมตริก</Text>
              </View>

              {food.ingredients.map((item, index) => (
                <View key={`${item.ingredient_id}-${index}`} style={styles.ingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingName}>{item.name}</Text>
                    <Text style={styles.ingCategory}>
                      {item.sub_category_label ||
                        item.category_group_label ||
                        "วัตถุดิบ"}
                    </Text>
                  </View>
                  <Text style={styles.ingVal}>
                    {item.qty} {item.unit}
                  </Text>
                </View>
              ))}

              {extraIngredients.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
                    ส่วนผสมที่เพิ่ม
                  </Text>
                  {extraIngredients.map((item, index) => (
                    <View key={`extra-${index}`} style={styles.ingRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{item.name}</Text>
                        <Text style={styles.ingCategory}>
                          {item.sub_category_label ||
                            item.category_group_label ||
                            "วัตถุดิบ"}
                        </Text>
                      </View>

                      <View style={styles.extraEditorWrap}>
                        <View style={styles.qtyControl}>
                          <TextInput
                            value={String(item.qty ?? "")}
                            onChangeText={(value) =>
                              updateExtraIngredientQty(index, value)
                            }
                            onBlur={() => normalizeExtraIngredientQty(index)}
                            keyboardType={
                              Platform.OS === "ios" ? "decimal-pad" : "numeric"
                            }
                            style={styles.qtyInput}
                            placeholder="1"
                            placeholderTextColor="#999"
                          />

                          <View style={styles.arrowWrap}>
                            <TouchableOpacity
                              onPress={() => increaseExtraIngredientQty(index)}
                            >
                              <Ionicons name="chevron-up" size={16} color="#111" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => decreaseExtraIngredientQty(index)}
                            >
                              <Ionicons name="chevron-down" size={16} color="#111" />
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.qtyUnit}>{item.unit}</Text>
                        </View>

                        <TouchableOpacity onPress={() => removeExtraIngredient(index)}>
                          <Ionicons
                            name="close-circle"
                            size={22}
                            color="#C62828"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}

              <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionTitle}>เพิ่มส่วนผสม</Text>

                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setShowIngredientModal(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !extraIngredientInput && {
                        color: "#888",
                        fontWeight: "500",
                      },
                    ]}
                  >
                    {selectedIngredientLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={22} color="#111" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addIngredientBtn}
                  onPress={handleAddExtraIngredient}
                >
                  <Text style={styles.addIngredientBtnText}>เพิ่มส่วนผสม</Text>
                </TouchableOpacity>

                <Text style={styles.limitText}>
                  เพิ่มได้อีก {MAX_EXTRA_INGREDIENTS - extraIngredients.length} รายการ
                </Text>
              </View>
            </View>
          )}

          <View style={styles.mealSection}>
            <Text style={styles.mealTitle}>มื้ออาหารที่</Text>
            <TouchableOpacity
              style={styles.mealSelect}
              onPress={() => setShowMealModal(true)}
              disabled={loadingMeals || loadingUser}
            >
              <Text style={styles.mealSelectText}>
                {loadingMeals || loadingUser
                  ? "กำลังโหลดมื้ออาหาร..."
                  : selectedMeal}
              </Text>
              <Ionicons name="chevron-down" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SelectionModal
        visible={showPortionModal}
        title="เลือกปริมาณมาตรฐาน"
        options={[
          {
            label: buildPortionLabel(0.5, food.portion.unit, food.portion.gram),
            value: "0.5",
          },
          {
            label: buildPortionLabel(1, food.portion.unit, food.portion.gram),
            value: "1",
          },
          {
            label: buildPortionLabel(1.5, food.portion.unit, food.portion.gram),
            value: "1.5",
          },
          {
            label: buildPortionLabel(2, food.portion.unit, food.portion.gram),
            value: "2",
          },
        ]}
        onClose={() => setShowPortionModal(false)}
        onSelect={(value) => {
          setPortionMultiplier(Number(value));
          setCustomGram("");
          setShowPortionModal(false);
        }}
      />

      <SelectionModal
        visible={showMealModal}
        title="เลือกมื้ออาหาร"
        options={mealOptions.map((meal) => ({
          label: meal,
          value: meal,
        }))}
        onClose={() => setShowMealModal(false)}
        onSelect={(value) => {
          setSelectedMeal(value);
          setShowMealModal(false);
        }}
      />

      <Modal visible={showIngredientModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowIngredientModal(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>เลือกส่วนผสม</Text>

            <View style={styles.ingredientTabWrap}>
              <TouchableOpacity
                style={[
                  styles.ingredientTabBtn,
                  ingredientTab === "veg_group" && styles.ingredientTabBtnActive,
                ]}
                onPress={() => setIngredientTab("veg_group")}
              >
                <Text
                  style={[
                    styles.ingredientTabText,
                    ingredientTab === "veg_group" && styles.ingredientTabTextActive,
                  ]}
                >
                  {`ผักและผลไม้\n(${vegCount})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ingredientTabBtn,
                  ingredientTab === "seasoning_group" &&
                    styles.ingredientTabBtnActive,
                ]}
                onPress={() => setIngredientTab("seasoning_group")}
              >
                <Text
                  style={[
                    styles.ingredientTabText,
                    ingredientTab === "seasoning_group" &&
                      styles.ingredientTabTextActive,
                  ]}
                >
                  {`เครื่องปรุง/ส่วนผสม\n(${seasoningCount})`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ingredientTabBtn,
                  ingredientTab === "protein_group" &&
                    styles.ingredientTabBtnActive,
                ]}
                onPress={() => setIngredientTab("protein_group")}
              >
                <Text
                  style={[
                    styles.ingredientTabText,
                    ingredientTab === "protein_group" &&
                      styles.ingredientTabTextActive,
                  ]}
                >
                  {`เนื้อสัตว์และโปรตีน\n(${proteinCount})`}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subCategoryRow}
            >
              {subCategoryOptions.map((sub) => (
                <TouchableOpacity
                  key={sub.value}
                  style={[
                    styles.subCategoryChip,
                    selectedSubCategory === sub.value &&
                      styles.subCategoryChipActive,
                  ]}
                  onPress={() => setSelectedSubCategory(sub.value)}
                >
                  <Text
                    style={[
                      styles.subCategoryChipText,
                      selectedSubCategory === sub.value &&
                        styles.subCategoryChipTextActive,
                    ]}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingIngredients ? (
              <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={ORANGE} />
                <Text style={{ marginTop: 8 }}>กำลังโหลดส่วนผสม...</Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
              >
                {filteredIngredientOptions.map((item) => (
                  <TouchableOpacity
                    key={item.ingredient_id}
                    style={styles.optionRow}
                    onPress={() => {
                      setExtraIngredientInput(item.name);
                      setShowIngredientModal(false);
                    }}
                  >
                    <View>
                      <Text style={styles.optionText}>{item.name}</Text>
                      <Text style={styles.optionSubText}>
                        {item.sub_category_label || "หมวดย่อย"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#555" />
                  </TouchableOpacity>
                ))}

                {!filteredIngredientOptions.length && (
                  <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <Text style={{ color: "#777" }}>
                      ไม่พบส่วนผสมในหมวดนี้
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowIngredientModal(false)}
            >
              <Text style={styles.closeBtnText}>ปิด</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>แก้ไขชื่อเมนู</Text>

            <Text style={styles.modalLabel}>ชื่อที่ AI พบ</Text>
            <Text style={styles.modalInfoText}>{aiDishName || "-"}</Text>

            <Text style={styles.modalLabel}>ชื่อที่แสดงในหน้า</Text>
            <TextInput
              value={customDishName}
              onChangeText={setCustomDishName}
              style={styles.modalInput}
              placeholder="กรอกชื่อเมนู"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setCustomDishName(aiDishName || food.dishName)}
              >
                <Text style={styles.secondaryBtnText}>ใช้ชื่อ AI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setCustomDishName(food.dishName)}
              >
                <Text style={styles.secondaryBtnText}>ใช้ชื่อฐานข้อมูล</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.secondaryBtnText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                onPress={handleEditSave}
              >
                <Text style={styles.primaryBtnText}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowDeleteConfirmModal(false)}
        >
          <Pressable
            style={styles.deleteModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={30} color="#fff" />
            </View>

            <Text style={styles.deleteModalTitle}>ล้างข้อมูลรายการ</Text>
            <Text style={styles.deleteModalMessage}>
              ต้องการล้างข้อมูลรายการนี้หรือไม่
            </Text>

            <View style={styles.deleteModalButtonRow}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.deleteCancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={resetAndGoBack}
              >
                <Text style={styles.deleteConfirmButtonText}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function SelectionModal({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.modalCard}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
          >
            {options.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.optionRow}
                onPress={() => onSelect(item.value)}
              >
                <Text style={styles.optionText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>ปิด</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MacroRow({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const ratio = target > 0 ? Math.min(value / target, 1) : 0;

  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.macroHeaderRow}>
        <Text style={styles.simpleLabel}>{label}</Text>
        <Text style={styles.simpleValueInline}>
          {value} / {target} {unit}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function SimpleMetricRow({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  return (
    <View style={styles.simpleMetricRow}>
      <Text style={styles.simpleLabel}>{label}</Text>
      <Text style={styles.simpleValueInline}>
        {value} / {target} {unit}
      </Text>
    </View>
  );
}

const CORNER_SIZE = 26;
const CORNER_THICKNESS = 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: WHITE,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
  },

  previewWrap: {
    alignItems: "center",
    marginTop: 16,
  },
  frameWrap: {
    width: "92%",
    aspectRatio: 1.15,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  foodImg: {
    width: "94%",
    height: "86%",
    borderRadius: 24,
    resizeMode: "cover",
  },

  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: BORDER,
    borderBottomRightRadius: 12,
  },

  mainCard: {
    backgroundColor: BG,
    marginTop: 6,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111",
    flex: 1,
    marginRight: 10,
  },
  iconRow: {
    flexDirection: "row",
    gap: 16,
  },

  tabWrap: {
    marginTop: 12,
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#222",
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    backgroundColor: WHITE,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: ORANGE,
  },
  tabText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  tabTextActive: {
    color: "#fff",
  },

  orangeBox: {
    marginTop: 16,
    backgroundColor: ORANGE,
    borderRadius: 12,
    padding: 12,
  },
  orangeTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  inputBox: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 8,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputUnit: {
    fontSize: 16,
    color: "#555",
    fontWeight: "700",
  },
  subText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
  },
  selectBox: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 8,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: 16,
    color: "#444",
    fontWeight: "600",
  },

  infoCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  kcalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kcalTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },
  mainValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  helperText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  macroHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barBg: {
    marginTop: 8,
    width: "100%",
    height: 12,
    backgroundColor: "#ECECEC",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: 12,
    borderRadius: 999,
  },

  simpleMetricRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  simpleLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  simpleValueInline: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  sectionUnitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  ingRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  ingName: {
    fontSize: 16,
    color: "#111",
  },
  ingCategory: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  ingVal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  extraEditorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    height: 40,
  },
  qtyInput: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    paddingVertical: 0,
  },
  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  qtyUnit: {
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
    marginLeft: 4,
  },

  mealSection: {
    marginTop: 26,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    marginBottom: 10,
  },
  mealSelect: {
    borderWidth: 1.4,
    borderColor: "#222",
    borderRadius: 8,
    height: 56,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealSelectText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },

  saveBtn: {
    marginTop: 22,
    backgroundColor: "#FFB400",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 18,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  addIngredientBtn: {
    marginTop: 12,
    backgroundColor: ORANGE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  addIngredientBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  limitText: {
    marginTop: 8,
    color: "#666",
    fontSize: 13,
  },

  ingredientTabWrap: {
    flexDirection: "row",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    overflow: "hidden",
  },
  ingredientTabBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
  },
  ingredientTabBtnActive: {
    backgroundColor: ORANGE,
  },
  ingredientTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  ingredientTabTextActive: {
    color: "#fff",
  },

  subCategoryRow: {
    gap: 8,
    paddingBottom: 10,
    paddingRight: 4,
  },
  subCategoryChip: {
    backgroundColor: "#F3F3F3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subCategoryChipActive: {
    backgroundColor: ORANGE,
  },
  subCategoryChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
  },
  subCategoryChipTextActive: {
    color: "#fff",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
    marginTop: 10,
    marginBottom: 6,
  },
  modalInfoText: {
    fontSize: 16,
    color: "#111",
    fontWeight: "700",
  },
  modalInput: {
    borderWidth: 1.2,
    borderColor: "#CCC",
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    borderWidth: 1.2,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  optionRow: {
    minHeight: 52,
    borderBottomWidth: 0.8,
    borderBottomColor: "#EEE",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 16,
    color: "#111",
    fontWeight: "600",
  },
  optionSubText: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: "#F3F3F3",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  deleteModalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  deleteIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F04E30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  deleteModalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },

  deleteModalMessage: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 22,
  },

  deleteModalButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  deleteCancelButton: {
    flex: 1,
    borderWidth: 1.4,
    borderColor: "#D9D9D9",
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteCancelButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },

  deleteConfirmButton: {
    flex: 1,
    backgroundColor: "#F04E30",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
});