import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRegister } from "../../context/register-context";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";
const IOS_GREEN = "#34C759";

const MOCK_VEG = [
  { id: "v1", name: "มะเขือเทศ" },
  { id: "v2", name: "แตงกวา" },
  { id: "v3", name: "แครอท" },
];

const MOCK_CONDIMENT = [
  { id: "c1", name: "ผงชูรส" },
  { id: "c2", name: "ซีอิ๊วขาว" },
  { id: "c3", name: "น้ำปลา" },
];

const MOCK_MEAT = [
  { id: "m1", name: "เนื้อวัว" },
  { id: "m2", name: "เนื้อหมู" },
  { id: "m3", name: "เนื้อไก่" },
];

const ALL_ITEMS = [...MOCK_VEG, ...MOCK_CONDIMENT, ...MOCK_MEAT];

export default function RegisterStep6OtherScreen() {
  const { form, updateForm } = useRegister();

  const initialSelectedIds = useMemo(() => {
    if (!form.allergies || !Array.isArray(form.allergies)) return [];

    return ALL_ITEMS.filter((item) => form.allergies.includes(item.name)).map(
      (item) => item.id
    );
  }, [form.allergies]);

  const initialCustomAllergies = useMemo(() => {
    if (!form.allergies || !Array.isArray(form.allergies)) return [];

    const knownNames = ALL_ITEMS.map((item) => item.name);
    return form.allergies.filter((item) => !knownNames.includes(item));
  }, [form.allergies]);

  const [isOpenVeg, setIsOpenVeg] = useState(false);
  const [isOpenCondiment, setIsOpenCondiment] = useState(false);
  const [isOpenMeat, setIsOpenMeat] = useState(false);

  const [selectedAllergies, setSelectedAllergies] =
    useState<string[]>(initialSelectedIds);

  const [customAllergyInput, setCustomAllergyInput] = useState("");
  const [customAllergies, setCustomAllergies] =
    useState<string[]>(initialCustomAllergies);

  const toggleSwitch = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const addCustomAllergy = () => {
    const value = customAllergyInput.trim();

    if (!value) return;

    const alreadyInPreset = ALL_ITEMS.some((item) => item.name === value);
    const alreadyInCustom = customAllergies.includes(value);

    if (alreadyInPreset || alreadyInCustom) {
      Alert.alert("รายการซ้ำ", "มีรายการนี้อยู่แล้ว");
      return;
    }

    setCustomAllergies((prev) => [...prev, value]);
    setCustomAllergyInput("");
    Keyboard.dismiss();
  };

  const removeCustomAllergy = (value: string) => {
    setCustomAllergies((prev) => prev.filter((item) => item !== value));
  };

  const renderList = (data: { id: string; name: string }[]) => {
    return (
      <View style={styles.listContainer}>
        {data.map((item, index) => {
          const isLast = index === data.length - 1;
          const isEnabled = selectedAllergies.includes(item.id);

          return (
            <View
              key={item.id}
              style={[styles.listItem, !isLast && styles.listItemBorder]}
            >
              <Text style={styles.listItemText}>{item.name}</Text>
              <Switch
                trackColor={{ false: "#E9E9EA", true: IOS_GREEN }}
                thumbColor="#FFF"
                ios_backgroundColor="#E9E9EA"
                onValueChange={() => toggleSwitch(item.id)}
                value={isEnabled}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const selectedPresetNames = ALL_ITEMS.filter((item) =>
    selectedAllergies.includes(item.id)
  ).map((item) => item.name);

  const finalAllergies = [...selectedPresetNames, ...customAllergies];

  const handleSaveAndBack = () => {
    if (finalAllergies.length === 0) {
      Alert.alert(
        "ยังไม่ได้เลือกข้อมูล",
        "กรุณาเลือกหรือกรอกรายการอาหารที่แพ้อย่างน้อย 1 รายการ"
      );
      return;
    }

    updateForm({
      hasAllergies: true,
      allergies: finalAllergies,
    });

    router.replace("/register/step6-1" as any);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <Text style={styles.stepTitle}>6. อาการแพ้อาหาร</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "75%" }]} />
          </View>

          <Text style={styles.subtitle}>อาหารที่แพ้เพิ่มเติม</Text>

          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => setIsOpenVeg(!isOpenVeg)}
            >
              <View style={styles.dropdownLeft}>
                <Text style={styles.emojiIcon}>🥦</Text>
                <Text style={styles.dropdownText}>ผักและผลไม้</Text>
              </View>
              <Ionicons
                name={isOpenVeg ? "caret-up" : "caret-down"}
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
            {isOpenVeg && renderList(MOCK_VEG)}
          </View>

          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => setIsOpenCondiment(!isOpenCondiment)}
            >
              <View style={styles.dropdownLeft}>
                <Text style={styles.emojiIcon}>🧂</Text>
                <Text style={styles.dropdownText}>เครื่องปรุง/ส่วนผสม</Text>
              </View>
              <Ionicons
                name={isOpenCondiment ? "caret-up" : "caret-down"}
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
            {isOpenCondiment && renderList(MOCK_CONDIMENT)}
          </View>

          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => setIsOpenMeat(!isOpenMeat)}
            >
              <View style={styles.dropdownLeft}>
                <Text style={styles.emojiIcon}>🥩</Text>
                <Text style={styles.dropdownText}>เนื้อสัตว์และโปรตีน</Text>
              </View>
              <Ionicons
                name={isOpenMeat ? "caret-up" : "caret-down"}
                size={20}
                color="#FFF"
              />
            </TouchableOpacity>
            {isOpenMeat && renderList(MOCK_MEAT)}
          </View>

          <View style={styles.customSection}>
            <Text style={styles.customTitle}>อื่นๆ / กรอกเอง</Text>

            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                value={customAllergyInput}
                onChangeText={setCustomAllergyInput}
                placeholder="เช่น งา, สตรอว์เบอร์รี, ปลาหมึก"
                placeholderTextColor="#888"
                returnKeyType="done"
                onSubmitEditing={addCustomAllergy}
              />

              <TouchableOpacity
                style={styles.addButton}
                onPress={addCustomAllergy}
                activeOpacity={0.85}
              >
                <Text style={styles.addButtonText}>เพิ่ม</Text>
              </TouchableOpacity>
            </View>

            {customAllergies.length > 0 && (
              <View style={styles.customChipWrap}>
                {customAllergies.map((item) => (
                  <View key={item} style={styles.customChip}>
                    <Text style={styles.customChipText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => removeCustomAllergy(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.customChipRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>รายการที่เลือก</Text>
            <Text style={styles.summaryText}>
              {finalAllergies.length > 0 ? finalAllergies.join(", ") : "-"}
            </Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/register/step6-1" as any)}
            >
              <Text style={styles.backText}>ย้อนกลับ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndBack}>
              <Text style={styles.saveText}>บันทึก</Text>
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
  headerText: { color: "#fff", fontSize: 20, fontWeight: "900" },

  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },

  stepTitle: { fontSize: 26, fontWeight: "900", color: "#111" },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
  },
  progressFill: {
    width: "75%",
    height: "100%",
    backgroundColor: ORANGE,
  },

  subtitle: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },

  dropdownWrapper: {
    marginBottom: 16,
  },
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiIcon: {
    fontSize: 22,
  },
  dropdownText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "700",
    marginLeft: 12,
  },

  listContainer: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: -12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
  },

  customSection: {
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  customTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderWidth: 1.2,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
  },
  addButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 15,
  },

  customChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4DD",
    borderWidth: 1,
    borderColor: "#F3D299",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  customChipText: {
    color: "#8A5A00",
    fontWeight: "700",
    fontSize: 14,
  },
  customChipRemove: {
    marginLeft: 8,
    color: "#C96E00",
    fontWeight: "900",
    fontSize: 14,
  },

  summaryBox: {
    marginTop: 8,
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0D3A3",
    padding: 14,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#6B5A3D",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontWeight: "700",
  },

  spacer: {
    flex: 1,
    minHeight: 40,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  backButton: {
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: "#FFF",
  },
  backText: {
    fontWeight: "900",
    color: "#222",
  },
  saveButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
  },
});