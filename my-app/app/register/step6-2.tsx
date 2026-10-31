import React, { useEffect, useMemo, useState } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import styles, { ORANGE, DARK } from "./step6-2.styles";
import { API_BASE_URL } from "../../constants/config";
import AllergyClearConfirmModal from "./AllergyClearConfirmModal";
import { isOtherIngredientCategory } from "./ingredientCategoryUtils";

type Tier3Item = { id: string; name: string };
type Tier2Category = { id: string; name: string; items: Tier3Item[] };
type Tier1Category = { id: string; name: string; emoji?: string; subCategories: Tier2Category[] };

const GROUPS = [
  { id: "milk", name: "นมวัว", keywords: ["นม", "ชีส", "เนย", "โยเกิร์ต", "ครีม", "เวย์", "milk", "cheese", "butter", "yogurt", "cream", "whey"], subCategoryKeywords: ["นมและผลิตภัณฑ์นม"] },
  { id: "egg", name: "ไข่ไก่", keywords: ["ไข่", "egg"] },
  { id: "sesame", name: "งา", keywords: ["งา", "sesame", "tahini"] },
  { id: "soy", name: "ถั่วเหลือง", keywords: ["ถั่วเหลือง", "เต้าหู้", "นมถั่วเหลือง", "ซีอิ๊ว", "ซอสถั่วเหลือง", "soy", "tofu"] },
  { id: "wheat", name: "ข้าวสาลี", keywords: ["ข้าวสาลี", "แป้งสาลี", "กลูเตน", "ขนมปัง", "พาสต้า", "wheat", "gluten"] },
  { id: "peanut", name: "ถั่วลิสง", keywords: ["ถั่วลิสง", "เนยถั่ว", "peanut"] },
  { id: "tree-nuts", name: "ถั่วเปลือกแข็ง", keywords: ["ถั่วเปลือกแข็ง", "อัลมอนด์", "วอลนัท", "พิสตาชิโอ", "เม็ดมะม่วงหิมพานต์", "เฮเซลนัท", "แมคคาเดเมีย", "พีแคน", "almond", "walnut", "pistachio", "cashew", "hazelnut", "macadamia", "pecan"] },
  { id: "shellfish", name: "กุ้ง ปู และสัตว์น้ำเปลือกแข็ง", keywords: ["กุ้ง", "ปู", "กั้ง", "ล็อบสเตอร์", "หอย", "shellfish", "shrimp", "crab", "lobster", "mussel", "oyster"] },
  { id: "fish", name: "ปลา", keywords: ["ปลา", "fish", "salmon", "tuna"] },
];

const CATEGORY_EMOJI: Record<string, string> = {
  "ผักและผลไม้": "🥬",
  "เนื้อสัตว์และโปรตีน": "🥩",
  "เครื่องปรุง/ส่วนผสม": "🧂",
};

function getSelected(form: ReturnType<typeof useRegister>["form"]): string[] {
  if (Array.isArray(form.allergies_v2) && form.allergies_v2.length) {
    return [...new Set(form.allergies_v2.map(item => String(item.label || item.code || "")).filter(Boolean))];
  }
  const legacy = form.allergies as Record<string, unknown> | string[] | null;
  if (Array.isArray(legacy)) return [...new Set(legacy.filter(Boolean).map(String))];
  if (!legacy || typeof legacy !== "object") return [];
  return [...new Set(["veg", "condiment", "meat", "other"].flatMap(category =>
    Array.isArray(legacy[category]) ? legacy[category].filter(Boolean).map(String) : []
  ))];
}

function makeV2(names: string[], hierarchy: Tier1Category[]) {
  return names.filter(Boolean).map(name => ({
    type: "specific" as const,
    code: name.toLowerCase().replace(/\s+/g, "_"),
    label: name,
    ingredient_id: hierarchy.flatMap(category => category.subCategories.flatMap(sub => sub.items))
      .find(item => item.name === name)?.id || null,
  }));
}

