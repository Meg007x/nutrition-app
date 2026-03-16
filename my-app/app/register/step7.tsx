import React, { useMemo, useState, useEffect } from "react";
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

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const IOS_GREEN = "#34C759";
const ROW_COLOR_1 = "#EBA032";
const ROW_COLOR_2 = "#DF9226";

// ⚠️ อย่าลืมแก้ IP เป็นของเครื่องคุณ
const API_URL = "http://localhost:3000/api/disliked-foods";

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
  const [customFoods, setCustomFoods] = useState<Record<string, string[]>>({});
  
  // 💡 State ควบคุมการสลับหน้าจอ (null = อยู่หน้าหลัก, string = เข้าไปในหมวดหมู่นั้นๆ)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    const fetchDislikedFoods = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result && result.data) {
          setCategories(result.data);

          const safeDisliked: any = form.dislikedFoods || {};
          const isOldArray = Array.isArray(safeDisliked);

          const restoredSelected = new Set<string>();
          const restoredCustoms: Record<string, string[]> = {};

          if (!isOldArray) {
            Object.keys(safeDisliked).forEach(catId => {
              const itemsInCat = safeDisliked[catId] || [];
              const knownFoodsInCat = result.data.find((c: CategoryData) => c.id === catId)?.foods.map((f: any) => f.name) || [];
              
              const customItems = itemsInCat.filter((item: string) => !knownFoodsInCat.includes(item));
              if (customItems.length > 0) restoredCustoms[catId] = customItems;

              itemsInCat.forEach((item: string) => restoredSelected.add(item));
            });
          }

          setSelectedFoods(restoredSelected);
          setCustomFoods(restoredCustoms);
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

  const handleAddCustomFood = () => {
    if (!activeCategoryId) return;
    const text = inputText.trim();
    if (text.length < 2) {
      Alert.alert("สั้นเกินไป", "กรุณาพิมพ์ชื่ออาหารอย่างน้อย 2 ตัวอักษร");
      return;
    }

    const isValidFormat = /^[ก-ฮะ-์a-zA-Z\s]+$/.test(text);
    if (!isValidFormat) {
      Alert.alert("ข้อมูลไม่ถูกต้อง", "ห้ามใส่ตัวเลขหรือสัญลักษณ์พิเศษ");
      return;
    }

    const currentCustoms = customFoods[activeCategoryId] || [];
    const isExistInDB = categories.find(c => c.id === activeCategoryId)?.foods.some(f => f.name === text);
    
    if (currentCustoms.includes(text) || isExistInDB) {
      Alert.alert("ซ้ำ", "มีรายการอาหารนี้อยู่แล้ว");
      return;
    }

    setCustomFoods(prev => ({ ...prev, [activeCategoryId]: [...currentCustoms, text] }));
    const newSet = new Set(selectedFoods);
    newSet.add(text);
    setSelectedFoods(newSet);
    setInputText(""); 
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
      const customInCat = (customFoods[cat.id] || []).filter(f => selectedFoods.has(f));
      formattedData[cat.id] = [...selectedInCat, ...customInCat];
    });

    updateForm({ dislikedFoods: formattedData as any });
    router.push("/register/step8" as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ marginTop: 16, color: "#666", fontWeight: "700" }}>กำลังโหลดข้อมูล...</Text>
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
                  onPress={() => { setActiveCategoryId(null); setInputText(""); }} 
                  style={styles.backIconBtn}
                >
                  <Ionicons name="arrow-back" size={24} color="#333" />
                  <Text style={styles.backIconText}>กลับ</Text>
                </TouchableOpacity>
                <Text style={styles.subScreenTitle}>หมวด: {activeCat.name}</Text>
              </View>

              <View style={styles.subListWrapOuter}>
                {(() => {
                  const defaultFoods = activeCat.foods || [];
                  const userAddedFoods = customFoods[activeCat.id] || [];
                  const allFoodsInCat = [...defaultFoods.map(f => f.name), ...userAddedFoods];

                  return allFoodsInCat.length > 0 ? (
                    allFoodsInCat.map((foodName, i) => {
                      const isLast = i === allFoodsInCat.length - 1;
                      const isSelected = selectedFoods.has(foodName);
                      return (
                        <TouchableOpacity
                          key={foodName}
                          style={[styles.subItemRow, !isLast && styles.subItemRowBorder]}
                          onPress={() => toggleFood(foodName)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.subItemText}>{foodName}</Text>
                          <Switch
                            value={isSelected}
                            onValueChange={() => toggleFood(foodName)}
                            trackColor={{ false: "#D1D1D6", true: IOS_GREEN }}
                            thumbColor="#FFF"
                            ios_backgroundColor="#D1D1D6"
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyText}>ไม่มีข้อมูลในหมวดนี้</Text>
                  );
                })()}

                {/* ช่องพิมพ์เพิ่มรายการเอง */}
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="+ พิมพ์เพิ่มรายการที่ไม่ชอบ..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleAddCustomFood}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.customAddBtn} onPress={handleAddCustomFood}>
                    <Text style={styles.customAddBtnText}>เพิ่ม</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={() => { setActiveCategoryId(null); setInputText(""); }}
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
                  const userAddedFoods = customFoods[cat.id] || [];
                  const allFoodsInCat = [...defaultFoods.map(f => f.name), ...userAddedFoods];
                  const countSelected = allFoodsInCat.filter(f => selectedFoods.has(f)).length;

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerBar: { paddingVertical: 16, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E5E5E5", backgroundColor: "#FFF" },
  headerText: { fontSize: 18, fontWeight: "700", color: "#333" },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  stepTitle: { fontSize: 22, fontWeight: "800", color: "#222", marginBottom: 16 },
  progressTrack: { height: 8, backgroundColor: "#E0E0E0", borderRadius: 4, marginBottom: 24, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: ORANGE, borderRadius: 4 },
  subtitle: { fontSize: 16, color: "#444", fontWeight: "600", marginBottom: 16 },
  
  // สไตล์หน้าหลัก
  categoriesWrap: { borderRadius: 12, overflow: "hidden", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E5E5" },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  categoryText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  badge: { backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10 },
  badgeText: { color: ORANGE, fontSize: 12, fontWeight: "800" },
  
  // สไตล์หน้าย่อย (Nested Screen)
  subScreenHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backIconBtn: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  backIconText: { fontSize: 16, fontWeight: "700", color: "#333", marginLeft: 4 },
  subScreenTitle: { fontSize: 20, fontWeight: "800", color: "#222" },
  subListWrapOuter: { backgroundColor: "#FFF", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#E5E5E5" },
  subItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, backgroundColor: "#FFF" },
  subItemRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  subItemText: { fontSize: 16, color: "#333", fontWeight: "600", marginLeft: 4 },
  emptyText: { padding: 20, textAlign: "center", fontSize: 16, color: "#666", backgroundColor: "#FFF" },
  doneBtn: { backgroundColor: "#222", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  doneBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  customInputRow: { flexDirection: "row", padding: 12, backgroundColor: "#FAFAFA", borderTopWidth: 1, borderTopColor: "#EFEFEF" },
  customInput: { flex: 1, height: 40, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#DDD", borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  customAddBtn: { marginLeft: 8, backgroundColor: ORANGE, justifyContent: "center", paddingHorizontal: 16, borderRadius: 8 },
  customAddBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  summaryBox: { marginTop: 16, backgroundColor: "#FFF8EC", borderRadius: 14, borderWidth: 1, borderColor: "#F0D3A3", padding: 14 },
  summaryTitle: { fontSize: 15, fontWeight: "900", color: "#6B5A3D", marginBottom: 6 },
  summaryText: { fontSize: 14, color: "#333", lineHeight: 20, fontWeight: "700" },
  summaryChipWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  summaryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF4DD", borderWidth: 1, borderColor: "#F3D299", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  summaryChipText: { color: "#8A5A00", fontWeight: "700", fontSize: 14 },
  summaryChipRemove: { marginLeft: 8, color: "#C96E00", fontWeight: "900", fontSize: 14 },

  spacer: { minHeight: 40, flex: 1 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: "auto" },
  backButton: { borderWidth: 1.5, borderColor: "#222", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, backgroundColor: "transparent", minWidth: 100, alignItems: "center" },
  backText: { color: "#222", fontSize: 16, fontWeight: "700" },
  nextButton: { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, minWidth: 100, alignItems: "center", shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});