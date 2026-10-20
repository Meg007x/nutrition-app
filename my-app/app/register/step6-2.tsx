import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, FONT_BOLD, FONT_REGULAR } from "./step6-2.styles";
import { API_BASE_URL } from "../../constants/config";

type Tier3Item = { id: string; name: string };
type Tier2Category = { id: string; name: string; items: Tier3Item[] };
type Tier1Category = { id: string; name: string; emoji?: string; subCategories: Tier2Category[] };

const CATEGORY_EMOJI: Record<string, string> = {
  "ผักและผลไม้": "🥬",
  "เนื้อสัตว์และโปรตีน": "🥩",
  "เครื่องปรุง/ส่วนผสม": "🧂",
};

export default function RegisterStep6OtherScreen() {
  const { form, updateForm } = useRegister();

  const [isLoading, setIsLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<Tier1Category[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [expandedT1, setExpandedT1] = useState<Set<string>>(new Set());
  const [expandedT2, setExpandedT2] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/food/ingredients/hierarchy`);
        const result = await response.json();
        if (result?.success && Array.isArray(result.data)) setHierarchy(result.data);
      } catch (e) { console.error("Fetch error:", e); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (hierarchy.length === 0) return;
    const v2 = form.allergies_v2;
    if (Array.isArray(v2) && v2.length > 0) {
      setSelectedAllergies(v2.map((a: any) => String(a.label || a.code || "")).filter(Boolean));
      return;
    }
    const safe: any = form.allergies || {};
    const names: string[] = [];
    ["veg", "condiment", "meat", "other"].forEach(cat => {
      if (Array.isArray(safe[cat])) safe[cat].forEach((n: string) => { if (n) names.push(String(n)); });
    });
    if (names.length > 0) setSelectedAllergies([...new Set(names)]);
  }, [hierarchy, form.allergies, form.allergies_v2]);

  // ─── Toggle helpers ───
  const toggleAllergy = (name: string) => {
    setSelectedAllergies(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };
  const toggleT1 = (id: string) => {
    setExpandedT1(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleT2 = (id: string) => {
    setExpandedT2(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const countSelectedInT1 = (cat: Tier1Category) => {
    let c = 0;
    cat.subCategories.forEach(sub => sub.items.forEach(item => { if (selectedAllergies.includes(item.name)) c++; }));
    return c;
  };
  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selectedAllergies.includes(trimmed)) setSelectedAllergies(prev => [...prev, trimmed]);
    setCustomInput("");
  };

  // ─── Save & navigate ───
  const handleSaveAndBack = () => {
    const allNames = new Set<string>();
    hierarchy.forEach(cat => cat.subCategories.forEach(sub => sub.items.forEach(item => allNames.add(item.name))));
    const veg: string[] = [], condiment: string[] = [], meat: string[] = [], other: string[] = [];
    selectedAllergies.forEach(name => {
      if (!allNames.has(name)) { other.push(name); return; }
      hierarchy.forEach(cat => cat.subCategories.forEach(sub => sub.items.forEach(item => {
        if (item.name !== name) return;
        const cn = (cat.name || "").toLowerCase();
        if (cn.includes("ผัก") || cn.includes("ผลไม้")) veg.push(name);
        else if (cn.includes("เครื่อง") || cn.includes("ปรุง")) condiment.push(name);
        else if (cn.includes("เนื้อ") || cn.includes("สัตว์") || cn.includes("โปรตีน")) meat.push(name);
        else other.push(name);
      })));
    });
    const allergies_v2 = selectedAllergies.filter(Boolean).map(name => ({
      type: "specific" as const,
      code: String(name).toLowerCase().replace(/\s+/g, "_"),
      label: String(name),
      ingredient_id: null,
    }));
    updateForm({ allergies: { veg, condiment, meat, other }, allergies_v2 });
    router.push("/register/step7" as any);
  };

  // ─── Render ───
  const content = (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>6. อาหารที่แพ้/แพ้อาหาร</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "75%" }]} />
        </View>
        <Text style={styles.subtitle}>เลือกวัตถุดิบที่คุณแพ้หรือแพ้อาหาร (ถ้ามี)</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={ORANGE} /></View>
        ) : hierarchy.length === 0 ? (
          <Text style={styles.emptyText}>ไม่พบข้อมูลวัตถุดิบ</Text>
        ) : (
          hierarchy.map(cat => {
            const isExpanded = expandedT1.has(cat.id);
            const selectedCount = countSelectedInT1(cat);
            const emoji = CATEGORY_EMOJI[cat.name] || cat.emoji || "📦";
            return (
              <View key={cat.id} style={[styles.categoryCard, isExpanded && styles.categoryCardExpanded]}>
                <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleT1(cat.id)} activeOpacity={0.7}>
                  <View style={styles.categoryHeaderLeft}>
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    {selectedCount > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{selectedCount}</Text></View>}
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.subCategoryArea}>
                    {cat.subCategories.map(sub => {
                      const isSub = expandedT2.has(sub.id);
                      const subCnt = sub.items.filter(i => selectedAllergies.includes(i.name)).length;
                      return (
                        <View key={sub.id} style={styles.subCategoryCard}>
                          <TouchableOpacity style={styles.subCategoryHeader} onPress={() => toggleT2(sub.id)} activeOpacity={0.7}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                              <Text style={styles.subCategoryName}>{sub.name}</Text>
                              {subCnt > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{subCnt}</Text></View>}
                            </View>
                            <Ionicons name={isSub ? "chevron-up" : "chevron-down"} size={16} color="#C67A1A" />
                          </TouchableOpacity>
                          {isSub && (
                            <View style={styles.chipContainer}>
                              {sub.items.map(item => {
                                const sel = selectedAllergies.includes(item.name);
                                return (
                                  <TouchableOpacity key={item.id} style={[styles.chip, sel ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleAllergy(item.name)} activeOpacity={0.7}>
                                    <Text style={[styles.chipText, sel ? styles.chipTextSelected : styles.chipTextUnselected]}>{item.name}</Text>
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
          })
        )}

        {/* Custom input */}
        <View style={styles.customInputRow}>
          <TextInput style={styles.customInput} placeholder="เพิ่มวัตถุดิบเอง..." placeholderTextColor="#AAA" value={customInput} onChangeText={setCustomInput} onSubmitEditing={addCustom} />
          <TouchableOpacity style={styles.addBtnSmall} onPress={addCustom} activeOpacity={0.8}>
            <Text style={styles.addBtnSmallText}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>รายการที่เลือก ({selectedAllergies.length})</Text>
          <Text style={styles.summaryText}>{selectedAllergies.length > 0 ? selectedAllergies.join(", ") : "-"}</Text>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/register/step6-1" as any)}>
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndBack}>
            <Text style={styles.saveText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (Platform.OS === "web") return content;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}
