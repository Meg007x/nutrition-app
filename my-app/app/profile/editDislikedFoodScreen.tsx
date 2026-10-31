import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import styles, { ORANGE } from "../register/step7.styles";
import { BASE_URL, API_BASE_URL } from "../../constants/config";
import { isOtherIngredientCategory } from "../register/ingredientCategoryUtils";

type FoodItem = { id: string; name: string };
type SubCategory = { id: string; name: string; items: FoodItem[] };
type FoodCategory = {
  id: string;
  name: string;
  emoji?: string;
  subCategories: SubCategory[];
};

const CATEGORY_EMOJI: Record<string, string> = {
  "ผักและผลไม้": "🥬",
  "เนื้อสัตว์และโปรตีน": "🥩",
  "เครื่องปรุง/ส่วนผสม": "🧂",
};

export default function EditDislikedFoodScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedL1, setExpandedL1] = useState<Set<string>>(new Set());
  const [expandedL2, setExpandedL2] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    void loadScreenData();
  }, []);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  };

  async function loadScreenData() {
    try {
      try {
        const hierarchyResponse = await fetch(`${API_BASE_URL}/food/ingredients/hierarchy`);
        const hierarchyResult = await hierarchyResponse.json();
        if (hierarchyResponse.ok && Array.isArray(hierarchyResult?.data)) {
          setCategories(hierarchyResult.data.filter((category: FoodCategory) => !isOtherIngredientCategory(category)));
        }
      } catch (error) {
        console.error("Load ingredient hierarchy error:", error);
      }

      const userJson = await AsyncStorage.getItem("currentUser");
      if (!userJson) return;
      const user = JSON.parse(userJson);
      const userId = String(user?.user_id || "").trim();
      if (!userId) return;
      setCurrentUserId(userId);

      const response = await fetch(`${BASE_URL}/api/users/dislikes?userId=${encodeURIComponent(userId)}`);
      const result = await response.json();
      if (!response.ok || !result?.success) return;

      const v2 = result.disliked_ingredients_v2;
      if (Array.isArray(v2) && v2.length > 0) {
        setSelectedFoods(new Set(v2.map((item: any) => String(item?.name || "").trim()).filter(Boolean)));
        return;
      }

      const legacy = result.data || {};
      const names = Object.values(legacy).flatMap((items: any) =>
        Array.isArray(items) ? items.map((item: any) => String(item)) : []
      );
      setSelectedFoods(new Set(names.filter(Boolean)));
    } catch (error) {
      console.error("Load disliked foods error:", error);
      setToast({ message: "โหลดข้อมูลอาหารที่ไม่ชอบไม่สำเร็จ", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  const toggleFood = (name: string) => {
    setSelectedFoods((previous) => {
      const next = new Set(previous);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const removeSelected = (name: string) => {
    setSelectedFoods((previous) => {
      const next = new Set(previous);
      next.delete(name);
      return next;
    });
  };

  const toggleL1 = (id: string) => {
    setExpandedL1((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleL2 = (key: string) => {
    setExpandedL2((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getCategoryFoodNames = (category: FoodCategory) =>
    [...new Set(category.subCategories.flatMap((sub) => sub.items.map((item) => item.name)))];

  const setCategorySelection = (category: FoodCategory, selected: boolean) => {
    const names = getCategoryFoodNames(category);
    setSelectedFoods((previous) => {
      const next = new Set(previous);
      names.forEach((name) => selected ? next.add(name) : next.delete(name));
      return next;
    });
  };

  const l1Count = (category: FoodCategory) =>
    getCategoryFoodNames(category).filter((name) => selectedFoods.has(name)).length;
  const l2Count = (subCategory: SubCategory) =>
    subCategory.items.filter((item) => selectedFoods.has(item.name)).length;

  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const isThaiSearch = /[\u0E00-\u0E7F]/.test(normalizedSearchQuery);
  const matchingFoods = useMemo(() => {
    if (!normalizedSearchQuery) return [];
    const foods = categories.flatMap((category) =>
      category.subCategories.flatMap((subCategory) => subCategory.items)
    );
    return Array.from(new Map<string, FoodItem>(
      foods
        .filter((food) => isThaiSearch
          ? food.name.trim().toLocaleLowerCase().startsWith(normalizedSearchQuery)
          : food.name.toLocaleLowerCase().includes(normalizedSearchQuery))
        .map((food) => [food.name, food] as const)
    ).values());
  }, [categories, isThaiSearch, normalizedSearchQuery]);

  const showNotification = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  };

  const handleSave = async () => {
    if (!currentUserId) {
      showNotification("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่", "error");
      return;
    }

    setSaving(true);
    try {
      const selectedArray = Array.from(selectedFoods).filter(Boolean);
      const itemDetails = new Map<string, { ingredient_id: string; category_key: string; category_name: string; sub_category: string }>();
      const disliked_foods: Record<string, string[]> = {};

      categories.forEach((category) => {
        category.subCategories.forEach((subCategory) => {
          subCategory.items.forEach((item) => {
            if (!selectedFoods.has(item.name)) return;
            if (!disliked_foods[category.id]) disliked_foods[category.id] = [];
            if (!disliked_foods[category.id].includes(item.name)) disliked_foods[category.id].push(item.name);
            itemDetails.set(item.name, {
              ingredient_id: item.id,
              category_key: category.id,
              category_name: category.name,
              sub_category: subCategory.id,
            });
          });
        });
      });

      const disliked_ingredients_v2 = selectedArray.map((name) => ({
        ingredient_id: itemDetails.get(name)?.ingredient_id || null,
        name,
        category_key: itemDetails.get(name)?.category_key || "",
        category_name: itemDetails.get(name)?.category_name || "",
        sub_category: itemDetails.get(name)?.sub_category || "",
      }));

      const response = await fetch(`${BASE_URL}/api/users/dislikes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, disliked_ingredients_v2, disliked_foods }),
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "บันทึกไม่สำเร็จ");
      }

      const clearedSlots = Number(result.cleared_slots || 0);
      showNotification(clearedSlots > 0 ? `บันทึกสำเร็จ (ล้าง ${clearedSlots} มื้อที่มีวัตถุดิบที่ไม่ชอบ)` : "บันทึกสำเร็จ", "success");
      setTimeout(goBack, 1200);
    } catch (error: any) {
      showNotification(error?.message || "เกิดข้อผิดพลาดในการบันทึก", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ marginTop: 16, color: "#666", fontFamily: "NotoSansThaiBold" }}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  const selectedArray = Array.from(selectedFoods);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {toast && (
          <View style={{ position: "absolute", top: 12, alignSelf: "center", zIndex: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: toast.type === "success" ? "#22A06B" : "#D64545" }}>
            <Text style={{ color: "#fff", fontFamily: "NotoSansThaiBold" }}>{toast.message}</Text>
          </View>
        )}
        <View style={[styles.headerBar, { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 }]}>
          <TouchableOpacity onPress={goBack} style={{ padding: 10 }} accessibilityRole="button" accessibilityLabel="ย้อนกลับ">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>แก้ไขอาหารที่ไม่ชอบ</Text>
          <View style={{ width: 42 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepTitle}>อาหารที่ไม่ชอบ</Text>
          <Text style={styles.subtitle}>เลือกประเภทอาหารและวัตถุดิบที่คุณไม่ชอบรับประทาน</Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาอาหาร..."
              placeholderTextColor="#AAA"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!searchQuery && <TouchableOpacity onPress={() => setSearchQuery("")}><Ionicons name="close-circle" size={18} color="#999" /></TouchableOpacity>}
          </View>

          {normalizedSearchQuery ? (
            matchingFoods.length > 0 ? (
              <View style={styles.searchResults}>
                {matchingFoods.map((food) => {
                  const selected = selectedFoods.has(food.name);
                  return (
                    <TouchableOpacity key={food.id} style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleFood(food.name)} activeOpacity={0.7} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={food.name}>
                      <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>{food.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : <Text style={styles.emptyText}>ไม่พบอาหารที่ค้นหา</Text>
          ) : (
            <View style={styles.categoriesWrap}>
              {categories.map((category) => {
                const expanded = expandedL1.has(category.id);
                const selectedCount = l1Count(category);
                const total = getCategoryFoodNames(category).length;
                return (
                  <View key={category.id} style={[styles.categoryCard, expanded && styles.categoryCardExpanded]}>
                    <View style={styles.categoryRow}>
                      <TouchableOpacity style={styles.categoryExpandButton} onPress={() => toggleL1(category.id)} activeOpacity={0.75}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[category.name] || category.emoji || "📦"}</Text>
                          <Text style={styles.categoryText}>{category.name}</Text>
                          {selectedCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{selectedCount}/{total}</Text></View>}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.categorySelectAll}>
                        <Switch value={total > 0 && selectedCount === total} onValueChange={(value) => setCategorySelection(category, value)} trackColor={{ false: "#E1E5E9", true: "#73C98B" }} thumbColor="#FFFFFF" accessibilityRole="switch" accessibilityLabel={`เลือกวัตถุดิบทั้งหมดในหมวด ${category.name}`} />
                      </View>
                      <TouchableOpacity style={styles.categoryChevronButton} onPress={() => toggleL1(category.id)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${category.name}, ${expanded ? "ย่อ" : "ขยาย"}หมวดหมู่`}>
                        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#777" />
                      </TouchableOpacity>
                    </View>

                    {expanded && (
                      <View style={styles.subListWrapOuter}>
                        {category.subCategories.map((subCategory) => {
                          const key = `${category.id}__${subCategory.id}`;
                          const subExpanded = expandedL2.has(key);
                          const subCount = l2Count(subCategory);
                          return (
                            <View key={subCategory.id} style={styles.subCategoryCard}>
                              <TouchableOpacity style={styles.subCategoryHeader} onPress={() => toggleL2(key)} activeOpacity={0.7}>
                                <Text style={styles.subCategoryTitle}>{subCategory.name}</Text>
                                <View style={styles.subCategoryHeaderRight}>
                                  {subCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{subCount}</Text></View>}
                                  <Ionicons name={subExpanded ? "chevron-up" : "chevron-down"} size={16} color="#999" />
                                </View>
                              </TouchableOpacity>
                              {subExpanded && (
                                <View style={styles.chipContainer}>
                                  {subCategory.items.map((food) => {
                                    const selected = selectedFoods.has(food.name);
                                    return (
                                      <TouchableOpacity key={food.id} style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleFood(food.name)} activeOpacity={0.7} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={food.name}>
                                        <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>{food.name}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>สรุปรายการที่ไม่ชอบ ({selectedArray.length})</Text>
            {selectedArray.length > 0 ? (
              <View style={styles.summaryChipWrap}>
                {selectedArray.map((item) => (
                  <View key={item} style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeSelected(item)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`ลบ ${item}`}>
                      <Text style={styles.summaryChipRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : <Text style={styles.summaryText}>ยังไม่มีรายการที่เลือก</Text>}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}><Text style={styles.backText}>ย้อนกลับ</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.nextButton, saving && { opacity: 0.65 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>บันทึก</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
