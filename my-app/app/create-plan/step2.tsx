import React, {
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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../../constants/config";

const ORANGE = "#DF9226";

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
  is_swapped?: boolean;
};

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
  const image = food.image || food.image_url || null;
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
  // User profile targets (Single Source of Truth)
  const [userTargets, setUserTargets] = useState<{ kcal: number; protein_g: number; carb_g: number; fat_g: number }>({ kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 });

  // Swap Modal State
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selSlot, setSelSlot] = useState<{ date: string; idx: number; name: string } | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [safeFoods, setSafeFoods] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail Modal State
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);

  const selectedDate = dateTabs[selectedDay];
  const selectedPlan = plans.find((p) => p.date === selectedDate);

  // ─── Initialization ───
  useEffect(() => {
    loadUserId().then(() => loadPlans());
  }, [planId]);

  async function loadUserId() {
    try {
      const raw = await AsyncStorage.getItem("currentUser");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.user_id) {
          setUserId(String(obj.user_id));
          // Load user profile targets (Single Source of Truth)
          const hg = obj?.health_goals;
          if (hg?.target_calories > 0) {
            setUserTargets({
              kcal: Number(hg.target_calories) || 0,
              protein_g: Number(hg.protein_target_g) || 0,
              carb_g: Number(hg.target_carb_g) || 0,
              fat_g: Number(hg.target_fat_g) || 0,
            });
          } else {
            // Fetch from API if not in local storage
            try {
              const resp = await fetch(`${BASE_URL}/api/users/profile?userId=${obj.user_id}`);
              const profileJson = await resp.json();
              if (profileJson?.success && profileJson?.data?.health_goals) {
                const p = profileJson.data.health_goals;
                setUserTargets({
                  kcal: Number(p.target_calories) || Number(p.tdee_target_kcal) || 0,
                  protein_g: Number(p.protein_target_g) || 0,
                  carb_g: Number(p.target_carb_g) || 0,
                  fat_g: Number(p.target_fat_g) || 0,
                });
              }
            } catch (e) {
              console.log("loadUserTargets API error:", e);
            }
          }
        }
      }
    } catch (e) {
      console.log("loadUserId error:", e);
    }
  }

  async function loadPlans() {
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
  }

  // ─── Safe Swap Foods (Strict Allergen Filtering Backend Call) ───
  async function loadSafeFoods(query: string = "") {
    if (!userId) return;
    setSearching(true);
    try {
      // Backend api/meal/safe-foods MUST enforce allergen logic using user_id
      const url = `${BASE_URL}/api/meal/safe-foods?user_id=${encodeURIComponent(userId)}&q=${encodeURIComponent(query)}&limit=30`;
      const response = await axios.get(url, { timeout: 15000 });
      if (response.data?.success) {
        setSafeFoods(response.data.foods || []);
      } else {
        setSafeFoods([]);
      }
    } catch (e) {
      console.error("loadSafeFoods error:", e);
      setSafeFoods([]);
    } finally {
      setSearching(false);
    }
  }

  function onSearchChange(text: string) {
    setSearchQ(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      loadSafeFoods(text.trim());
    }, 400);
  }

  function openSwapModal(date: string, idx: number, name: string) {
    setSelSlot({ date, idx, name });
    setSearchQ("");
    setShowSwapModal(true);
    loadSafeFoods(""); // Load default safe foods
  }

  async function handleSwapConfirm(newFood: any) {
    if (!selSlot || !selectedPlan) return;
    try {
      await axios.put(
        `${BASE_URL}/api/meal/plans/${planId}/meal`,
        { slot_idx: selSlot.idx, new_food_id: newFood._id },
        { timeout: 15000 }
      );
      await loadPlans(); // Reload to get dynamic macros updated
      setShowSwapModal(false);
      setShowFoodDetail(false);
      setSelSlot(null);
      Alert.alert("สำเร็จ", "เปลี่ยนเมนูอาหารเรียบร้อยแล้ว");
    } catch (e: any) {
      Alert.alert("เปลี่ยนเมนูไม่สำเร็จ", e?.message || "เกิดข้อผิดพลาด");
    }
  }

  function handleSave() {
    if (saving || !planId) return;
    setSaving(true);
    // Replace to Main Plan Tab
    router.replace({ pathname: "/(tabs)/plan", params: { refresh: Date.now().toString(), plan_id: planId } });
  }

  // ─── Calculate Progress ───
  // Use plan's daily_target_summary if available, otherwise use user profile targets (SSOT)
  const targetKcal = selectedPlan?.daily_target_summary?.kcal ?? userTargets.kcal ?? 0;
  // Calculate planned Kcal from slots (since they are not eaten yet)
  const plannedKcal = selectedPlan?.slots.reduce((sum, slot) => sum + (slot.main_food ? getNutrition(slot.main_food).kcal : 0), 0) ?? 0;
  const plannedProtein = selectedPlan?.slots.reduce((sum, slot) => sum + (slot.main_food ? getNutrition(slot.main_food).protein : 0), 0) ?? 0;
  const plannedCarbs = selectedPlan?.slots.reduce((sum, slot) => sum + (slot.main_food ? getNutrition(slot.main_food).carbs : 0), 0) ?? 0;
  const plannedFat = selectedPlan?.slots.reduce((sum, slot) => sum + (slot.main_food ? getNutrition(slot.main_food).fat : 0), 0) ?? 0;

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
              จัดแล้ว {plannedKcal} / {targetKcal} kcal
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginTop: 16 }}>
            {[
              { label: "Protein", val: plannedProtein, target: selectedPlan?.daily_target_summary?.protein_g ?? userTargets.protein_g ?? 0, color: "#3B82F6" },
              { label: "Carbs", val: plannedCarbs, target: selectedPlan?.daily_target_summary?.carb_g ?? userTargets.carb_g ?? 0, color: "#F59E0B" },
              { label: "Fat", val: plannedFat, target: selectedPlan?.daily_target_summary?.fat_g ?? userTargets.fat_g ?? 0, color: "#EF4444" },
            ].map((macro) => (
              <View key={macro.label} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: "#999", fontWeight: "500" }}>{macro.label}</Text>
                <Text style={{ fontSize: 17, fontWeight: "bold", color: macro.color, marginTop: 4 }}>
                  {macro.val} <Text style={{ fontSize: 12, color: "#999" }}>/ {macro.target}g</Text>
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

            return (
              <View key={idx} style={st.mealCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name={mealIcon(slot.meal_type) as any} size={22} color="#444" />
                  
                  {/* Food Info Area */}
                  {hasFood ? (
                    <TouchableOpacity
                      onPress={() => { setSelectedFood(food); setShowFoodDetail(true); }}
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

                {/* Macro Pills & Action Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  {hasFood ? (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <View style={st.macroPill}><Text style={st.macroPillText}>P {getNutrition(food).protein}g</Text></View>
                      <View style={st.macroPill}><Text style={st.macroPillText}>C {getNutrition(food).carbs}g</Text></View>
                      <View style={st.macroPill}><Text style={st.macroPillText}>F {getNutrition(food).fat}g</Text></View>
                    </View>
                  ) : <View />}

                  <TouchableOpacity
                    style={st.actionBtn}
                    onPress={() => openSwapModal(selectedPlan.date, idx, slot.slot_name)}
                  >
                    <Ionicons name="search-outline" size={16} color={ORANGE} />
                    <Text style={{ fontSize: 13, color: ORANGE, fontWeight: "bold" }}>{hasFood ? "เปลี่ยนเมนู" : "ค้นหาเมนูเอง"}</Text>
                  </TouchableOpacity>
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
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>เปลี่ยน {selSlot?.name}</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={st.searchBar}>
            <Ionicons name="search-outline" size={20} color="#999" />
            <TextInput
              style={{ flex: 1, fontSize: 15, color: "#333", marginLeft: 8 }}
              placeholder="ค้นหาเมนูอาหารปลอดภัย..."
              value={searchQ}
              onChangeText={onSearchChange}
              autoFocus
            />
            {searchQ.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange("")}><Ionicons name="close-circle" size={20} color="#ccc" /></TouchableOpacity>
            )}
          </View>

          {searching && <ActivityIndicator size="small" color={ORANGE} style={{ marginTop: 20 }} />}

          <FlatList
            data={safeFoods}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              !searching ? (
                <View style={st.emptyContainer}>
                  <Ionicons name="shield-checkmark-outline" size={50} color="#ccc" />
                  <Text style={[st.emptyText, { marginTop: 12 }]}>ไม่พบเมนูที่ตรงเงื่อนไข</Text>
                  <Text style={{ color: "#999", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                    ระบบกรองเฉพาะเมนูที่ปลอดภัยต่ออาการแพ้ของคุณเท่านั้น
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const nutrition = getNutrition(item);
              return (
                <TouchableOpacity style={st.foodListItem} onPress={() => { setSelectedFood(item); setShowFoodDetail(true); }}>
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

      {/* =====================================================
          FOOD DETAIL MODAL (Exact from plan.tsx)
      ===================================================== */}
      <Modal visible={showFoodDetail} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFoodDetail(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={st.modalHeader}>
            <TouchableOpacity onPress={() => setShowFoodDetail(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>รายละเอียดเมนู</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {selectedFood && (
              <>
                <View style={{ width: "100%", alignItems: "center", marginBottom: 20 }}>
                  <FoodImage food={selectedFood} size={220} />
                </View>
                <Text style={{ fontSize: 24, fontWeight: "bold", color: "#222" }}>{getFoodName(selectedFood)}</Text>
                
                <Text style={st.sectionTitle}>สารอาหารหลัก</Text>
                <View style={st.nutritionGrid}>
                  <View style={st.nutritionBox}>
                    <Text style={st.nutritionLabel}>พลังงาน</Text>
                    <Text style={[st.nutritionValue, { color: ORANGE }]}>{getNutrition(selectedFood).kcal}</Text>
                    <Text style={st.nutritionUnit}>kcal</Text>
                  </View>
                  <View style={st.nutritionBox}>
                    <Text style={st.nutritionLabel}>โปรตีน</Text>
                    <Text style={[st.nutritionValue, { color: "#3B82F6" }]}>{getNutrition(selectedFood).protein}</Text>
                    <Text style={st.nutritionUnit}>g</Text>
                  </View>
                  <View style={st.nutritionBox}>
                    <Text style={st.nutritionLabel}>คาร์บ</Text>
                    <Text style={[st.nutritionValue, { color: "#F59E0B" }]}>{getNutrition(selectedFood).carbs}</Text>
                    <Text style={st.nutritionUnit}>g</Text>
                  </View>
                  <View style={st.nutritionBox}>
                    <Text style={st.nutritionLabel}>ไขมัน</Text>
                    <Text style={[st.nutritionValue, { color: "#EF4444" }]}>{getNutrition(selectedFood).fat}</Text>
                    <Text style={st.nutritionUnit}>g</Text>
                  </View>
                </View>

                <TouchableOpacity style={st.replaceDetailBtn} onPress={() => handleSwapConfirm(selectedFood)}>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 }}>เลือกเมนูนี้</Text>
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