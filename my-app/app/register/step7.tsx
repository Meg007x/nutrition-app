import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, BG, IOS_GREEN, ROW_COLOR_1, ROW_COLOR_2 } from "./step7.styles";
import { API_BASE_URL } from "../../constants/config";

type CategoryData = {
  id: string;
  name: string;
  foods: { id: string; name: string }[];
};

export default function RegisterStep7Screen() {
  const { form, updateForm } = useRegister();

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
  
  // 💡 State ควบคุมการสลับหน้าจอ (null = อยู่หน้าหลัก, string = เข้าไปในหมวดหมู่นั้นๆ)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  
  // 🔍 State สำหรับค้นหา
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchDislikedFoods = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/disliked-foods`);
        const result = await response.json();
        
        if (result && result.data) {
          setCategories(result.data);

          const safeDisliked: any = form.dislikedFoods || {};
          const isOldArray = Array.isArray(safeDisliked);

          const restoredSelected = new Set<string>();

          if (!isOldArray) {
            Object.keys(safeDisliked).forEach(catId => {
              const itemsInCat = safeDisliked[catId] || [];
              itemsInCat.forEach((item: string) => restoredSelected.add(item));
            });
          }

          setSelectedFoods(restoredSelected);
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDislikedFoods();
  }, [form.dislikedFoods]);

  const toggleFood = (foodName: string) => {
    const newSet = new Set(selectedFoods);
    if (newSet.has(foodName)) newSet.delete(foodName);
    else newSet.add(foodName);
    setSelectedFoods(newSet);
  };

  const removeSelected = (foodName: string) => {
    const newSet = new Set(selectedFoods);
    newSet.delete(foodName);
    setSelectedFoods(newSet);
  };

  const handleNext = () => {
    const formattedData: Record<string, string[]> = {};
    categories.forEach(cat => {
      const selectedInCat = cat.foods.filter(f => selectedFoods.has(f.name)).map(f => f.name);
      formattedData[cat.id] = selectedInCat;
    });

    updateForm({ dislikedFoods: formattedData as any });
    router.push("/register/step8" as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ marginTop: 16, color: "#666", fontFamily: "NotoSansThaiBold" }}>กำลังโหลดข้อมูล...</Text>
      </SafeAreaView>
    );
  }

  const selectedArray = Array.from(selectedFoods);
  const activeCat = categories.find(c => c.id === activeCategoryId);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==============================================
              หน้าย่อย (เมื่อผู้ใช้กดเลือกหมวดหมู่ใดหมวดหมู่หนึ่ง)
              ============================================== */}
          {activeCategoryId && activeCat ? (
            <View>
              <View style={styles.subScreenHeader}>
                <TouchableOpacity 
                  onPress={() => { setActiveCategoryId(null); setSearchQuery(""); setShowSearch(false); }} 
                  style={styles.backIconBtn}
                >
                  <Ionicons name="arrow-back" size={24} color="#333" />
                  <Text style={styles.backIconText}>กลับ</Text>
                </TouchableOpacity>
                <Text style={styles.subScreenTitle}>หมวด: {activeCat.name}</Text>
              </View>

              {/* ปุ่มค้นหา */}
              <TouchableOpacity 
                style={styles.searchToggleBtn}
                onPress={() => setShowSearch(!showSearch)}
                activeOpacity={0.8}
              >
                <Ionicons name={showSearch ? "close" : "search"} size={18} color="#333" />
                <Text style={styles.searchToggleText}>
                  {showSearch ? "ปิดการค้นหา" : "ค้นหา"}
                </Text>
              </TouchableOpacity>

              {/* ช่องค้นหา */}
              {showSearch && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="พิมพ์ชื่ออาหาร..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.8}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              <View style={styles.subListWrapOuter}>
                {(() => {
                  const defaultFoods = activeCat.foods || [];
                  
                  // กรองข้อมูลตามคำค้นหา
                  const filteredFoods = searchQuery
                    ? defaultFoods.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    : defaultFoods;

                  // แสดง 10 รายการแรก ถ้าไม่ได้ค้นหา
                  const displayFoods = searchQuery ? filteredFoods : filteredFoods.slice(0, 10);
                  const hasMore = !searchQuery && filteredFoods.length > 10;

                  return displayFoods.length > 0 ? (
                    <>
                      {displayFoods.map((food, i) => {
                        const isLast = i === displayFoods.length - 1 && !hasMore;
                        const isSelected = selectedFoods.has(food.name);
                        return (
                          <TouchableOpacity
                            key={food.name}
                            style={[styles.subItemRow, !isLast && styles.subItemRowBorder]}
                            onPress={() => toggleFood(food.name)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.subItemText}>{food.name}</Text>
                            <Switch
                              value={isSelected}
                              onValueChange={() => toggleFood(food.name)}
                              trackColor={{ false: "#D1D1D6", true: IOS_GREEN }}
                              thumbColor="#FFF"
                              ios_backgroundColor="#D1D1D6"
                            />
                          </TouchableOpacity>
                        );
                      })}
                      {hasMore && (
                        <TouchableOpacity 
                          style={styles.showMoreBtn}
                          onPress={() => setShowSearch(true)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.showMoreText}>
                            แสดงทั้งหมด ({filteredFoods.length} รายการ) กดค้นหาเพื่อดูเพิ่มเติม
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <Text style={styles.emptyText}>ไม่พบข้อมูลที่ค้นหา</Text>
                  );
                })()}
              </View>

              <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={() => { setActiveCategoryId(null); setSearchQuery(""); setShowSearch(false); }}
              >
                <Text style={styles.doneBtnText}>ยืนยันหมวดหมู่นี้</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ==============================================
               หน้าหลัก (แสดงรายชื่อหมวดหมู่ทั้งหมด)
               ============================================== */
            <View>
              <Text style={styles.stepTitle}>7. อาหารที่ไม่ชอบ</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: "87.5%" }]} />
              </View>
              <Text style={styles.subtitle}>เลือกประเภทอาหารที่คุณไม่ชอบรับประทาน</Text>

              <View style={styles.categoriesWrap}>
                {categories.map((cat, index) => {
                  const bgColor = index % 2 === 0 ? ROW_COLOR_1 : ROW_COLOR_2;
                  // นับจำนวนรายการที่เลือกในหมวดนี้
                  const defaultFoods = cat.foods || [];
                  const countSelected = defaultFoods.filter(f => selectedFoods.has(f.name)).length;

                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryRow, { backgroundColor: bgColor }]}
                      onPress={() => setActiveCategoryId(cat.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.categoryText}>{cat.name}</Text>
                        {countSelected > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{countSelected}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>สรุปรายการที่ไม่ชอบ</Text>
                {selectedArray.length > 0 ? (
                  <View style={styles.summaryChipWrap}>
                    {selectedArray.map((item) => (
                      <View key={item} style={styles.summaryChip}>
                        <Text style={styles.summaryChipText}>{item}</Text>
                        <TouchableOpacity onPress={() => removeSelected(item)} activeOpacity={0.8}>
                          <Text style={styles.summaryChipRemove}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.summaryText}>-</Text>
                )}
              </View>

              <View style={styles.spacer} />
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/register/step6-1" as any)}>
                  <Text style={styles.backText}>ย้อนกลับ</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextText}>ถัดไป</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

