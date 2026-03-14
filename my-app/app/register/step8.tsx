import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useRegister } from "../../context/register-context";

const ORANGE = "#F5A400";
const BG = "#F3F3F3";

// 🔴 [BACKEND TODO]: อนาคตต้องดึงรายการประเภทอาหารเหล่านี้มาจาก API Database
const MOCK_CUISINES = [
  { id: "1", name: "อาหารอเมริกัน" },
  { id: "2", name: "อาหารเอเชีย" },
  { id: "3", name: "อาหารจีน" },
  { id: "4", name: "อาหารอินเดีย" },
  { id: "5", name: "อาหารอิตาลี" },
  { id: "6", name: "อาหารญี่ปุ่น" },
  { id: "7", name: "อาหารแม็กซิกัน" },
  { id: "8", name: "อาหารไทย" },
];

export default function RegisterStep8Screen() {
  const { form, updateForm } = useRegister();

  const initialSelected = useMemo(() => {
    if (!form.interestedCuisines || !Array.isArray(form.interestedCuisines)) {
      return [];
    }

    return MOCK_CUISINES.filter((item) =>
      form.interestedCuisines.includes(item.name)
    ).map((item) => item.id);
  }, [form.interestedCuisines]);

  const [selectedCuisines, setSelectedCuisines] =
    useState<string[]>(initialSelected);

  const toggleSelection = (id: string) => {
    if (selectedCuisines.includes(id)) {
      setSelectedCuisines((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedCuisines((prev) => [...prev, id]);
    }
  };

  const selectedCuisineNames = MOCK_CUISINES.filter((item) =>
    selectedCuisines.includes(item.id)
  ).map((item) => item.name);

  return (
    <SafeAreaView style={styles.container}>
      {/* --- แถบ Header --- */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>ลงทะเบียนผู้ใช้งาน</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>8.อาหารที่สนใจ</Text>

        {/* --- Progress Bar --- */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "95%" }]} />
        </View>

        <Text style={styles.subtitle}>ประเภทอาหารที่ชอบหรือสนใจ</Text>

        {/* --- รายการอาหาร (กดเลือกได้หลายอัน) --- */}
        <View style={styles.listContainer}>
          {MOCK_CUISINES.map((cuisine) => {
            const isSelected = selectedCuisines.includes(cuisine.id);

            return (
              <TouchableOpacity
                key={cuisine.id}
                style={[
                  styles.cuisineItem,
                  isSelected
                    ? styles.cuisineItemSelected
                    : styles.cuisineItemUnselected,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleSelection(cuisine.id)}
              >
                <Text
                  style={[
                    styles.cuisineText,
                    isSelected
                      ? styles.cuisineTextSelected
                      : styles.cuisineTextUnselected,
                  ]}
                >
                  {cuisine.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.spacer} />

        {/* --- ปุ่มล่าง --- */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/register/step7" as any)}
          >
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              updateForm({
                interestedCuisines: selectedCuisineNames,
              });

              console.log(
                "อาหารที่สนใจ เตรียมส่ง DB:",
                selectedCuisineNames
              );

              router.push("/register/step9" as any);
            }}
          >
            <Text style={styles.saveText}>ถัดไป</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    flexGrow: 1,
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
  },

  progressTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#D8D0C0",
    borderRadius: 8,
  },

  progressFill: {
    height: "100%",
    backgroundColor: ORANGE,
  },

  subtitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    marginBottom: 16,
  },

  listContainer: {
    marginTop: 8,
    gap: 12,
  },

  cuisineItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  cuisineItemUnselected: {
    backgroundColor: "#EBA032",
    borderWidth: 1.5,
    borderColor: "#EBA032",
  },

  cuisineItemSelected: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#EBA032",
  },

  cuisineText: {
    fontSize: 18,
    fontWeight: "700",
  },

  cuisineTextUnselected: {
    color: "#FFF",
  },

  cuisineTextSelected: {
    color: "#222",
  },

  spacer: {
    flex: 1,
    minHeight: 80,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  backButton: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

  backText: {
    fontWeight: "900",
    color: "#222",
    fontSize: 16,
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
    fontSize: 16,
  },
});