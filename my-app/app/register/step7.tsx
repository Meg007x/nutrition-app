import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE } from "./step7.styles";
import { API_BASE_URL } from "../../constants/config";
import { isOtherIngredientCategory } from "./ingredientCategoryUtils";

type FoodItem = { id: string; name: string };
type SubCategory = { id: string; name: string; items: FoodItem[] };
type L1Category = {
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

export default function RegisterStep7Screen() {
  const { form, updateForm } = useRegister();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<L1Category[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedL1, setExpandedL1] = useState<Set<string>>(new Set());
  const [expandedL2, setExpandedL2] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDislikedFoods = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/food/ingredients/hierarchy`);
        const result = await response.json();
        if (Array.isArray(result?.data)) {
          const visibleCategories = result.data.filter(
            (category: L1Category) => !isOtherIngredientCategory(category)
          );
          setCategories(visibleCategories);
          const safe: any = form.dislikedFoods || {};
          const restored = new Set<string>();
          if (!Array.isArray(safe)) {
            Object.keys(safe).forEach((k) => { (safe[k] || []).forEach((item: string) => restored.add(item)); });
          }
          setSelectedFoods(restored);
        }
      } catch (e) { console.error("Fetch Error:", e); } finally { setIsLoading(false); }
    };
    fetchDislikedFoods();
  }, [form.dislikedFoods]);

  const toggleFood = (name: string) => {
    const next = new Set(selectedFoods);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setSelectedFoods(next);
  };

  const removeSelected = (name: string) => {
    const next = new Set(selectedFoods);
    next.delete(name);
    setSelectedFoods(next);
  };

  const toggleL1 = (id: string) => {
    setExpandedL1((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleL2 = (key: string) => {
    setExpandedL2((previous) => {
      const next = new Set(previous);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getCategoryFoodNames = (cat: L1Category) =>
    [...new Set(cat.subCategories.flatMap((sub) => sub.items.map((item) => item.name)))];
  const setCategorySelection = (cat: L1Category, selected: boolean) => {
    const names = getCategoryFoodNames(cat);
    setSelectedFoods((previous) => {
      const next = new Set(previous);
      names.forEach((name) => {
        if (selected) {
          next.add(name);
        } else {
          next.delete(name);
        }
      });
      return next;
    });
  };
  const l1Count = (cat: L1Category) =>
    getCategoryFoodNames(cat).filter((name) => selectedFoods.has(name)).length;
  const l2Count = (sub: SubCategory) => sub.items.filter((i) => selectedFoods.has(i.name)).length;
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const isThaiSearch = /[\u0E00-\u0E7F]/.test(normalizedSearchQuery);
  const matchingFoods = normalizedSearchQuery
    ? Array.from(
        new Map<string, FoodItem>(
          categories
            .flatMap((category) =>
              category.subCategories.flatMap((subCategory) => subCategory.items)
            )
            .filter((food) =>
              isThaiSearch
                ? food.name.trim().toLocaleLowerCase().startsWith(normalizedSearchQuery)
                : food.name.toLocaleLowerCase().includes(normalizedSearchQuery)
            )
            .map((food) => [food.name, food] as const)
        ).values()
      )
    : [];
  const selectedArray = Array.from(selectedFoods);
  const handleNext = () => { const data: Record<string, string[]> = {}; categories.forEach((cat) => cat.subCategories.forEach((sub) => sub.items.forEach((item) => { if (selectedFoods.has(item.name)) { if (!data[cat.id]) data[cat.id] = []; data[cat.id].push(item.name); } }))); updateForm({ dislikedFoods: data as any, interestedCuisines: [] }); router.push("/register/step9" as any); };

  if (isLoading) { return (<SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color={ORANGE} /><Text style={{ marginTop: 16, color: "#666", fontFamily: "NotoSansThaiBold" }}>กำลังโหลดข้อมูล...</Text></SafeAreaView>); }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerBar}><Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text></View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepTitle}>7. อาหารที่ไม่ชอบ</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: "87.5%" }]} /></View>
          <Text style={styles.subtitle}>เลือกประเภทอาหารที่คุณไม่ชอบรับประทาน</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#999" />
            <TextInput style={styles.searchInput} placeholder="ค้นหาอาหาร..." placeholderTextColor="#AAA" value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
            {searchQuery.length > 0 && (<TouchableOpacity onPress={() => setSearchQuery("")}><Ionicons name="close-circle" size={18} color="#999" /></TouchableOpacity>)}
          </View>
          {normalizedSearchQuery ? (
            matchingFoods.length > 0 ? (
              <View style={styles.searchResults}>
                {matchingFoods.map((food) => {
                  const isSelected = selectedFoods.has(food.name);
                  return (
                    <TouchableOpacity
                      key={food.id}
                      style={[
                        styles.chip,
                        isSelected
                          ? styles.chipSelected
                          : styles.chipUnselected,
                      ]}
                      onPress={() => toggleFood(food.name)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={food.name}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected
                            ? styles.chipTextSelected
                            : styles.chipTextUnselected,
                        ]}
                      >
                        {food.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>ไม่พบอาหารที่ค้นหา</Text>
            )
          ) : (
            <View style={styles.categoriesWrap}>
              {categories.map((cat) => {
                const isOpen = expandedL1.has(cat.id);
                const cnt = l1Count(cat);
                const total = getCategoryFoodNames(cat).length;
                return (
                  <View key={cat.id} style={[styles.categoryCard, isOpen && styles.categoryCardExpanded]}>
                    <View style={styles.categoryRow}>
                      <TouchableOpacity
                        style={styles.categoryExpandButton}
                        onPress={() => toggleL1(cat.id)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`${cat.name}, ${isOpen ? "ย่อ" : "ขยาย"}หมวดหมู่`}
                      >
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.categoryEmoji}>
                            {CATEGORY_EMOJI[cat.name] || cat.emoji || "📦"}
                          </Text>
                          <Text style={styles.categoryText}>{cat.name}</Text>
                          {cnt > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cnt}/{total}</Text></View>}
                        </View>
                      </TouchableOpacity>
                      <View style={styles.categorySelectAll}>
                        <Switch
                          value={total > 0 && cnt === total}
                          onValueChange={(value) => setCategorySelection(cat, value)}
                          trackColor={{ false: "#E1E5E9", true: "#73C98B" }}
                          thumbColor="#FFFFFF"
                          accessibilityRole="switch"
                          accessibilityLabel={`เลือกวัตถุดิบทั้งหมดในหมวด ${cat.name}`}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.categoryChevronButton}
                        onPress={() => toggleL1(cat.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${cat.name}, ${isOpen ? "ย่อ" : "ขยาย"}หมวดหมู่`}
                      >
                        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#777" />
                      </TouchableOpacity>
                    </View>

                    {isOpen && (<View style={styles.subListWrapOuter}>
                      {cat.subCategories.map((sub) => {
                        const l2Key = `${cat.id}__${sub.id}`;
                        const isL2 = expandedL2.has(l2Key);
                        const c2 = l2Count(sub);
                        return (
                          <View key={sub.id} style={styles.subCategoryCard}>
                            <TouchableOpacity
                              style={styles.subCategoryHeader}
                              onPress={() => toggleL2(l2Key)}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`${sub.name}, ${isL2 ? "ย่อ" : "ขยาย"}รายการวัตถุดิบ`}
                            >
                              <Text style={styles.subCategoryTitle}>{sub.name}</Text>
                              <View style={styles.subCategoryHeaderRight}>
                                {c2 > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{c2}</Text></View>}
                                <Ionicons name={isL2 ? "chevron-up" : "chevron-down"} size={16} color="#999" />
                              </View>
                            </TouchableOpacity>
                            {isL2 && (
                              <View style={styles.chipContainer}>
                                {sub.items.map((food) => {
                                  const sel = selectedFoods.has(food.name);
                                  return (
                                    <TouchableOpacity
                                      key={food.id}
                                      style={[
                                        styles.chip,
                                        sel
                                          ? styles.chipSelected
                                          : styles.chipUnselected,
                                      ]}
                                      onPress={() => toggleFood(food.name)}
                                      activeOpacity={0.7}
                                      accessibilityRole="checkbox"
                                      accessibilityState={{ checked: sel }}
                                      accessibilityLabel={food.name}
                                    >
                                      <Text
                                        style={[
                                          styles.chipText,
                                          sel
                                            ? styles.chipTextSelected
                                            : styles.chipTextUnselected,
                                        ]}
                                      >
                                        {food.name}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>)}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>สรุปรายการที่ไม่ชอบ</Text>
            {selectedArray.length > 0 ? (<View style={styles.summaryChipWrap}>{selectedArray.map((item) => (<View key={item} style={styles.summaryChip}><Text style={styles.summaryChipText}>{item}</Text><TouchableOpacity onPress={() => removeSelected(item)} activeOpacity={0.8}><Text style={styles.summaryChipRemove}>✕</Text></TouchableOpacity></View>))}</View>) : (<Text style={styles.summaryText}>-</Text>)}
          </View>
          <View style={styles.spacer} />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/register/step6-1" as any)}><Text style={styles.backText}>ย้อนกลับ</Text></TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}><Text style={styles.nextText}>ถัดไป</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
