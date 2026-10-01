import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, ROW_COLOR_1, ROW_COLOR_2 } from "./step7.styles";
import { API_BASE_URL } from "../../constants/config";

type FoodItem = { id: string; name: string };
type SubCategory = { id: string; name: string; items: FoodItem[] };
type L1Category = { id: string; name: string; subCategories: SubCategory[] };

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
        if (result?.data) {
          setCategories(result.data);
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

  const toggleFood = (name: string) => { const n = new Set(selectedFoods); n.has(name) ? n.delete(name) : n.add(name); setSelectedFoods(n); };
  const removeSelected = (name: string) => { const n = new Set(selectedFoods); n.delete(name); setSelectedFoods(n); };
  const toggleL1 = (id: string) => { setExpandedL1((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleL2 = (key: string) => { setExpandedL2((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; }); };
  const toggleL1All = (cat: L1Category) => { const ns: string[] = []; cat.subCategories.forEach((s) => s.items.forEach((i) => ns.push(i.name))); const a = ns.length > 0 && ns.every((n) => selectedFoods.has(n)); const x = new Set(selectedFoods); a ? ns.forEach((n) => x.delete(n)) : ns.forEach((n) => x.add(n)); setSelectedFoods(x); };
  const toggleL2All = (sub: SubCategory) => { const ns = sub.items.map((i) => i.name); const a = ns.length > 0 && ns.every((n) => selectedFoods.has(n)); const x = new Set(selectedFoods); a ? ns.forEach((n) => x.delete(n)) : ns.forEach((n) => x.add(n)); setSelectedFoods(x); };
  const l1Count = (cat: L1Category) => { let c = 0; cat.subCategories.forEach((s) => s.items.forEach((i) => { if (selectedFoods.has(i.name)) c++; })); return c; };
  const l2Count = (sub: SubCategory) => sub.items.filter((i) => selectedFoods.has(i.name)).length;
  const l1State = (cat: L1Category): "all" | "partial" | "none" => { let t = 0, s = 0; cat.subCategories.forEach((sub) => sub.items.forEach((i) => { t++; if (selectedFoods.has(i.name)) s++; })); if (!t || !s) return "none"; return s === t ? "all" : "partial"; };
  const l2State = (sub: SubCategory): "all" | "partial" | "none" => { const t = sub.items.length, s = sub.items.filter((i) => selectedFoods.has(i.name)).length; if (!t || !s) return "none"; return s === t ? "all" : "partial"; };
  const checkIcon = (st: string) => st === "all" ? "checkbox" : st === "partial" ? "checkbox-outline" : "square-outline";
  const filtered = searchQuery.trim() ? categories.map((c) => ({ ...c, subCategories: c.subCategories.map((s) => ({ ...s, items: s.items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase())) })).filter((s) => s.items.length > 0) })).filter((c) => c.subCategories.length > 0) : categories;
  const selectedArray = Array.from(selectedFoods);
  const handleNext = () => { const data: Record<string, string[]> = {}; categories.forEach((cat) => cat.subCategories.forEach((sub) => sub.items.forEach((item) => { if (selectedFoods.has(item.name)) { if (!data[cat.id]) data[cat.id] = []; data[cat.id].push(item.name); } }))); updateForm({ dislikedFoods: data as any }); router.push("/register/step8" as any); };

  if (isLoading) { return (<SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}><ActivityIndicator size="large" color={ORANGE} /><Text style={{ marginTop: 16, color: "#666", fontFamily: "NotoSansThaiBold" }}>กำลังโหลดข้อมูล...</Text></SafeAreaView>); }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.container}>
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
          <View style={styles.categoriesWrap}>
            {filtered.map((cat, ci) => {
              const isOpen = expandedL1.has(cat.id);
              const st = l1State(cat); const cnt = l1Count(cat);
              const bg = ci % 2 === 0 ? ROW_COLOR_1 : ROW_COLOR_2;
              return (
                <View key={cat.id}>
                  <View style={[styles.categoryRow, { backgroundColor: bg }]}>
                    <TouchableOpacity onPress={() => toggleL1All(cat)} style={{ marginRight: 10 }} activeOpacity={0.7}>
                      <Ionicons name={checkIcon(st) as any} size={22} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center" }} onPress={() => toggleL1(cat.id)} activeOpacity={0.7}>
                      <Text style={styles.categoryText}>{cat.name}</Text>
                      {cnt > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cnt}</Text></View>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleL1(cat.id)} activeOpacity={0.7}>
                      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  {isOpen && (<View style={styles.subListWrapOuter}>
                    {cat.subCategories.map((sub, si) => {
                      const l2Key = `${cat.id}__${sub.id}`;
                      const isL2 = expandedL2.has(l2Key);
                      const s2 = l2State(sub); const c2 = l2Count(sub);
                      return (
                        <View key={sub.id}>
                          <TouchableOpacity style={[styles.subItemRow, si < cat.subCategories.length - 1 && styles.subItemRowBorder, { paddingLeft: 20 }]} onPress={() => toggleL2(l2Key)} activeOpacity={0.7}>
                            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                              <TouchableOpacity onPress={() => toggleL2All(sub)} style={{ marginRight: 8 }} activeOpacity={0.7}>
                                <Ionicons name={checkIcon(s2) as any} size={20} color={s2 === "none" ? "#CCC" : ORANGE} />
                              </TouchableOpacity>
                              <Text style={[styles.subItemText, { fontFamily: "NotoSansThaiBold", fontSize: 15 }]}>{sub.name}</Text>
                              {c2 > 0 && <View style={[styles.badge, { marginLeft: 8 }]}><Text style={styles.badgeText}>{c2}</Text></View>}
                            </View>
                            <Ionicons name={isL2 ? "chevron-up" : "chevron-down"} size={18} color="#999" />
                          </TouchableOpacity>
                          {isL2 && sub.items.map((food, fi) => {
                            const sel = selectedFoods.has(food.name);
                            return (
                              <TouchableOpacity key={food.id} style={[styles.subItemRow, fi < sub.items.length - 1 && styles.subItemRowBorder, { paddingLeft: 52 }]} onPress={() => toggleFood(food.name)} activeOpacity={0.7}>
                                <Text style={styles.subItemText}>{food.name}</Text>
                                <View style={[styles.badge, { backgroundColor: sel ? ORANGE : "#F0F0F0", borderColor: sel ? ORANGE : "#E5E5E5", borderWidth: 1 }]}>
                                  <Ionicons name={sel ? "checkmark" : "add"} size={16} color={sel ? "#FFF" : "#999"} />
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>)}
                </View>
              );
            })}
          </View>

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