export default function RegisterStep6DetailsScreen() {
  const { form, updateForm } = useRegister();
  const { groupId: rawGroupId } = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;
  const activeGroup = GROUPS.find(group => group.id === groupId);

  const [hierarchy, setHierarchy] = useState<Tier1Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(() => getSelected(form));
  const [expandedT1, setExpandedT1] = useState<Set<string>>(new Set());
  const [expandedT2, setExpandedT2] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Keep this screen's local checkbox state in sync if the summary screen
  // clears or edits allergies while this route remains mounted in the stack.
  useEffect(() => {
    setSelectedAllergies(getSelected(form));
  }, [form.allergies, form.allergies_v2]);

  useEffect(() => {
    const loadHierarchy = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/food/ingredients/hierarchy`);
        if (!response.ok) throw new Error(`Ingredient hierarchy request failed: ${response.status}`);
        const result = await response.json();
        if (!result?.success || !Array.isArray(result.data)) throw new Error("Invalid ingredient hierarchy response");
        setHierarchy(result.data.filter((category: Tier1Category) => !isOtherIngredientCategory(category)));
      } catch (error) {
        console.error("Fetch error:", error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    loadHierarchy();
  }, []);

  useEffect(() => {
    if ((!searchQuery.trim() && !activeGroup) || hierarchy.length === 0) {
      if (!searchQuery.trim() && !activeGroup) {
        setExpandedT1(new Set());
        setExpandedT2(new Set());
      }
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const nextT1 = new Set<string>();
    const nextT2 = new Set<string>();
    hierarchy.forEach(category => category.subCategories.forEach(sub => {
      const matches = sub.items.some(item => {
        const name = item.name.toLowerCase();
        const groupMatch = !activeGroup || (activeGroup.subCategoryKeywords
          ? activeGroup.subCategoryKeywords.some(keyword =>
            `${category.name} ${sub.name}`.toLowerCase().includes(keyword.toLowerCase()))
          : activeGroup.keywords.some(keyword => name.includes(keyword.toLowerCase())));
        return groupMatch && (!query || name.includes(query));
      });
      if (matches) {
        nextT1.add(category.id);
        nextT2.add(sub.id);
      }
    }));
    setExpandedT1(previous => new Set([...previous, ...nextT1]));
    setExpandedT2(previous => new Set([...previous, ...nextT2]));
  }, [searchQuery, hierarchy, activeGroup]);

  const filteredHierarchy = useMemo(() => hierarchy.map(category => ({
    ...category,
    subCategories: category.subCategories.map(sub => ({
      ...sub,
      items: sub.items.filter(item => {
        const name = item.name.toLowerCase();
        const matchesSearch = !searchQuery.trim() || name.includes(searchQuery.trim().toLowerCase());
        const matchesGroup = !activeGroup || (activeGroup.subCategoryKeywords
          ? activeGroup.subCategoryKeywords.some(keyword =>
            `${category.name} ${sub.name}`.toLowerCase().includes(keyword.toLowerCase()))
          : activeGroup.keywords.some(keyword => name.includes(keyword.toLowerCase())));
        return matchesSearch && matchesGroup;
      }),
    })).filter(sub => sub.items.length > 0),
  })).filter(category => category.subCategories.length > 0), [hierarchy, searchQuery, activeGroup]);

  const updateSelection = (next: string[]) => {
    const unique = [...new Set(next)];
    setSelectedAllergies(unique);
    const allNames = new Set(hierarchy.flatMap(category =>
      category.subCategories.flatMap(sub => sub.items.map(item => item.name))
    ));
    const allergies = { veg: [] as string[], condiment: [] as string[], meat: [] as string[], other: [] as string[] };
    unique.forEach(name => {
      if (!allNames.has(name)) {
        allergies.other.push(name);
        return;
      }
      hierarchy.forEach(category => category.subCategories.forEach(sub => sub.items.forEach(item => {
        if (item.name !== name) return;
        const categoryName = category.name.toLowerCase();
        if (categoryName.includes("ผัก") || categoryName.includes("ผลไม้")) allergies.veg.push(name);
        else if (categoryName.includes("เครื่อง") || categoryName.includes("ปรุง")) allergies.condiment.push(name);
        else if (categoryName.includes("เนื้อ") || categoryName.includes("สัตว์") || categoryName.includes("โปรตีน")) allergies.meat.push(name);
        else allergies.other.push(name);
      })));
    });
    if (hierarchy.length === 0) {
      const previous = form.allergies as Record<string, unknown> | null;
      const kept = new Set<string>();
      (["veg", "condiment", "meat", "other"] as const).forEach(category => {
        const values = Array.isArray(previous?.[category])
          ? previous[category].filter((name): name is string => typeof name === "string" && unique.includes(name))
          : [];
        allergies[category].push(...values);
        values.forEach(name => kept.add(name));
      });
      unique.filter(name => !kept.has(name)).forEach(name => allergies.other.push(name));
    }
    updateForm({
      hasAllergies: unique.length > 0 ? true : null,
      allergies,
      allergies_v2: makeV2(unique, hierarchy),
    });
  };

  const toggleItem = (name: string) => updateSelection(
    selectedAllergies.includes(name)
      ? selectedAllergies.filter(item => item !== name)
      : [...selectedAllergies, name]
  );

  const addCustom = () => {
    const name = customInput.trim();
    if (!name) return;
    if (!selectedAllergies.includes(name)) updateSelection([...selectedAllergies, name]);
    setCustomInput("");
  };

  const toggleT1 = (id: string) => setExpandedT1(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleT2 = (id: string) => setExpandedT2(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const selectedInCategory = (category: Tier1Category) =>
    category.subCategories.reduce((count, sub) =>
      count + sub.items.filter(item => selectedAllergies.includes(item.name)).length, 0);

  const saveAndBack = () => {
    updateSelection(selectedAllergies);
    router.replace("/register/step6-1" as any);
  };

  const content = (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.replace("/register/step6-1" as any)}
          style={styles.backIcon}
          accessibilityRole="button"
          accessibilityLabel="ย้อนกลับ"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ลงทะเบียนผู้ใช้งาน</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>6. อาหารที่แพ้/แพ้อาหาร</Text>
        <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
        <Text style={styles.subtitle}>
          {activeGroup ? `เลือกวัตถุดิบที่เกี่ยวข้องกับ${activeGroup.name}` : "เลือกวัตถุดิบที่คุณแพ้หรือแพ้อาหาร (ถ้ามี)"}
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาวัตถุดิบ..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10} accessibilityLabel="ล้างคำค้นหา">
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={ORANGE} /></View>
        ) : loadError ? (
          <Text style={styles.emptyText}>โหลดข้อมูลวัตถุดิบไม่สำเร็จ สามารถเพิ่มรายการเองด้านล่างได้</Text>
        ) : filteredHierarchy.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery ? "ไม่พบวัตถุดิบที่ตรงกับคำค้นหาในกลุ่มนี้" : activeGroup
              ? `ไม่พบวัตถุดิบที่เกี่ยวข้องกับ${activeGroup.name} สามารถเพิ่มรายการเองด้านล่างได้`
              : "ไม่พบข้อมูลวัตถุดิบ"}
          </Text>
        ) : filteredHierarchy.map(category => activeGroup ? (
          <View key={category.id}>
            {category.subCategories.map(sub => {
              const count = sub.items.filter(item => selectedAllergies.includes(item.name)).length;
              return (
                <View key={`${category.id}-${sub.id}`} style={[styles.categoryCard, styles.categoryCardExpanded]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryHeaderLeft}>
                      <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[category.name] || category.emoji || "📦"}</Text>
                      <Text style={styles.categoryName}>{sub.name}</Text>
                      {count > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{count}</Text></View>}
                    </View>
                  </View>
                  <View style={styles.subCategoryArea}>
                    <View style={styles.chipContainer}>
                      {sub.items.map(item => {
                        const selected = selectedAllergies.includes(item.name);
                        return (
                          <TouchableOpacity key={item.id} style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleItem(item.name)} activeOpacity={0.7}>
                            <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>{item.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View key={category.id} style={[styles.categoryCard, expandedT1.has(category.id) && styles.categoryCardExpanded]}>
            <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleT1(category.id)} activeOpacity={0.7}>
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryEmoji}>{CATEGORY_EMOJI[category.name] || category.emoji || "📦"}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                {selectedInCategory(category) > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{selectedInCategory(category)}</Text></View>}
              </View>
              <Ionicons name={expandedT1.has(category.id) ? "chevron-up" : "chevron-down"} size={20} color="#999" />
            </TouchableOpacity>
            {expandedT1.has(category.id) && (
              <View style={styles.subCategoryArea}>
                {category.subCategories.map(sub => {
                  const expanded = expandedT2.has(sub.id);
                  const count = sub.items.filter(item => selectedAllergies.includes(item.name)).length;
                  return (
                    <View key={sub.id} style={styles.subCategoryCard}>
                      <TouchableOpacity style={styles.subCategoryHeader} onPress={() => toggleT2(sub.id)} activeOpacity={0.7}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                          <Text style={styles.subCategoryName}>{sub.name}</Text>
                          {count > 0 && <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{count}</Text></View>}
                        </View>
                        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={DARK} />
                      </TouchableOpacity>
                      {expanded && (
                        <View style={styles.chipContainer}>
                          {sub.items.map(item => {
                            const selected = selectedAllergies.includes(item.name);
                            return (
                              <TouchableOpacity key={item.id} style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]} onPress={() => toggleItem(item.name)} activeOpacity={0.7}>
                                <Text style={[styles.chipText, selected ? styles.chipTextSelected : styles.chipTextUnselected]}>{item.name}</Text>
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
        ))}

        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            placeholder="เพิ่มวัตถุดิบเอง..."
            placeholderTextColor="#999"
            value={customInput}
            onChangeText={setCustomInput}
            onSubmitEditing={addCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtnSmall} onPress={addCustom} activeOpacity={0.8}>
            <Text style={styles.addBtnSmallText}>เพิ่ม</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>รายการที่เลือก ({selectedAllergies.length})</Text>
            {selectedAllergies.length > 0 && (
              <TouchableOpacity onPress={() => setShowClearConfirm(true)}>
                <Text style={styles.clearAllText}>ล้างทั้งหมด</Text>
              </TouchableOpacity>
            )}
          </View>
          {selectedAllergies.length > 0 ? (
            <View style={styles.selectedItems}>
              {selectedAllergies.map(name => (
                <TouchableOpacity key={name} style={styles.selectedItem} onPress={() => updateSelection(selectedAllergies.filter(item => item !== name))} accessibilityRole="button" accessibilityLabel={`ลบ ${name}`}>
                  <Text style={styles.selectedItemText}>{name}</Text>
                  <Ionicons name="close-circle" size={14} color="#888" />
                </TouchableOpacity>
              ))}
            </View>
          ) : <Text style={styles.summaryText}>-</Text>}
        </View>

        <View style={styles.spacer} />
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/register/step6-1" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveAndBack}
            activeOpacity={0.8}
          >
            <Text style={styles.saveText}>บันทึก</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <AllergyClearConfirmModal
        visible={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          updateSelection([]);
          setShowClearConfirm(false);
        }}
      />
    </SafeAreaView>
  );

  if (Platform.OS === "web") return content;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {content}
    </TouchableWithoutFeedback>
  );
}
