
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";
import { API_BASE_URL } from "../../constants/config";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";

type Ingredient = {
  id: string;
  name: string;
  allergens: string[];
  category_group_label?: string;
  category_group?: string;
  sub_category_label?: string;
  sub_category?: string;
  keywords?: string[];
  is_active?: boolean;
};

type AllergyForm = {
  selectedGroups: string[];
  details: Record<string, string[]>;
  detailNames: Record<string, string[]>;
  allInGroup: string[];
};

function normalizeAllergies(value: any): AllergyForm {
  if (!value || Array.isArray(value)) {
    return {
      selectedGroups: [],
      details: {},
      detailNames: {},
      allInGroup: [],
    };
  }

  return {
    selectedGroups: Array.isArray(value.selectedGroups)
      ? value.selectedGroups
      : [],
    details: value.details || {},
    detailNames: value.detailNames || {},
    allInGroup: Array.isArray(value.allInGroup)
      ? value.allInGroup
      : [],
  };
}

function flattenIngredients(data: any): any[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    return Object.values(data).flatMap((value: any) =>
      Array.isArray(value) ? value : []
    );
  }

  return [];
}

export default function RegisterStep6OtherScreen() {
  const { form, updateForm } = useRegister();
  const params = useLocalSearchParams<{
    groupId?: string;
    groupName?: string;
  }>();

  const groupId = String(params.groupId || "");
  const groupName = String(params.groupName || "วัตถุดิบ");

  const [isLoading, setIsLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [avoidAll, setAvoidAll] = useState(false);

  const saved = useMemo(
    () => normalizeAllergies(form.allergies),
    [form.allergies]
  );

  useEffect(() => {
    setSelectedIds(saved.details[groupId] || []);
    setAvoidAll(saved.allInGroup.includes(groupId));
  }, [groupId]);

  useEffect(() => {
    let cancelled = false;

    const fetchIngredients = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/ingredients?allergen=${encodeURIComponent(groupId)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const rawItems = flattenIngredients(result?.data ?? result);

        const normalized: Ingredient[] = rawItems
          .filter((item: any) => item && (item._id || item.id))
          .map((item: any) => ({
            id: String(item._id || item.id),
            name: String(item.name || ""),
            allergens: Array.isArray(item.allergens)
              ? item.allergens.map(String)
              : [],
            category_group_label: item.category_group_label || "",
            category_group: item.category_group || "",
            sub_category_label: item.sub_category_label || "",
            sub_category: item.sub_category || "",
            keywords: Array.isArray(item.keywords)
              ? item.keywords.map(String)
              : [],
            is_active: item.is_active,
          }))
          .filter((item) => item.name && item.is_active !== false)
          // กรองซ้ำที่ฝั่งแอป เพื่อไม่แสดงวัตถุดิบของกลุ่มอื่น
          .filter((item) => item.allergens.includes(groupId));

        if (!cancelled) {
          setIngredients(normalized);
        }
      } catch (error) {
        console.error("Fetch allergy ingredients error:", error);

        if (!cancelled) {
          Alert.alert(
            "โหลดข้อมูลไม่สำเร็จ",
            "ไม่สามารถดึงวัตถุดิบจากฐานข้อมูลได้ กรุณาตรวจสอบ API แล้วลองอีกครั้ง"
          );
          setIngredients([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (groupId) {
      fetchIngredients();
    } else {
      setIngredients([]);
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    if (!query) return ingredients;

    return ingredients.filter((item) =>
      [
        item.name,
        ...(item.keywords || []),
        item.category_group_label || "",
        item.sub_category_label || "",
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query)
    );
  }, [ingredients, search]);

  const groupedIngredients = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};

    filteredIngredients.forEach((item) => {
      const category =
        item.category_group_label ||
        item.category_group ||
        "วัตถุดิบอื่น ๆ";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(item);
    });

    return Object.entries(groups);
  }, [filteredIngredients]);

  const toggleIngredient = (id: string) => {
    setAvoidAll(false);

    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleAvoidAll = () => {
    setAvoidAll((prev) => !prev);
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    if (!avoidAll && selectedIds.length === 0) {
      Alert.alert(
        "ยังไม่ได้เลือกรายการ",
        "กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ หรือเลือกหลีกเลี่ยงทั้งหมดในกลุ่มนี้"
      );
      return;
    }

    const selectedNames = ingredients
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => item.name);

    // เก็บรายละเอียดของกลุ่มนี้ โดยไม่ลบรายการของกลุ่มอื่น
    const next: AllergyForm = {
      ...saved,
      selectedGroups: saved.selectedGroups.includes(groupId)
        ? saved.selectedGroups
        : [...saved.selectedGroups, groupId],
      details: {
        ...saved.details,
        [groupId]: avoidAll ? [] : selectedIds,
      },
      detailNames: {
        ...saved.detailNames,
        [groupId]: avoidAll ? [] : selectedNames,
      },
      allInGroup: avoidAll
        ? Array.from(new Set([...saved.allInGroup, groupId]))
        : saved.allInGroup.filter((id) => id !== groupId),
    };

    updateForm({
      hasAllergies: true,
      allergies: next as any,
    });

    // กลับไปหน้า 6.1 และคงรายการกลุ่มอื่นไว้
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepTitle}>6. วัตถุดิบที่แพ้</Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.subtitle}>
            เลือกรายละเอียด: {groupName}
          </Text>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color="#777" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="ค้นหาวัตถุดิบ..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.allGroupButton,
              avoidAll && styles.allGroupButtonActive,
            ]}
            onPress={toggleAvoidAll}
          >
            <Ionicons
              name={avoidAll ? "checkbox" : "square-outline"}
              size={23}
              color={avoidAll ? ORANGE : "#777"}
            />
            <View style={styles.allGroupInfo}>
              <Text style={styles.allGroupTitle}>
                หลีกเลี่ยงทั้งหมดในกลุ่มนี้
              </Text>
              <Text style={styles.allGroupHint}>
                เลือกตัวเลือกนี้หากต้องการระบุว่าหลีกเลี่ยงทั้งกลุ่ม
              </Text>
            </View>
          </TouchableOpacity>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={ORANGE} />
              <Text style={styles.loadingText}>
                กำลังโหลดวัตถุดิบ...
              </Text>
            </View>
          ) : ingredients.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="alert-circle-outline"
                size={32}
                color="#999"
              />
              <Text style={styles.emptyTitle}>
                ยังไม่พบวัตถุดิบในกลุ่มนี้
              </Text>
              <Text style={styles.emptyText}>
                กรุณาตรวจสอบว่า API ส่งข้อมูล allergens และมีวัตถุดิบที่
                ระบุกลุ่มนี้ไว้ในฐานข้อมูลแล้ว
              </Text>
            </View>
          ) : filteredIngredients.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                ไม่พบวัตถุดิบที่ค้นหา
              </Text>
            </View>
          ) : (
            groupedIngredients.map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>

                {items.map((item) => {
                  const selected = selectedIds.includes(item.id);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.ingredientRow,
                        selected && styles.ingredientRowSelected,
                      ]}
                      onPress={() => toggleIngredient(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.ingredientName,
                          selected && styles.ingredientNameSelected,
                        ]}
                      >
                        {item.name}
                      </Text>

                      <Ionicons
                        name={
                          selected ? "checkbox" : "square-outline"
                        }
                        size={23}
                        color={selected ? ORANGE : "#999"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>รายการที่เลือก</Text>
            {avoidAll ? (
              <Text style={styles.summaryText}>
                หลีกเลี่ยงทั้งหมดในกลุ่ม {groupName}
              </Text>
            ) : selectedIds.length > 0 ? (
              <Text style={styles.summaryText}>
                {ingredients
                  .filter((item) => selectedIds.includes(item.id))
                  .map((item) => item.name)
                  .join(", ")}
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                ยังไม่มีรายการที่เลือก
              </Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              <Text style={styles.confirmText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerBar: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    alignItems: "center",
  },
  headerText: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "NotoSansThaiBold",
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  stepTitle: {
    fontSize: 26,
    color: "#171717",
    fontFamily: "NotoSansThaiBold",
  },
  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#DDD",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    width: "75%",
    height: "100%",
    backgroundColor: ORANGE,
  },
  subtitle: {
    marginTop: 18,
    marginBottom: 12,
    fontSize: 17,
    color: "#333",
    fontFamily: "NotoSansThaiBold",
  },
  searchBox: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 13,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#333",
    fontSize: 14,
    fontFamily: "NotoSansThai",
  },
  allGroupButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 13,
    padding: 13,
    marginBottom: 16,
  },
  allGroupButtonActive: {
    borderColor: ORANGE,
    backgroundColor: "#FFF8E8",
  },
  allGroupInfo: { flex: 1, marginLeft: 10 },
  allGroupTitle: {
    color: "#333",
    fontSize: 14,
    fontFamily: "NotoSansThaiBold",
  },
  allGroupHint: {
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    fontFamily: "NotoSansThai",
  },
  categorySection: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingTop: 12,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  categoryTitle: {
    fontSize: 15,
    color: "#875700",
    marginBottom: 5,
    fontFamily: "NotoSansThaiBold",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 49,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  ingredientRowSelected: { backgroundColor: "#FFFAF0" },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontFamily: "NotoSansThai",
  },
  ingredientNameSelected: {
    color: "#875700",
    fontFamily: "NotoSansThaiBold",
  },
  loadingBox: {
    padding: 30,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#777",
    fontFamily: "NotoSansThai",
  },
  emptyBox: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    fontFamily: "NotoSansThaiBold",
  },
  emptyText: {
    fontSize: 13,
    color: "#888",
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "NotoSansThai",
  },
  summaryBox: {
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D8AA",
    padding: 14,
    marginTop: 6,
  },
  summaryTitle: {
    fontSize: 15,
    color: "#6B4C17",
    marginBottom: 8,
    fontFamily: "NotoSansThaiBold",
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    fontFamily: "NotoSansThai",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  backButton: {
    borderWidth: 1.3,
    borderColor: "#333",
    backgroundColor: "#FFF",
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 27,
  },
  backText: {
    fontSize: 15,
    color: "#333",
    fontFamily: "NotoSansThaiBold",
  },
  confirmButton: {
    backgroundColor: ORANGE,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 38,
  },
  confirmText: {
    color: "#FFF",
    fontSize: 15,
    fontFamily: "NotoSansThaiBold",
  },
});