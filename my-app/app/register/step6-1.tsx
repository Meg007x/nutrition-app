import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRegister } from "../../context/register-context";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";

const ALLERGIES = [
  "แพ้ถั่ว",
  "แพ้อาหารทะเล",
  "แพ้นมวัว",
  "แพ้กลูเตน",
  "แพ้ไข่",
  "แพ้แป้งสาลี",
];

const NONE_OPTION = "ไม่มีอาการแพ้";

export default function RegisterStep6Screen() {
  const { form, updateForm } = useRegister();

  const initialSelected = useMemo(() => {
    if (!form.allergies || !Array.isArray(form.allergies)) return [];
    return form.allergies;
  }, [form.allergies]);

  const [selectedAllergies, setSelectedAllergies] =
    useState<string[]>(initialSelected);

  useEffect(() => {
    if (!form.allergies || !Array.isArray(form.allergies)) {
      setSelectedAllergies([]);
      return;
    }

    setSelectedAllergies(form.allergies);
  }, [form.allergies]);

  const hasNoneSelected = selectedAllergies.includes(NONE_OPTION);
  const selectedFoodOnly = selectedAllergies.filter((item) => item !== NONE_OPTION);

  const toggleAllergy = (option: string) => {
    if (hasNoneSelected) {
      Alert.alert(
        "เลือกไม่ได้",
        "คุณเลือก 'ไม่มีอาการแพ้' อยู่ หากต้องการเลือกอาหารที่แพ้ กรุณายกเลิก 'ไม่มีอาการแพ้' ก่อน"
      );
      return;
    }

    setSelectedAllergies((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const toggleNone = () => {
    if (hasNoneSelected) {
      setSelectedAllergies([]);
      return;
    }

    if (selectedFoodOnly.length > 0) {
      Alert.alert(
        "ยืนยันการเลือก",
        "หากเลือก 'ไม่มีอาการแพ้' ระบบจะล้างรายการอาหารที่แพ้ทั้งหมด",
        [
          { text: "ยกเลิก", style: "cancel" },
          {
            text: "ยืนยัน",
            style: "destructive",
            onPress: () => setSelectedAllergies([NONE_OPTION]),
          },
        ]
      );
      return;
    }

    setSelectedAllergies([NONE_OPTION]);
  };

  const handleOpenMore = () => {
    if (hasNoneSelected) {
      Alert.alert(
        "เลือกไม่ได้",
        "คุณเลือก 'ไม่มีอาการแพ้' อยู่ จึงไม่สามารถเพิ่มรายการอาหารที่แพ้ได้"
      );
      return;
    }

    updateForm({
      hasAllergies: true,
      allergies: selectedAllergies,
    });

    router.push("/register/step6-2" as any);
  };

  const handleNext = () => {
    if (selectedAllergies.length === 0) {
      Alert.alert(
        "ยังไม่ได้เลือกข้อมูล",
        "กรุณาเลือกอาการแพ้อาหาร หรือเลือก 'ไม่มีอาการแพ้'"
      );
      return;
    }

    updateForm({
      hasAllergies: !hasNoneSelected,
      allergies: selectedAllergies,
    });

    router.push("/register/step7" as any);
  };

  const removeSelectedItem = (itemToRemove: string) => {
    setSelectedAllergies((prev) => prev.filter((item) => item !== itemToRemove));
  };

  const isSelected = (option: string) => selectedAllergies.includes(option);

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
        >
          <Text style={styles.stepTitle}>6. อาการแพ้อาหาร</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "75%" }]} />
          </View>

          <Text style={styles.subtitle}>
            คุณมีอาการแพ้อาหารหรือโรคประจำตัวหรือไม่?
          </Text>

          <View style={styles.gridContainer}>
            {ALLERGIES.map((item) => {
              const active = isSelected(item);
              const disabled = hasNoneSelected;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.allergyBtn,
                    active && styles.allergyBtnActive,
                    disabled && !active && styles.disabledButton,
                  ]}
                  onPress={() => toggleAllergy(item)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.allergyText,
                      active && styles.allergyTextActive,
                      disabled && !active && styles.disabledText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.otherBtn, hasNoneSelected && styles.disabledOtherBtn]}
            onPress={handleOpenMore}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.otherBtnText,
                hasNoneSelected && styles.disabledText,
              ]}
            >
              + อื่นๆ / รายการเพิ่มเติม
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.noneBtn,
              isSelected(NONE_OPTION) && styles.noneBtnActive,
            ]}
            onPress={toggleNone}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.noneBtnText,
                isSelected(NONE_OPTION) && styles.noneBtnTextActive,
              ]}
            >
              ไม่มีอาการแพ้
            </Text>
          </TouchableOpacity>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>สรุปรายการที่เลือก</Text>

            {selectedAllergies.length > 0 ? (
              <View style={styles.summaryChipWrap}>
                {selectedAllergies.map((item) => (
                  <View key={item} style={styles.summaryChip}>
                    <Text style={styles.summaryChipText}>{item}</Text>
                    <TouchableOpacity
                      onPress={() => removeSelectedItem(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.summaryChipRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.summaryText}>-</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/register/step5" as any)}
            >
              <Text style={styles.backText}>ย้อนกลับ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>ถัดไป</Text>
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
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  scroll: { flex: 1 },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111",
  },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
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
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  allergyBtn: {
    width: "48%",
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  allergyBtnActive: {
    backgroundColor: "#FFF",
    borderColor: ORANGE,
  },

  allergyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },

  allergyTextActive: {
    color: ORANGE,
  },

  otherBtn: {
    width: "100%",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  otherBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  noneBtn: {
    width: "100%",
    backgroundColor: ORANGE,
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  noneBtnActive: {
    backgroundColor: "#FFF",
    borderColor: ORANGE,
  },

  noneBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFF",
  },

  noneBtnTextActive: {
    color: ORANGE,
  },

  summaryBox: {
    marginTop: 16,
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
    marginBottom: 8,
  },

  summaryText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontWeight: "700",
  },

  summaryChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },

  summaryChip: {
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

  summaryChipText: {
    color: "#8A5A00",
    fontWeight: "700",
    fontSize: 14,
  },

  summaryChipRemove: {
    marginLeft: 8,
    color: "#C96E00",
    fontWeight: "900",
    fontSize: 14,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
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

  nextButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },

  nextText: {
    color: "#fff",
    fontWeight: "900",
  },

  disabledButton: {
    backgroundColor: "#E5E5E5",
    borderColor: "#D0D0D0",
  },

  disabledOtherBtn: {
    backgroundColor: "#F2F2F2",
    borderColor: "#D8D8D8",
  },

  disabledText: {
    color: "#999",
  },
});