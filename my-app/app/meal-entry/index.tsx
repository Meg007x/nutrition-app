import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const ORANGE = "#F28A1A";
const BG = "#F4F4F4";
const WHITE = "#FFFFFF";

type ScanSessionItem = {
  _id: string;
  user_id: string;
  date: string;
  meal_type: string;
  food_id?: string;
  food_name: string;
  food_name_en?: string;
  source?: string;
  image_uri?: string | null;
  selected_portion?: {
    mode?: string;
    multiplier?: number;
    gram?: number;
    unit?: string;
    base_gram?: number;
    display_text?: string;
  };
  nutrition?: {
    kcal?: number;
    protein_g?: number;
    carb_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sodium_mg?: number;
  };
};

function getApiBase() {
  return "http://172.16.8.225:3000";
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildPortionText(item: ScanSessionItem) {
  const portion = item.selected_portion;
  if (!portion) return "-";

  if (portion.display_text) return portion.display_text;

  const gram = Number(portion.gram || 0);
  const unit = String(portion.unit || "g");
  const multiplier = Number(portion.multiplier || 1);

  if (unit === "plate") return `${multiplier} จาน (${gram} กรัม)`;
  if (unit === "bowl") return `${multiplier} ชาม (${gram} กรัม)`;
  if (unit === "cup") return `${multiplier} ถ้วย (${gram} กรัม)`;
  if (unit === "piece") return `${multiplier} ชิ้น (${gram} กรัม)`;

  return `${gram} ${unit}`;
}

export default function MealEntryScreen() {
  const { date, mealType } = useLocalSearchParams<{
    date?: string;
    mealType?: string;
  }>();

  const [items, setItems] = useState<ScanSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMeal, setSavingMeal] = useState(false);

  const selectedDate = useMemo(() => {
    return date ? String(date) : getTodayString();
  }, [date]);

  const selectedMealType = useMemo(() => {
    return mealType ? String(mealType) : "กลางวัน";
  }, [mealType]);

  const resolveUserId = async () => {
    const possibleKeys = ["loggedInUser", "currentUser", "user", "authUser", "userData"];

    for (const key of possibleKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        const uid = parsed?.user?.user_id || parsed?.user_id || parsed?.id || "";
        if (uid) return String(uid);
      } catch (_) {}
    }

    return "";
  };

  const fetchItems = async () => {
    try {
      setLoading(true);

      const userId = await resolveUserId();
      if (!userId) {
        setItems([]);
        return;
      }

      const response = await fetch(
        `${getApiBase()}/api/scan-sessions?user_id=${encodeURIComponent(
          userId
        )}&date=${encodeURIComponent(selectedDate)}&meal_type=${encodeURIComponent(
          selectedMealType
        )}`
      );

      const res = await response.json();

      if (response.ok && res.success) {
        setItems(Array.isArray(res.data) ? res.data : []);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("fetchItems error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [selectedDate, selectedMealType])
  );

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.kcal += Number(item.nutrition?.kcal || 0);
        acc.protein_g += Number(item.nutrition?.protein_g || 0);
        acc.carb_g += Number(item.nutrition?.carb_g || 0);
        acc.fat_g += Number(item.nutrition?.fat_g || 0);
        return acc;
      },
      {
        kcal: 0,
        protein_g: 0,
        carb_g: 0,
        fat_g: 0,
      }
    );
  }, [items]);

  const handleAddFood = () => {
    router.push({
      pathname: "/food-scan",
      params: {
        date: selectedDate,
        mealType: selectedMealType,
        returnTo: "meal-entry",
      },
    });
  };

  const handleSaveMeal = async () => {
    try {
      setSavingMeal(true);

      const userId = await resolveUserId();
      if (!userId) {
        Alert.alert("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      if (!items.length) {
        Alert.alert("ยังไม่มีรายการอาหาร", "กรุณาเพิ่มรายการอาหารก่อน");
        return;
      }

      const response = await fetch(`${getApiBase()}/api/meal-logs/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          date: selectedDate,
          meal_type: selectedMealType,
        }),
      });

      const res = await response.json();

      if (!response.ok || !res.success) {
        throw new Error(res.error || "ไม่สามารถบันทึกมื้ออาหารได้");
      }

      Alert.alert("บันทึกสำเร็จ", "ระบบได้บันทึกมื้อนี้เรียบร้อยแล้ว");
      router.back();
    } catch (error: any) {
      Alert.alert(
        "เกิดข้อผิดพลาด",
        error.message || "ไม่สามารถบันทึกมื้ออาหารได้"
      );
    } finally {
      setSavingMeal(false);
    }
  };

  const renderItem = ({ item }: { item: ScanSessionItem }) => {
    return (
      <View style={styles.itemCard}>
        <Image
          source={{
            uri: item.image_uri || "https://via.placeholder.com/120",
          }}
          style={styles.itemImage}
        />

        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.food_name}</Text>
          <Text style={styles.itemPortion}>{buildPortionText(item)}</Text>
        </View>

        <Text style={styles.itemKcal}>{Number(item.nutrition?.kcal || 0)} kcal</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={30} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>บันทึกอาหาร 1 มื้อ</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryMeal}>มื้อ{selectedMealType}</Text>
        <Text style={styles.summaryDate}>{selectedDate}</Text>
        <Text style={styles.summaryKcal}>พลังงานรวม {totals.kcal} kcal</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addButtonText}>เพิ่มรายการอาหาร</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>รายการอาหารในมื้อนี้</Text>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>ยังไม่มีรายการอาหารในมื้อนี้</Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, savingMeal && { opacity: 0.6 }]}
          onPress={handleSaveMeal}
          disabled={savingMeal}
        >
          <Text style={styles.saveButtonText}>
            {savingMeal ? "กำลังบันทึก..." : "บันทึกมื้อนี้"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
  },
  summaryMeal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111",
  },
  summaryDate: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  summaryKcal: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  addButton: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  emptyBox: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  itemCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#EEE",
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  itemPortion: {
    marginTop: 5,
    fontSize: 13,
    color: "#666",
  },
  itemKcal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginLeft: 8,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: BG,
  },
  saveButton: {
    backgroundColor: "#FFB400",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 18,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
});